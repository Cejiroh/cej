import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Account, AppData, Collection, Expense, Income, Op, Settings, Transfer } from "./types";
import { seedData } from "./seed";
import { allOps, fromSheet, ping, pull, push, settingsOps, toRow } from "./sync";
import { balances } from "./fin";

const DATA_KEY = "ipon:data:v1";
const QUEUE_KEY = "ipon:queue:v1";

export type SyncState = "off" | "idle" | "syncing" | "error";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full / blocked */ }
}

interface Store {
  data: AppData;
  balances: Record<string, number>;
  sync: { state: SyncState; message: string; pending: number; last: string };
  saveExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;
  saveIncome: (i: Income) => void;
  deleteIncome: (id: string) => void;
  saveTransfer: (t: Transfer) => void;
  deleteTransfer: (id: string) => void;
  saveAccount: (a: Account) => void;
  deleteAccount: (id: string) => string | null;
  updateSettings: (patch: Partial<Settings>) => void;
  renameCategory: (from: string, to: string) => void;
  testConnection: (url: string, passcode: string) => Promise<void>;
  syncNow: () => Promise<void>;
  uploadAll: () => Promise<void>;
  resetLocal: () => void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("StoreProvider missing");
  return s;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const d = load<AppData | null>(DATA_KEY, null);
    return d ? { ...d, settings: { ...seedData().settings, ...d.settings } } : seedData();
  });
  const [queue, setQueue] = useState<Op[]>(() => load<Op[]>(QUEUE_KEY, []));
  const [sync, setSync] = useState<Store["sync"]>({ state: "idle", message: "", pending: 0, last: "" });
  const dataRef = useRef(data);
  const queueRef = useRef(queue);
  const flushing = useRef(false);
  dataRef.current = data;
  queueRef.current = queue;

  useEffect(() => save(DATA_KEY, data), [data]);
  useEffect(() => save(QUEUE_KEY, queue), [queue]);

  const connected = !!data.settings.scriptUrl;
  const conn = () => ({ url: dataRef.current.settings.scriptUrl, passcode: dataRef.current.settings.passcode });

  const enqueue = useCallback((ops: Op[]) => {
    setQueue((q) => {
      const next = q.filter((o) => !ops.some((n) => n.c === o.c && n.id === o.id));
      return [...next, ...ops];
    });
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || !dataRef.current.settings.scriptUrl) return;
    if (!queueRef.current.length) return;
    flushing.current = true;
    setSync((s) => ({ ...s, state: "syncing", message: "" }));
    try {
      while (queueRef.current.length) {
        const batch = queueRef.current.slice(0, 25);
        await push(conn(), batch);
        setQueue((q) => q.filter((o) => !batch.includes(o)));
        queueRef.current = queueRef.current.filter((o) => !batch.includes(o));
      }
      setSync((s) => ({ ...s, state: "idle", message: "", last: new Date().toISOString() }));
    } catch (e) {
      setSync((s) => ({ ...s, state: "error", message: (e as Error).message }));
    } finally {
      flushing.current = false;
    }
  }, []);

  // debounce flush whenever the queue changes
  useEffect(() => {
    if (!connected || !queue.length) return;
    const t = setTimeout(flush, 700);
    return () => clearTimeout(t);
  }, [queue, connected, flush]);

  useEffect(() => {
    const on = () => flush();
    window.addEventListener("online", on);
    return () => window.removeEventListener("online", on);
  }, [flush]);

  const syncNow = useCallback(async () => {
    if (!dataRef.current.settings.scriptUrl) return;
    setSync((s) => ({ ...s, state: "syncing", message: "" }));
    try {
      while (flushing.current) await new Promise((r) => setTimeout(r, 120)); // let an in-flight upload finish
      await flush();
      if (queueRef.current.length) return; // upload failed; error already set
      const raw = await pull(conn());
      const total = Object.values(raw).reduce((n, rows) => n + rows.length, 0);
      if (total === 0) {
        setSync((s) => ({ ...s, state: "idle", message: "Sheet is empty — use “Upload this phone's data to the sheet” to fill it.", last: new Date().toISOString() }));
        return;
      }
      const next = fromSheet(raw, dataRef.current);
      setData((d) => ({ ...next, settings: { ...next.settings, scriptUrl: d.settings.scriptUrl, passcode: d.settings.passcode } }));
      setSync((s) => ({ ...s, state: "idle", message: "", last: new Date().toISOString() }));
    } catch (e) {
      setSync((s) => ({ ...s, state: "error", message: (e as Error).message }));
    }
  }, [flush]);

  // pull once on launch when connected
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (connected) void syncNow();
  }, [connected, syncNow]);

  const uploadAll = useCallback(async () => {
    setSync((s) => ({ ...s, state: "syncing", message: "" }));
    try {
      const ops = allOps(dataRef.current);
      for (let i = 0; i < ops.length; i += 25) await push(conn(), ops.slice(i, i + 25));
      setQueue([]);
      setSync((s) => ({ ...s, state: "idle", message: "Uploaded.", last: new Date().toISOString() }));
    } catch (e) {
      setSync((s) => ({ ...s, state: "error", message: (e as Error).message }));
    }
  }, []);

  const testConnection = useCallback(async (url: string, passcode: string) => {
    await ping({ url, passcode });
  }, []);

  /* ---------- mutations (optimistic, then queued for the sheet) ---------- */
  const upsertIn = <T extends { id: string }>(list: T[], item: T) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

  const mutate = (fn: (d: AppData) => AppData, ops: (d: AppData) => Op[]) => {
    const next = fn(dataRef.current);
    dataRef.current = next;
    setData(next);
    enqueue(ops(next));
  };

  const del = (c: Collection, id: string): Op => ({ t: "delete", c, id });

  const store: Store = useMemo(
    () => ({
      data,
      balances: balances(data),
      sync: { ...sync, pending: queue.length, state: connected ? sync.state : "off" },
      saveExpense: (e) => mutate((d) => ({ ...d, expenses: upsertIn(d.expenses, e) }), (d) => [{ t: "upsert", c: "expenses", id: e.id, row: toRow.expense(e, d) }]),
      deleteExpense: (id) => mutate((d) => ({ ...d, expenses: d.expenses.filter((x) => x.id !== id) }), () => [del("expenses", id)]),
      saveIncome: (i) => mutate((d) => ({ ...d, income: upsertIn(d.income, i) }), (d) => [{ t: "upsert", c: "income", id: i.id, row: toRow.income(i, d) }]),
      deleteIncome: (id) => mutate((d) => ({ ...d, income: d.income.filter((x) => x.id !== id) }), () => [del("income", id)]),
      saveTransfer: (t) => mutate((d) => ({ ...d, transfers: upsertIn(d.transfers, t) }), (d) => [{ t: "upsert", c: "transfers", id: t.id, row: toRow.transfer(t, d) }]),
      deleteTransfer: (id) => mutate((d) => ({ ...d, transfers: d.transfers.filter((x) => x.id !== id) }), () => [del("transfers", id)]),
      saveAccount: (a) => mutate((d) => ({ ...d, accounts: upsertIn(d.accounts, a) }), () => [{ t: "upsert", c: "accounts", id: a.id, row: toRow.account(a) }]),
      deleteAccount: (id) => {
        const d = dataRef.current;
        const used = d.expenses.some((x) => x.accountId === id) || d.income.some((x) => x.accountId === id) || d.transfers.some((x) => x.fromId === id || x.toId === id);
        if (used) return "This account has transactions. Move or delete them first.";
        mutate((dd) => ({ ...dd, accounts: dd.accounts.filter((x) => x.id !== id) }), () => [del("accounts", id)]);
        return null;
      },
      updateSettings: (patch) =>
        mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } }), (d) => settingsOps({ ...d.settings, ...patch })),
      renameCategory: (from, to) => {
        if (from === to) return;
        mutate(
          (d) => ({ ...d, expenses: d.expenses.map((e) => (e.category === from ? { ...e, category: to } : e)) }),
          (d) => d.expenses.filter((e) => e.category === to).map((e) => ({ t: "upsert" as const, c: "expenses" as const, id: e.id, row: toRow.expense(e, d) })),
        );
      },
      testConnection,
      syncNow,
      uploadAll,
      resetLocal: () => {
        const s = seedData();
        s.settings.scriptUrl = dataRef.current.settings.scriptUrl;
        s.settings.passcode = dataRef.current.settings.passcode;
        dataRef.current = s;
        setData(s);
        setQueue([]);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, sync, queue.length, connected, syncNow, uploadAll, testConnection],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
