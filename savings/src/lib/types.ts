export type AccountKind = "bank" | "wallet" | "cash";
export type NeedWant = "Need" | "Want" | "Savings / Debt";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  initial: number;
  transferFee?: number; // optional per-bank default fee when sending money out (blank = global default)
  withdrawFee?: number; // optional per-bank default fee when withdrawing cash (blank = global default)
  color: string;
}

export interface Category {
  id: string;
  name: string;
  target: number; // monthly target (₱)
  needWant: NeedWant;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "date";
  options: string[];
  appliesTo: "expense" | "income" | "both";
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  item: string;
  accountId: string;
  amount: number;
  needWant: NeedWant;
  remarks: string;
  extra: Record<string, string>;
}

export interface Income {
  id: string;
  date: string;
  category: string;
  item: string;
  accountId: string;
  amount: number;
  remarks: string;
  extra: Record<string, string>;
}

export interface Transfer {
  id: string;
  date: string;
  kind: "transfer" | "withdraw";
  fromId: string;
  toId: string;
  amount: number;
  fee: number;
  remarks: string;
}

export interface Settings {
  categories: Category[];
  incomeCategories: string[];
  fields: CustomField[];
  defaultTransferFee: number;
  defaultWithdrawFee: number;
  scriptUrl: string;
  passcode: string;
}

export interface AppData {
  settings: Settings;
  accounts: Account[];
  expenses: Expense[];
  income: Income[];
  transfers: Transfer[];
}

export type Collection = "accounts" | "expenses" | "income" | "transfers" | "config";

export interface Op {
  t: "upsert" | "delete";
  c: Collection;
  id: string;
  row?: Record<string, unknown>;
}
