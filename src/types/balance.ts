export interface MemberBalance {
  email: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = is owed money, negative = owes money
}

export interface SimplifiedDebt {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  amount: number;
  currency: string;
}

export interface GroupFinancialSummary {
  totalSpending: number;
  currency: string;
  balances: Record<string, MemberBalance>;
  simplifiedDebts: SimplifiedDebt[];
}
