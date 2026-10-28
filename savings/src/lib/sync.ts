import type { AppData, Account, Category, CustomField, Expense, Income, Op, Settings, Transfer } from "./types";
import { num } from "./fin";

/* ---------- row <-> record mapping (flat rows for Google Sheets) ---------- */

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

function extraOut(extra: Record<string, string>, fields: CustomField[]) {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(extra ?? {})) {
    const label = fields.find((f) => f.id === k)?.label ?? k;
    o[`x_${k}__${label}`] = v;
  }
  return o;
}
function extraIn(row: Record<string, unknown>) {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith("x_") && v !== "" && v !== undefined) {
      const id = k.slice(2).split("__")[0];
      o[id] = str(v);
    }
  }
  return o;
}

export const toRow = {
  account: (a: Account) => ({ ...a, transferFee: a.transferFee ?? "", withdrawFee: a.withdrawFee ?? "" }),
  expense: (e: Expense, data: AppData) => ({
    id: e.id, date: e.date, category: e.category, item: e.item,
    account: data.accounts.find((a) => a.id === e.accountId)?.name ?? "", accountId: e.accountId,
    amount: e.amount, needWant: e.needWant, remarks: e.remarks, ...extraOut(e.extra, data.settings.fields),
  }),
  income: (i: Income, data: AppData) => ({
    id: i.id, date: i.date, category: i.category, item: i.item,
    account: data.accounts.find((a) => a.id === i.accountId)?.name ?? "", accountId: i.accountId,
    amount: i.amount, remarks: i.remarks, ...extraOut(i.extra, data.settings.fields),
  }),
  transfer: (t: Transfer, data: AppData) => ({
    id: t.id, date: t.date, kind: t.kind,
    from: data.accounts.find((a) => a.id === t.fromId)?.name ?? "", fromId: t.fromId,
    to: data.accounts.find((a) => a.id === t.toId)?.name ?? "", toId: t.toId,
    amount: t.amount, fee: t.fee, remarks: t.remarks,
  }),
  config: (key: string, value: unknown) => ({ id: key, value: JSON.stringify(value) }),
};

export const settingsOps = (s: Settings): Op[] => {
  const { scriptUrl: _u, passcode: _p, ...shared } = s; // connection stays on this device
  return Object.entries(shared).map(([k, v]) => ({ t: "upsert", c: "config", id: k, row: toRow.config(k, v) }));
};

export function fromSheet(raw: Record<string, Record<string, unknown>[]>, prev: AppData): AppData {
  const accounts: Account[] = (raw.accounts ?? []).map((r) => ({
    id: str(r.id), name: str(r.name), kind: (str(r.kind) || "bank") as Account["kind"],
    initial: num(r.initial),
    transferFee: r.transferFee === "" || r.transferFee == null ? undefined : num(r.transferFee),
    withdrawFee: r.withdrawFee === "" || r.withdrawFee == null ? undefined : num(r.withdrawFee),
    color: str(r.color) || "#1f5c4a",
  }));
  const expenses: Expense[] = (raw.expenses ?? []).map((r) => ({
    id: str(r.id), date: str(r.date).slice(0, 10), category: str(r.category), item: str(r.item),
    accountId: str(r.accountId), amount: num(r.amount),
    needWant: (str(r.needWant) || "Need") as Expense["needWant"], remarks: str(r.remarks), extra: extraIn(r),
  }));
  const income: Income[] = (raw.income ?? []).map((r) => ({
    id: str(r.id), date: str(r.date).slice(0, 10), category: str(r.category), item: str(r.item),
    accountId: str(r.accountId), amount: num(r.amount), remarks: str(r.remarks), extra: extraIn(r),
  }));
  const transfers: Transfer[] = (raw.transfers ?? []).map((r) => ({
    id: str(r.id), date: str(r.date).slice(0, 10), kind: (str(r.kind) || "transfer") as Transfer["kind"],
    fromId: str(r.fromId), toId: str(r.toId), amount: num(r.amount), fee: num(r.fee), remarks: str(r.remarks),
  }));
  const settings: Settings = { ...prev.settings };
  for (const r of raw.config ?? []) {
    try {
      (settings as unknown as Record<string, unknown>)[str(r.id)] = JSON.parse(str(r.value));
    } catch { /* ignore malformed */ }
  }
  settings.categories = (settings.categories ?? []) as Category[];
  return { settings, accounts, expenses, income, transfers };
}

/* ---------- network ---------- */

interface Conn { url: string; passcode: string }

async function parse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The link did not return data. Check it is the Web app URL and access is set to “Anyone”.");
  }
}

export async function ping(c: Conn) {
  const u = new URL(c.url);
  u.searchParams.set("action", "ping");
  if (c.passcode) u.searchParams.set("passcode", c.passcode);
  const j = await parse(await fetch(u.toString()));
  if (!j.ok) throw new Error(j.error || "Failed");
  return true;
}

export async function pull(c: Conn) {
  const u = new URL(c.url);
  if (c.passcode) u.searchParams.set("passcode", c.passcode);
  const j = await parse(await fetch(u.toString()));
  if (!j.ok) throw new Error(j.error || "Failed");
  return j.data as Record<string, Record<string, unknown>[]>;
}

export async function push(c: Conn, ops: Op[]) {
  // text/plain keeps this a "simple" request → no CORS preflight (Apps Script cannot answer OPTIONS)
  const res = await fetch(c.url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ passcode: c.passcode, ops }),
  });
  const j = await parse(res);
  if (!j.ok) throw new Error(j.error || "Failed");
}

export function allOps(d: AppData): Op[] {
  const ops: Op[] = [];
  d.accounts.forEach((a) => ops.push({ t: "upsert", c: "accounts", id: a.id, row: toRow.account(a) }));
  d.expenses.forEach((e) => ops.push({ t: "upsert", c: "expenses", id: e.id, row: toRow.expense(e, d) }));
  d.income.forEach((i) => ops.push({ t: "upsert", c: "income", id: i.id, row: toRow.income(i, d) }));
  d.transfers.forEach((t) => ops.push({ t: "upsert", c: "transfers", id: t.id, row: toRow.transfer(t, d) }));
  ops.push(...settingsOps(d.settings));
  return ops;
}
