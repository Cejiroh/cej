import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Banknote } from "lucide-react";
import type { AppData } from "@/lib/types";
import { peso, shortDay, accName } from "@/lib/fin";
import { useUI } from "@/lib/ui";
import { cn } from "@/lib/utils";

export type Tx =
  | { type: "expense"; id: string; date: string; title: string; sub: string; amount: number }
  | { type: "income"; id: string; date: string; title: string; sub: string; amount: number }
  | { type: "transfer"; id: string; date: string; title: string; sub: string; amount: number; fee: number; withdraw: boolean };

export function buildTx(d: AppData): Tx[] {
  const out: Tx[] = [];
  d.expenses.forEach((e) => out.push({ type: "expense", id: e.id, date: e.date, title: e.item || e.category, sub: `${e.category} · ${accName(d.accounts, e.accountId)}`, amount: e.amount }));
  d.income.forEach((i) => out.push({ type: "income", id: i.id, date: i.date, title: i.item || i.category, sub: `${i.category} · ${accName(d.accounts, i.accountId)}`, amount: i.amount }));
  d.transfers.forEach((t) => out.push({
    type: "transfer", id: t.id, date: t.date, withdraw: t.kind === "withdraw",
    title: t.kind === "withdraw" ? `Withdraw to ${accName(d.accounts, t.toId)}` : `${accName(d.accounts, t.fromId)} → ${accName(d.accounts, t.toId)}`,
    sub: t.kind === "withdraw" ? `from ${accName(d.accounts, t.fromId)}` : "Transfer", amount: t.amount, fee: t.fee,
  }));
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function TxRow({ tx, showDate }: { tx: Tx; showDate?: boolean }) {
  const { openEntry, openTransfer } = useUI();
  const Icon = tx.type === "expense" ? ArrowUpRight : tx.type === "income" ? ArrowDownLeft : tx.withdraw ? Banknote : ArrowLeftRight;
  const tone = tx.type === "expense" ? "bg-destructive/10 text-destructive" : tx.type === "income" ? "bg-primary/10 text-primary" : "bg-accent/25 text-[hsl(32_70%_30%)]";
  return (
    <button
      onClick={() => (tx.type === "transfer" ? openTransfer(tx.id) : openEntry({ kind: tx.type, id: tx.id }))}
      className="flex w-full items-center gap-3 py-2.5 text-left active:bg-secondary/60 -mx-1 px-1 rounded-lg"
    >
      <span className={cn("h-10 w-10 shrink-0 grid place-items-center rounded-full", tone)}><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-[15px]">{tx.title}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{showDate ? `${shortDay(tx.date)} · ` : ""}{tx.sub}</span>
      </span>
      <span className="text-right tnum">
        <span className={cn("block font-semibold", tx.type === "income" && "text-primary", tx.type === "expense" && "text-foreground")}>
          {tx.type === "expense" ? "−" : tx.type === "income" ? "+" : ""}{peso(tx.amount)}
        </span>
        {tx.type === "transfer" && tx.fee > 0 && <span className="block text-[11.5px] text-muted-foreground">fee {peso(tx.fee)}</span>}
      </span>
    </button>
  );
}
