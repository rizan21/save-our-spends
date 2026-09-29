export type SplitType = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'lodging'
  | 'entertainment'
  | 'groceries'
  | 'utilities'
  | 'shopping'
  | 'general';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  paidBy: Record<string, number>; // email -> amount paid
  splitType: SplitType;
  splits: Record<string, number>; // email -> exact amount owed
  splitMeta?: Record<string, number>; // raw shares or percentages
  notes?: string;
  createdBy: string;
  createdAt: string;
  status: 'ACTIVE' | 'DELETED';
}

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Bank Transfer'
  | 'Digital Wallet'
  | 'Other';

export interface Settlement {
  id: string;
  date: string; // YYYY-MM-DD
  payerEmail: string;
  payerName: string;
  payeeEmail: string;
  payeeName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  status: 'ACTIVE' | 'DELETED';
}
