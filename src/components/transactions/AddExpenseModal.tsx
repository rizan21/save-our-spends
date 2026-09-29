import React, { useState, useMemo, useCallback } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CategoryIcon } from '../common/CategoryIcon';
import { UserAvatar } from '../common/UserAvatar';
import {
  calculateEqualSplit,
  calculateExactSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  validatePaidBy,
  roundToCents,
  formatCurrency,
} from '../../core/splitCalculator';
import type { Member } from '../../types/group';
import type { Expense, ExpenseCategory, SplitType } from '../../types/transaction';
import {
  Calendar,
  FileText,
  Check,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Users,
  CheckCircle2,
  Percent,
  Hash,
  DollarSign,
} from 'lucide-react';

export interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUserEmail: string;
  defaultCurrency: string;
  onAddExpense: (expense: Expense) => Promise<unknown>;
}

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'lodging',
  'entertainment',
  'groceries',
  'utilities',
  'shopping',
  'general',
];

type Step = 1 | 2 | 3;

interface StepDef {
  step: Step;
  title: string;
  subtitle: string;
}

const STEPS: StepDef[] = [
  { step: 1, title: 'Amount', subtitle: 'Expense details' },
  { step: 2, title: 'Who Paid', subtitle: 'Payer amounts' },
  { step: 3, title: 'Who Owes', subtitle: 'Split method' },
];

