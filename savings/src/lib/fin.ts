import type { Account, AppData } from "./types";

export const peso = (n: number, opts: { sign?: boolean; compact?: boolean } = {}) => {
  const v = Number.isFinite(n) ? n : 0;
  const abs = Math.abs(v);
  const body = abs.toLocaleString("en-PH", {
    minimumFractionDigits: opts.compact && abs >= 1000 ? 0 : abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const s = v < 0 ? "−" : opts.sign && v > 0 ? "+" : "";
  return `${s}₱${body}`;
};

const pad = (n: number) => String(n).padStart(2, "0");
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISO(new Date());
export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const monthKey = (iso: string) => iso.slice(0, 7);
export const addDays = (iso: string, n: number) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const addMonths = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
export const monthLabel = (key: string) =>
  parseISO(key + "-01").toLocaleDateString("en-PH", { month: "long", year: "numeric" });
export const dayLabel = (iso: string) =>
  parseISO(iso).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
export const shortDay = (iso: string) =>
  parseISO(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

export function balances(data: AppData): Record<string, number> {
  const b: Record<string, number> = {};
  data.accounts.forEach((a) => (b[a.id] = a.initial));
  data.income.forEach((i) => (b[i.accountId] = (b[i.accountId] ?? 0) + i.amount));
  data.expenses.forEach((e) => (b[e.accountId] = (b[e.accountId] ?? 0) - e.amount));
  data.transfers.forEach((t) => {
    b[t.fromId] = (b[t.fromId] ?? 0) - t.amount - t.fee;
    b[t.toId] = (b[t.toId] ?? 0) + t.amount;
  });
  return b;
}

export const accName = (accounts: Account[], id: string) => accounts.find((a) => a.id === id)?.name ?? "Unknown";

export const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};
