import type { MemberBalance, SimplifiedDebt, GroupFinancialSummary } from '../types/balance';
import type { Member } from '../types/group';
import type { Expense, Settlement } from '../types/transaction';
import { roundToCents } from './splitCalculator';

/**
 * Calculates net balances for all members in a group.
 * A positive net balance means the member is owed money.
 * A negative net balance means the member owes money.
 */
export function calculateBalances(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
  currency: string = 'USD'
): GroupFinancialSummary {
  const memberMap: Record<string, string> = {};
  const balances: Record<string, MemberBalance> = {};

  for (const m of members) {
    memberMap[m.email] = m.name || m.email;
    balances[m.email] = {
      email: m.email,
      name: m.name || m.email,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
    };
  }

  let totalSpending = 0;

  // Process Active Expenses
  for (const exp of expenses) {
    if (exp.status === 'DELETED') continue;
    totalSpending += exp.amount;

    // Credits: who paid
    for (const [payerEmail, paidAmount] of Object.entries(exp.paidBy)) {
      if (!balances[payerEmail]) {
        balances[payerEmail] = {
          email: payerEmail,
          name: payerEmail,
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
        };
      }
      balances[payerEmail].totalPaid += paidAmount;
    }

    // Debits: who owes
    for (const [debtorEmail, owedAmount] of Object.entries(exp.splits)) {
      if (!balances[debtorEmail]) {
        balances[debtorEmail] = {
          email: debtorEmail,
          name: debtorEmail,
          totalPaid: 0,
          totalOwed: 0,
          netBalance: 0,
        };
      }
      balances[debtorEmail].totalOwed += owedAmount;
    }
  }

  // Process Active Settlements
  for (const set of settlements) {
    if (set.status === 'DELETED') continue;

    // Payer of settlement gave money -> credits paid
    if (!balances[set.payerEmail]) {
      balances[set.payerEmail] = {
        email: set.payerEmail,
        name: set.payerName || set.payerEmail,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    }
    balances[set.payerEmail].totalPaid += set.amount;

    // Payee of settlement received money -> counts as owed reduction (debits)
    if (!balances[set.payeeEmail]) {
      balances[set.payeeEmail] = {
        email: set.payeeEmail,
        name: set.payeeName || set.payeeEmail,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      };
    }
    balances[set.payeeEmail].totalOwed += set.amount;
  }

  // Calculate Net Balances
  for (const b of Object.values(balances)) {
    b.totalPaid = roundToCents(b.totalPaid);
    b.totalOwed = roundToCents(b.totalOwed);
    b.netBalance = roundToCents(b.totalPaid - b.totalOwed);
  }

  // Determine effective currency:
  // If active transactions have a currency specified, use that so group spending and balances
  // dynamically follow the currency of the transactions.
  const activeTxCurrency =
    expenses.find((exp) => exp.status !== 'DELETED' && exp.currency)?.currency ||
    settlements.find((set) => set.status !== 'DELETED' && set.currency)?.currency;

  const effectiveCurrency = activeTxCurrency || currency || 'USD';

  const simplifiedDebts = simplifyDebts(balances, effectiveCurrency);

  return {
    totalSpending: roundToCents(totalSpending),
    currency: effectiveCurrency,
    balances,
    simplifiedDebts,
  };
}

/**
 * Greedy Min-Cash-Flow algorithm:
 * Reduces arbitrary webs of debts down to minimal direct payments.
 */
export function simplifyDebts(
  balances: Record<string, MemberBalance>,
  currency: string = 'USD'
): SimplifiedDebt[] {
  // Separate into debtors (net < 0) and creditors (net > 0) using cents to avoid float drift
  interface PersonBalance {
    email: string;
    name: string;
    cents: number;
  }

  const debtors: PersonBalance[] = [];
  const creditors: PersonBalance[] = [];

  for (const b of Object.values(balances)) {
    const cents = Math.round(b.netBalance * 100);
    if (cents < 0) {
      debtors.push({ email: b.email, name: b.name, cents: -cents }); // store as positive debt
    } else if (cents > 0) {
      creditors.push({ email: b.email, name: b.name, cents });
    }
  }

  const debts: SimplifiedDebt[] = [];

  // Greedy match largest debtor with largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort((a, b) => b.cents - a.cents);
    creditors.sort((a, b) => b.cents - a.cents);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const settledCents = Math.min(debtor.cents, creditor.cents);
    if (settledCents > 0) {
      debts.push({
        fromEmail: debtor.email,
        fromName: debtor.name,
        toEmail: creditor.email,
        toName: creditor.name,
        amount: roundToCents(settledCents / 100),
        currency,
      });
    }

    debtor.cents -= settledCents;
    creditor.cents -= settledCents;

    if (debtor.cents === 0) {
      debtors.shift();
    }
    if (creditor.cents === 0) {
      creditors.shift();
    }
  }

  return debts;
}
