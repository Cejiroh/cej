import type { AppData, Account, Category } from "./types";

// Seeded from 2026_XZEE_Enhanced_Budget_Tracker.xlsx (Master Budget Planner, Income & Accounts, Settings)
const acc = (n: number, name: string, kind: Account["kind"], color: string): Account => ({
  id: `ACC-${String(n).padStart(2, "0")}`,
  name,
  kind,
  initial: 0,
  color,
});

export const seedAccounts: Account[] = [
  acc(1, "PSB", "bank", "#1f5c4a"),
  acc(2, "UB (UnionBank)", "bank", "#e0742f"),
  acc(3, "LBP (Landbank)", "bank", "#3b8a4e"),
  acc(4, "MBTC (Metrobank)", "bank", "#2f5fa8"),
  acc(5, "GCash", "wallet", "#2b7fe0"),
  acc(6, "CoH (Cash on Hand)", "cash", "#b0872a"),
  acc(7, "PSB - Jec", "bank", "#4a7d6e"),
  acc(8, "CoH - Jec", "cash", "#c99a3c"),
  acc(9, "Maribank", "bank", "#8a5aa8"),
  acc(10, "USSC", "bank", "#a8432f"),
];

const cat = (n: number, name: string, target: number, needWant: Category["needWant"]): Category => ({
  id: `CAT-${String(n).padStart(2, "0")}`,
  name,
  target,
  needWant,
});

export const seedCategories: Category[] = [
  cat(1, "Church Offering & Donations", 2000, "Need"),
  cat(2, "Housing & Sta. Rosa Loan", 7505, "Need"),
  cat(3, "Electricity", 9000, "Need"),
  cat(4, "Water Bill", 400, "Need"),
  cat(5, "Internet & Mobile", 1400, "Need"),
  cat(6, "Grocery & Wet Market", 9000, "Need"),
  cat(7, "Eat-Out & Food Delivery", 2000, "Want"),
  cat(8, "Transportation & Fare", 500, "Need"),
  cat(9, "Fuel & Toll", 1000, "Need"),
  cat(10, "Aster / Baby Basic Needs", 3000, "Need"),
  cat(11, "Medical, Health & Prescription", 2400, "Need"),
  cat(12, "Government Contributions (SSS/PAGIBIG)", 1500, "Need"),
  cat(13, "Shopee / Lazada Purchases", 500, "Want"),
  cat(14, "Personal & Leisure", 1500, "Want"),
  cat(15, "House & Car Maintenance", 200, "Need"),
  cat(16, "Savings & Future Goals", 4000, "Savings / Debt"),
  cat(17, "Credit Card Settlement", 0, "Savings / Debt"),
  cat(18, "Other Unexpected Expenses", 0, "Need"),
];

export const seedData = (): AppData => ({
  settings: {
    categories: seedCategories,
    incomeCategories: [
      "Salary & Payouts",
      "Freelance & Side Income",
      "Reimbursement / Refund",
      "Investments & Interest",
      "Account Transfer / Deposit",
      "Other Income",
    ],
    fields: [
      {
        id: "FLD-METHOD",
        label: "Payment Method",
        type: "select",
        options: ["Cash", "Debit Card", "Credit Card", "GCash", "Maya / Maribank", "Bank Transfer", "Online Banking"],
        appliesTo: "expense",
      },
    ],
    defaultTransferFee: 0,
    defaultWithdrawFee: 0,
    scriptUrl: "",
    passcode: "",
  },
  accounts: seedAccounts,
  expenses: [],
  income: [
    { id: "INC-001", date: "2026-01-01", category: "Other Income", item: "Starting Balance Setup", accountId: "ACC-06", amount: 9888, remarks: "Initial Cash setup", extra: {} },
    { id: "INC-002", date: "2026-01-08", category: "Account Transfer / Deposit", item: "GCash Cash-In", accountId: "ACC-05", amount: 366, remarks: "E-wallet cash-in", extra: {} },
    { id: "INC-003", date: "2026-01-09", category: "Reimbursement / Refund", item: "Company Reimbursement", accountId: "ACC-02", amount: 1000, remarks: "Medical reimbursement", extra: {} },
  ],
  transfers: [],
});