export function AddExpenseModal({
  isOpen,
  onClose,
  members,
  currentUserEmail,
  defaultCurrency,
  onAddExpense,
}: AddExpenseModalProps) {
  // Wizard navigation
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1: Expense Details
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Default payer fallback
  const defaultPayerEmail = useMemo(() => {
    if (members.some((m) => m.email === currentUserEmail)) {
      return currentUserEmail;
    }
    return members[0]?.email || '';
  }, [members, currentUserEmail]);

  // Step 2: Payer State
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [singlePayerEmail, setSinglePayerEmail] = useState(defaultPayerEmail);
  const [multiPayerAmounts, setMultiPayerAmounts] = useState<Record<string, string>>({});

  // Step 3: Split State
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [includedMembers, setIncludedMembers] = useState<string[]>(() =>
    members.map((m) => m.email)
  );
  const [exactInputs, setExactInputs] = useState<Record<string, string>>({});
  const [percentageInputs, setPercentageInputs] = useState<Record<string, string>>({});
  const [shareInputs, setShareInputs] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Total amount parsed
  const totalAmount = parseFloat(amountStr) || 0;

  // Track modal opening to reset wizard step and errors without calling setState in an effect
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentStep(1);
      setStepError(null);
      setSubmitError(null);
      if (!singlePayerEmail && defaultPayerEmail) {
        setSinglePayerEmail(defaultPayerEmail);
      }
      if (includedMembers.length === 0 && members.length > 0) {
        setIncludedMembers(members.map((m) => m.email));
      }
    }
  }

  // Helper to get display name
  const getMemberName = useCallback(
    (email: string) => {
      const member = members.find((m) => m.email === email);
      return member?.name || email.split('@')[0];
    },
    [members]
  );

  // Step 1 Validation
  const isStep1Valid = totalAmount > 0 && description.trim().length > 0;

  // Step 2 Calculations & Validation
  const sumPaid = useMemo(() => {
    if (!isMultiPayer) return totalAmount;
    return Object.values(multiPayerAmounts).reduce((acc, str) => {
      const val = parseFloat(str || '0') || 0;
      return acc + (val > 0 ? val : 0);
    }, 0);
  }, [isMultiPayer, totalAmount, multiPayerAmounts]);

  const payerRemaining = roundToCents(totalAmount - sumPaid);

  const payerValidation = useMemo((): {
    isValid: boolean;
    error?: string;
    difference?: number;
    paidBy: Record<string, number>;
  } => {
    if (totalAmount <= 0) {
      return { isValid: false, error: 'Total amount must be greater than 0', paidBy: {} };
    }

    if (!isMultiPayer) {
      if (!singlePayerEmail) {
        return { isValid: false, error: 'Please select who paid', paidBy: {} };
      }
      return {
        isValid: true,
        paidBy: { [singlePayerEmail]: roundToCents(totalAmount) },
        difference: 0,
      };
    }

    const paidBy: Record<string, number> = {};
    for (const m of members) {
      const val = parseFloat(multiPayerAmounts[m.email] || '0') || 0;
      if (val > 0) paidBy[m.email] = roundToCents(val);
    }

    const val = validatePaidBy(totalAmount, paidBy);
    return {
      isValid: val.isValid,
      error: val.error,
      difference: val.difference,
      paidBy,
    };
  }, [isMultiPayer, singlePayerEmail, multiPayerAmounts, totalAmount, members]);

  const isStep2Valid = isStep1Valid && payerValidation.isValid;

  // Step 3 Calculations & Validation
  const splitResult = useMemo(() => {
    if (totalAmount <= 0) {
      return { splits: {}, isValid: false, error: 'Enter an amount greater than 0' };
    }

    if (splitType === 'EQUAL') {
      if (includedMembers.length === 0) {
        return { splits: {}, isValid: false, error: 'Select at least one participant' };
      }
      return calculateEqualSplit(totalAmount, includedMembers);
    }

    if (splitType === 'EXACT') {
      const parsed = Object.fromEntries(
        members.map((m) => [m.email, parseFloat(exactInputs[m.email] || '0') || 0])
      );
      return calculateExactSplit(totalAmount, parsed);
    }

    if (splitType === 'PERCENTAGE') {
      const parsed = Object.fromEntries(
        members.map((m) => [m.email, parseFloat(percentageInputs[m.email] || '0') || 0])
      );
      return calculatePercentageSplit(totalAmount, parsed);
    }

    if (splitType === 'SHARES') {
      const parsed = Object.fromEntries(
        members.map((m) => [m.email, parseInt(shareInputs[m.email] || '1', 10) || 1])
      );
      return calculateSharesSplit(totalAmount, parsed);
    }

    return { splits: {}, isValid: false, error: 'Invalid split method' };
  }, [totalAmount, splitType, includedMembers, exactInputs, percentageInputs, shareInputs, members]);

  // Exact split totals
  const sumExact = useMemo(() => {
    return Object.values(exactInputs).reduce((acc, str) => {
      const val = parseFloat(str || '0') || 0;
      return acc + (val > 0 ? val : 0);
    }, 0);
  }, [exactInputs]);

  const exactRemaining = roundToCents(totalAmount - sumExact);

  // Percentage split totals
  const sumPercentage = useMemo(() => {
    return Object.values(percentageInputs).reduce((acc, str) => {
      const val = parseFloat(str || '0') || 0;
      return acc + (val > 0 ? val : 0);
    }, 0);
  }, [percentageInputs]);

  // Shares count
  const totalSharesCount = useMemo(() => {
    return members.reduce((acc, m) => {
      const s = parseInt(shareInputs[m.email] || '1', 10);
      return acc + (isNaN(s) || s < 0 ? 0 : s);
    }, 0);
  }, [members, shareInputs]);

  // Net balance impact preview for step 3
  const balancePreview = useMemo(() => {
    return members.map((m) => {
      const paid = payerValidation.paidBy[m.email] || 0;
      const owed = splitResult.splits[m.email] || 0;
      const net = roundToCents(paid - owed);
      return {
        member: m,
        paid,
        owed,
        net,
      };
    });
  }, [members, payerValidation.paidBy, splitResult.splits]);

  // Payer summary description
  const payerSummary = useMemo(() => {
    if (!isMultiPayer) {
      const name = getMemberName(singlePayerEmail);
      return singlePayerEmail === currentUserEmail ? `${name} (You)` : name;
    }
    const paidMembers = Object.entries(payerValidation.paidBy).filter(([, val]) => val > 0);
    if (paidMembers.length === 1) {
      const [email] = paidMembers[0];
      const name = getMemberName(email);
      return email === currentUserEmail ? `${name} (You)` : name;
    }
    return `${paidMembers.length} people`;
  }, [isMultiPayer, singlePayerEmail, payerValidation.paidBy, currentUserEmail, getMemberName]);

  // Navigation handlers
  const goToStep2 = () => {
    if (!description.trim()) {
      setStepError('Please enter a description for the expense');
      return;
    }
    if (totalAmount <= 0) {
      setStepError('Please enter a valid amount greater than 0');
      return;
    }
    setStepError(null);
    setCurrentStep(2);
  };

  const goToStep3 = () => {
    if (!payerValidation.isValid) {
      setStepError(payerValidation.error || 'Payer amounts must equal the total expense amount');
      return;
    }
    setStepError(null);
    setCurrentStep(3);
  };

  const handleStepClick = (targetStep: Step) => {
    if (targetStep === currentStep) return;
    if (targetStep === 1) {
      setStepError(null);
      setCurrentStep(1);
    } else if (targetStep === 2) {
      if (!isStep1Valid) {
        setStepError('Please enter a valid amount and description first');
        return;
      }
      setStepError(null);
      setCurrentStep(2);
    } else if (targetStep === 3) {
      if (!isStep1Valid) {
        setStepError('Please enter a valid amount and description first');
        return;
      }
      if (!payerValidation.isValid) {
        setStepError(payerValidation.error || 'Payer amounts must equal the total expense amount');
        return;
      }
      setStepError(null);
      setCurrentStep(3);
    }
  };

  // Helper: toggle multi-payer
  const handleToggleMultiPayer = (multi: boolean) => {
    setIsMultiPayer(multi);
    setStepError(null);
    if (multi) {
      const hasAny = Object.values(multiPayerAmounts).some((v) => parseFloat(v || '0') > 0);
      if (!hasAny && totalAmount > 0) {
        setMultiPayerAmounts({
          [singlePayerEmail || defaultPayerEmail]: totalAmount.toFixed(2),
        });
      }
    }
  };

  // Helper: assign remaining payer
  const handleAssignRemainingPayer = (email: string) => {
    const cur = parseFloat(multiPayerAmounts[email] || '0') || 0;
    if (payerRemaining > 0) {
      const updated = roundToCents(cur + payerRemaining);
      setMultiPayerAmounts({
        ...multiPayerAmounts,
        [email]: updated.toFixed(2),
      });
      setStepError(null);
    }
  };

  // Helper: split payers equally
  const handleSplitPayersEqually = () => {
    if (totalAmount <= 0 || members.length === 0) return;
    const split = calculateEqualSplit(totalAmount, members.map((m) => m.email));
    const newAmounts: Record<string, string> = {};
    for (const [email, amount] of Object.entries(split.splits)) {
      newAmounts[email] = amount.toFixed(2);
    }
    setMultiPayerAmounts(newAmounts);
    setStepError(null);
  };

  // Helper: toggle equal split member
  const toggleIncludeMember = (email: string) => {
    if (includedMembers.includes(email)) {
      if (includedMembers.length === 1) return; // Keep at least one
      setIncludedMembers(includedMembers.filter((e) => e !== email));
    } else {
      setIncludedMembers([...includedMembers, email]);
    }
  };

  const handleToggleAllMembers = () => {
    if (includedMembers.length === members.length) {
      setIncludedMembers([defaultPayerEmail]);
    } else {
      setIncludedMembers(members.map((m) => m.email));
    }
  };

  // Helper: assign remaining exact
  const handleAssignRemainingExact = (email: string) => {
    const cur = parseFloat(exactInputs[email] || '0') || 0;
    if (exactRemaining > 0) {
      const updated = roundToCents(cur + exactRemaining);
      setExactInputs({
        ...exactInputs,
        [email]: updated.toFixed(2),
      });
      setStepError(null);
    }
  };

  // Helper: split exact equally
  const handleSplitExactEqually = () => {
    if (totalAmount <= 0 || members.length === 0) return;
    const split = calculateEqualSplit(totalAmount, members.map((m) => m.email));
    const newAmounts: Record<string, string> = {};
    for (const [email, amount] of Object.entries(split.splits)) {
      newAmounts[email] = amount.toFixed(2);
    }
    setExactInputs(newAmounts);
    setStepError(null);
  };

  // Helper: split percentage equally
  const handleSplitPercentageEqually = () => {
    if (members.length === 0) return;
    const n = members.length;
    const base = Math.floor((100 / n) * 10) / 10;
    const remainder = roundToCents(100 - base * n);
    const newPcts: Record<string, string> = {};
    members.forEach((m, idx) => {
      const val = idx === 0 ? roundToCents(base + remainder) : base;
      newPcts[m.email] = val.toString();
    });
    setPercentageInputs(newPcts);
    setStepError(null);
  };

  // Helper: reset shares
  const handleResetShares = () => {
    const newShares: Record<string, string> = {};
    for (const m of members) {
      newShares[m.email] = '1';
    }
    setShareInputs(newShares);
    setStepError(null);
  };

  // Form submission
  const handleSubmit = async () => {
    if (!description.trim()) {
      setStepError('Please enter a description');
      setCurrentStep(1);
      return;
    }
    if (totalAmount <= 0) {
      setStepError('Please enter a valid amount');
      setCurrentStep(1);
      return;
    }
    if (!payerValidation.isValid) {
      setStepError(payerValidation.error || 'Payer amounts do not sum to total');
      setCurrentStep(2);
      return;
    }
    if (!splitResult.isValid) {
      setSubmitError(splitResult.error || 'Splits are invalid');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const expense: Expense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      description: description.trim(),
      category,
      amount: roundToCents(totalAmount),
      currency: defaultCurrency,
      paidBy: payerValidation.paidBy,
      splitType,
      splits: splitResult.splits,
      notes: notes.trim() || undefined,
      createdBy: currentUserEmail,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    try {
      await onAddExpense(expense);
      // Reset form
      setDescription('');
      setAmountStr('');
      setNotes('');
      setMultiPayerAmounts({});
      setExactInputs({});
      setPercentageInputs({});
      setShareInputs({});
      setIsMultiPayer(false);
      setCurrentStep(1);
      onClose();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      goToStep2();
    } else if (currentStep === 2) {
      goToStep3();
    } else if (currentStep === 3) {
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add an Expense" maxWidth="lg">
      <form onSubmit={handleFormSubmit} className="space-y-5">
        {/* Wizard Stepper */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const isCurrent = currentStep === s.step;
              const isCompleted = currentStep > s.step;
              const isClickable =
                s.step === 1 ||
                (s.step === 2 && isStep1Valid) ||
                (s.step === 3 && isStep2Valid);

              return (
                <React.Fragment key={s.step}>
                  <button
                    type="button"
                    disabled={!isClickable}
                    onClick={() => handleStepClick(s.step)}
                    className={`flex items-center gap-2.5 transition-all text-left group ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                    </div>
                    <div>
                      <div
                        className={`text-xs font-semibold leading-tight ${
                          isCurrent
                            ? 'text-emerald-700'
                            : isCompleted
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight hidden sm:block">
                        {s.subtitle}
                      </div>
                    </div>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full transition-colors ${
                        currentStep > idx + 1 ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Banners */}
        {stepError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}
        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 1: Amount & Expense Details                          */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Amount Input (Hero) */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-center transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Total Amount ({defaultCurrency})
              </label>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-slate-400">{defaultCurrency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (stepError) setStepError(null);
                  }}
                  className="text-3xl font-extrabold text-slate-900 bg-transparent text-center focus:outline-none w-48 placeholder:text-slate-300"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Description & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="What was this for? (e.g. Dinner, Fuel, Groceries)"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (stepError) setStepError(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                  required
                />
              </div>
            </div>

            {/* Category Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer ${
                      category === cat
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CategoryIcon category={cat} size="sm" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Add receipt details, notes or comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Page 1 Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={goToStep2} className="gap-2">
                <span>Next: Who Paid</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 2: Who Paid and How Much                             */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Context Summary Banner */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <CategoryIcon category={category} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {description || 'Expense'}
                  </div>
                  <div className="text-[11px] text-slate-500">{date}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Total to allocate</div>
                <div className="text-sm font-extrabold text-emerald-800">
                  {formatCurrency(totalAmount, defaultCurrency)}
                </div>
              </div>
            </div>

            {/* Mode Switcher: Single vs Multi */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Payment type</label>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => handleToggleMultiPayer(false)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    !isMultiPayer
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Single Payer
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMultiPayer(true)}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    isMultiPayer
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Multiple Payers
                </button>
              </div>
            </div>

            {/* Single Payer View */}
            {!isMultiPayer ? (
              <div className="space-y-2">
                <span className="text-[11px] text-slate-500 block">
                  Select who paid the full {formatCurrency(totalAmount, defaultCurrency)}:
                </span>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isSelected = singlePayerEmail === m.email;
                    const isMe = m.email === currentUserEmail;

                    return (
                      <button
                        key={m.email}
                        type="button"
                        onClick={() => {
                          setSinglePayerEmail(m.email);
                          if (stepError) setStepError(null);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar name={m.name || m.email} picture={m.picture} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                              <span>{m.name || m.email}</span>
                              {isMe && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSelected && (
                            <span className="text-xs font-bold text-emerald-700">
                              Paid {formatCurrency(totalAmount, defaultCurrency)}
                            </span>
                          )}
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Multiple Payers View */
              <div className="space-y-3">
                {/* Allocation status bar */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    payerValidation.isValid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : payerRemaining > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {payerValidation.isValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold">
                        Total Paid: {formatCurrency(sumPaid, defaultCurrency)} of{' '}
                        {formatCurrency(totalAmount, defaultCurrency)}
                      </div>
                      <div className="text-[11px] opacity-90">
                        {payerValidation.isValid
                          ? 'Exact match! All payments accounted for.'
                          : payerRemaining > 0
                          ? `Remaining to allocate: ${formatCurrency(payerRemaining, defaultCurrency)}`
                          : `Over-allocated by: ${formatCurrency(Math.abs(payerRemaining), defaultCurrency)}`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSplitPayersEqually}
                    className="text-[11px] font-semibold underline hover:opacity-80 shrink-0 cursor-pointer ml-2"
                  >
                    Split equally
                  </button>
                </div>

                {/* Member Input Rows */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const isMe = m.email === currentUserEmail;
                    const val = multiPayerAmounts[m.email] || '';

                    return (
                      <div
                        key={m.email}
                        className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <UserAvatar name={m.name || m.email} picture={m.picture} size="xs" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                              <span>{m.name || m.email}</span>
                              {isMe && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{m.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {payerRemaining > 0 && (
                            <button
                              type="button"
                              onClick={() => handleAssignRemainingPayer(m.email)}
                              className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-md transition-colors cursor-pointer"
                              title="Assign the remaining unallocated amount to this person"
                            >
                              + Remainder
                            </button>
                          )}
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                            <span className="text-slate-400 text-xs font-medium">
                              {defaultCurrency}
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={val}
                              onChange={(e) => {
                                setMultiPayerAmounts({
                                  ...multiPayerAmounts,
                                  [m.email]: e.target.value,
                                });
                                if (stepError) setStepError(null);
                              }}
                              className="w-20 text-right text-xs font-semibold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Page 2 Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStepError(null);
                  setCurrentStep(1);
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={goToStep3}
                disabled={!payerValidation.isValid}
                className="gap-2"
              >
                <span>Next: Who Owes</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PAGE 3: Who Owes and How (Split Method)                   */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Context Summary Banner */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <CategoryIcon category={category} size="sm" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {description || 'Expense'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Paid by <span className="font-semibold text-slate-700">{payerSummary}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Total to split</div>
                <div className="text-sm font-extrabold text-emerald-800">
                  {formatCurrency(totalAmount, defaultCurrency)}
                </div>
              </div>
            </div>

            {/* Split Type Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">Split method</label>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  {(
                    [
                      { type: 'EQUAL', label: 'Equally', icon: Users },
                      { type: 'EXACT', label: 'Exact', icon: DollarSign },
                      { type: 'PERCENTAGE', label: 'Percentage', icon: Percent },
                      { type: 'SHARES', label: 'Shares', icon: Hash },
                    ] as const
                  ).map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSplitType(type)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        splitType === type
                          ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1. Equal Split Form */}
              {splitType === 'EQUAL' && (
                <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500">
                      Select who shares this expense ({includedMembers.length} of {members.length}):
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleAllMembers}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {includedMembers.length === members.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {members.map((m) => {
                      const isChecked = includedMembers.includes(m.email);
                      const share = splitResult.splits[m.email];
                      const isMe = m.email === currentUserEmail;

                      return (
                        <button
                          key={m.email}
                          type="button"
                          onClick={() => toggleIncludeMember(m.email)}
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            isChecked
                              ? 'border-emerald-300 bg-white text-slate-900 shadow-xs'
                              : 'border-slate-200 bg-slate-100/60 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <UserAvatar name={m.name || m.email} picture={m.picture} size="xs" />
                            <span className="truncate">
                              {m.name || m.email} {isMe ? '(You)' : ''}
                            </span>
                          </div>
                          {isChecked && share !== undefined && (
                            <span className="font-semibold text-emerald-700 shrink-0 ml-1">
                              {formatCurrency(share, defaultCurrency)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Exact Amounts Split Form */}
              {splitType === 'EXACT' && (
                <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Status header */}
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      splitResult.isValid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">
                        Allocated: {formatCurrency(sumExact, defaultCurrency)} /{' '}
                        {formatCurrency(totalAmount, defaultCurrency)}
                      </span>
                      {!splitResult.isValid && exactRemaining !== 0 && (
                        <div className="text-[11px] mt-0.5">
                          {exactRemaining > 0
                            ? `Remaining to allocate: ${formatCurrency(exactRemaining, defaultCurrency)}`
                            : `Over-allocated by: ${formatCurrency(Math.abs(exactRemaining), defaultCurrency)}`}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSplitExactEqually}
                      className="text-[11px] font-semibold underline hover:opacity-80 cursor-pointer shrink-0 ml-2"
                    >
                      Split equally
                    </button>
                  </div>

                  {/* Member Rows */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {members.map((m) => {
                      const isMe = m.email === currentUserEmail;
                      const val = exactInputs[m.email] || '';

                      return (
                        <div
                          key={m.email}
                          className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <UserAvatar name={m.name || m.email} picture={m.picture} size="xs" />
                            <span className="text-slate-700 truncate">
                              {m.name || m.email} {isMe ? '(You)' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {exactRemaining > 0 && (
                              <button
                                type="button"
                                onClick={() => handleAssignRemainingExact(m.email)}
                                className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer"
                              >
                                + Remainder
                              </button>
                            )}
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                              <span className="text-slate-400">{defaultCurrency}</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={val}
                                onChange={(e) =>
                                  setExactInputs({ ...exactInputs, [m.email]: e.target.value })
                                }
                                className="w-20 px-1 text-right bg-transparent text-xs font-semibold focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Percentage Split Form */}
              {splitType === 'PERCENTAGE' && (
                <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Status header */}
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      Math.abs(sumPercentage - 100) < 0.01
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div>
                      <span className="font-semibold">Total: {sumPercentage.toFixed(1)}% / 100%</span>
                      {Math.abs(sumPercentage - 100) >= 0.01 && (
                        <div className="text-[11px] mt-0.5">
                          {sumPercentage < 100
                            ? `Remaining: ${(100 - sumPercentage).toFixed(1)}%`
                            : `Over by: ${(sumPercentage - 100).toFixed(1)}%`}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSplitPercentageEqually}
                      className="text-[11px] font-semibold underline hover:opacity-80 cursor-pointer shrink-0 ml-2"
                    >
                      Split equally
                    </button>
                  </div>

                  {/* Member Rows */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {members.map((m) => {
                      const isMe = m.email === currentUserEmail;
                      const share = splitResult.splits[m.email] || 0;
                      const val = percentageInputs[m.email] || '';

                      return (
                        <div
                          key={m.email}
                          className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <UserAvatar name={m.name || m.email} picture={m.picture} size="xs" />
                            <span className="text-slate-700 truncate">
                              {m.name || m.email} {isMe ? '(You)' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={val}
                                onChange={(e) =>
                                  setPercentageInputs({
                                    ...percentageInputs,
                                    [m.email]: e.target.value,
                                  })
                                }
                                className="w-14 text-right bg-transparent text-xs font-semibold focus:outline-none"
                              />
                              <span className="text-slate-400">%</span>
                            </div>
                            <span className="text-slate-500 w-16 text-right font-medium">
                              {formatCurrency(share, defaultCurrency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Shares Split Form */}
              {splitType === 'SHARES' && (
                <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {/* Status header */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-700">
                      Total: {totalSharesCount} share{totalSharesCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetShares}
                      className="text-[11px] font-semibold text-emerald-700 underline hover:opacity-80 cursor-pointer shrink-0 ml-2"
                    >
                      Reset to 1 each
                    </button>
                  </div>

                  {/* Member Rows */}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {members.map((m) => {
                      const isMe = m.email === currentUserEmail;
                      const share = splitResult.splits[m.email] || 0;
                      const val = shareInputs[m.email] || '1';

                      return (
                        <div
                          key={m.email}
                          className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <UserAvatar name={m.name || m.email} picture={m.picture} size="xs" />
                            <span className="text-slate-700 truncate">
                              {m.name || m.email} {isMe ? '(You)' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2 py-1">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="1"
                                value={val}
                                onChange={(e) =>
                                  setShareInputs({ ...shareInputs, [m.email]: e.target.value })
                                }
                                className="w-12 text-center bg-transparent text-xs font-semibold focus:outline-none"
                              />
                              <span className="text-slate-400">shares</span>
                            </div>
                            <span className="text-slate-500 w-16 text-right font-medium">
                              {formatCurrency(share, defaultCurrency)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Net Balance Impact Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Net Impact for this Expense
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {balancePreview.map(({ member, paid, owed, net }) => {
                  const isMe = member.email === currentUserEmail;

                  return (
                    <div
                      key={member.email}
                      className="p-2 bg-white border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <UserAvatar name={member.name || member.email} picture={member.picture} size="xs" />
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">
                            {member.name || member.email} {isMe ? '(You)' : ''}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Paid {formatCurrency(paid, defaultCurrency)} • Owes{' '}
                            {formatCurrency(owed, defaultCurrency)}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {net > 0.005 ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            +{formatCurrency(net, defaultCurrency)}
                          </span>
                        ) : net < -0.005 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            -{formatCurrency(Math.abs(net), defaultCurrency)}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {formatCurrency(0, defaultCurrency)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Page 3 Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStepError(null);
                  setCurrentStep(2);
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                disabled={!splitResult.isValid}
                className="gap-1.5"
              >
                <span>Save Expense to Sheet</span>
              </Button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
