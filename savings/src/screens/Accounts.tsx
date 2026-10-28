import { Banknote, Landmark, Plus, Smartphone } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { go } from "@/lib/router";
import { peso, shortDay } from "@/lib/fin";
import type { Account } from "@/lib/types";
import { Btn, Card, Empty, Page } from "@/components/kit";
import { cn } from "@/lib/utils";

const kindIcon = { bank: Landmark, wallet: Smartphone, cash: Banknote };
const kindLabel = { bank: "Banks", wallet: "E-wallets", cash: "Cash" };

export default function Accounts({ detailId }: { detailId?: string }) {
  const { data, balances } = useStore();
  const { openEntry } = useUI();
  const total = Object.values(balances).reduce((s, v) => s + v, 0);

  if (detailId) {
    const a = data.accounts.find((x) => x.id === detailId);
    if (!a) return <Page title="Account" back><Empty>Account not found.</Empty></Page>;
    type L = { key: string; date: string; label: string; sub: string; delta: number };
    const l: L[] = [];
    data.expenses.filter((e) => e.accountId === a.id).forEach((e) => l.push({ key: e.id, date: e.date, label: e.item || e.category, sub: e.category, delta: -e.amount }));
    data.income.filter((e) => e.accountId === a.id).forEach((e) => l.push({ key: e.id, date: e.date, label: e.item || e.category, sub: e.category, delta: e.amount }));
    data.transfers.forEach((t) => {
      const other = (id: string) => data.accounts.find((x) => x.id === id)?.name ?? "";
      if (t.fromId === a.id) l.push({ key: t.id + "o", date: t.date, label: `To ${other(t.toId)}`, sub: t.fee ? `${t.kind === "withdraw" ? "Withdrawal" : "Transfer"} · fee ${peso(t.fee)}` : t.kind === "withdraw" ? "Withdrawal" : "Transfer", delta: -(t.amount + t.fee) });
      if (t.toId === a.id) l.push({ key: t.id + "i", date: t.date, label: `From ${other(t.fromId)}`, sub: t.kind === "withdraw" ? "Withdrawal" : "Transfer", delta: t.amount });
    });
    l.sort((x, y) => (x.date < y.date ? 1 : -1));
    return (
      <Page title={a.name} back sub={kindLabel[a.kind].replace(/s$/, "")}
        right={<button onClick={() => go("settings/banks")} className="text-[13px] font-semibold text-primary px-2">Edit</button>}>
        <Card className="p-5" style={{ borderTop: `4px solid ${a.color}` }}>
          <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Current balance</p>
          <p className="font-display text-4xl font-semibold tnum">{peso(balances[a.id] ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">Starting balance {peso(a.initial)}</p>
        </Card>
        <div className="grid grid-cols-2 gap-2.5">
          <Btn variant="soft" onClick={() => openEntry({ kind: "income", accountId: a.id })}>Add income</Btn>
          <Btn variant="soft" onClick={() => go("transfer")}>Transfer</Btn>
        </div>
        {l.length === 0 ? <Empty>No movements yet.</Empty> : (
          <Card className="px-3 py-1 divide-y divide-border/60">
            {l.map((x) => (
              <div key={x.key} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate font-semibold text-[15px]">{x.label}</p><p className="truncate text-[12.5px] text-muted-foreground">{shortDay(x.date)} · {x.sub}</p></div>
                <p className={cn("shrink-0 font-semibold tnum", x.delta > 0 && "text-primary")}>{peso(x.delta, { sign: true })}</p>
              </div>
            ))}
          </Card>
        )}
      </Page>
    );
  }

  const groups = (["bank", "wallet", "cash"] as Account["kind"][]).map((k) => ({ k, list: data.accounts.filter((a) => a.kind === k) })).filter((g) => g.list.length);
  return (
    <Page title="Accounts" sub="Banks, wallets and cash"
      right={<Btn variant="soft" className="h-10 px-3.5 text-sm" onClick={() => go("settings/banks")}><Plus size={16} /> Add</Btn>}>
      <Card className="p-5 bg-primary text-primary-foreground border-0">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] opacity-75">Net worth</p>
        <p className="font-display text-4xl font-semibold tnum">{peso(total)}</p>
      </Card>
      {groups.map((g) => {
        const I = kindIcon[g.k];
        return (
          <section key={g.k}>
            <div className="flex items-baseline justify-between px-1 mb-1.5">
              <h3 className="text-[12px] font-bold uppercase tracking-[.12em] text-muted-foreground">{kindLabel[g.k]}</h3>
              <span className="text-[13px] tnum text-muted-foreground">{peso(g.list.reduce((s, a) => s + (balances[a.id] ?? 0), 0))}</span>
            </div>
            <Card className="divide-y divide-border/60 overflow-hidden">
              {g.list.map((a) => (
                <button key={a.id} onClick={() => go(`account/${a.id}`)} className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left active:bg-secondary/60">
                  <span className="h-10 w-10 grid place-items-center rounded-xl text-white" style={{ background: a.color }}><I size={19} /></span>
                  <span className="flex-1 min-w-0 truncate font-semibold text-[15px]">{a.name}</span>
                  <span className={cn("font-display text-[17px] font-semibold tnum", (balances[a.id] ?? 0) < 0 && "text-destructive")}>{peso(balances[a.id] ?? 0)}</span>
                </button>
              ))}
            </Card>
          </section>
        );
      })}
    </Page>
  );
}
