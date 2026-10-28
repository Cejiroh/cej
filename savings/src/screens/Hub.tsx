import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { go } from "@/lib/router";
import { addMonths, monthKey, monthLabel, peso, todayISO } from "@/lib/fin";
import { Card, Progress } from "@/components/kit";
import { TxRow, buildTx } from "@/components/TxRow";
import { cn } from "@/lib/utils";

export default function Hub() {
  const { data, balances } = useStore();
  const [month, setMonth] = useState(monthKey(todayISO()));
  const [showAll, setShowAll] = useState(false);

  const m = useMemo(() => {
    const exp = data.expenses.filter((e) => monthKey(e.date) === month);
    const inc = data.income.filter((e) => monthKey(e.date) === month);
    const fees = data.transfers.filter((t) => monthKey(t.date) === month).reduce((s, t) => s + t.fee, 0);
    const spent = exp.reduce((s, e) => s + e.amount, 0);
    const income = inc.reduce((s, e) => s + e.amount, 0);
    const byCat = new Map<string, number>();
    exp.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const target = data.settings.categories.reduce((s, c) => s + c.target, 0);
    return { spent, income, fees, byCat, target, net: income - spent - fees, tx: buildTx(data).filter((t) => monthKey(t.date) === month) };
  }, [data, month]);

  const total = Object.values(balances).reduce((s, v) => s + v, 0);
  const used = m.target > 0 ? m.spent / m.target : 0;
  const tone = used > 1 ? "over" : used >= 0.8 ? "warn" : "ok";

  const rows = data.settings.categories
    .map((c) => ({ ...c, spent: m.byCat.get(c.name) ?? 0 }))
    .filter((c) => c.target > 0 || c.spent > 0)
    .sort((a, b) => (b.target ? b.spent / b.target : 9) - (a.target ? a.spent / a.target : 9));
  const shown = showAll ? rows : rows.slice(0, 6);

  return (
    <div className="px-4 pb-6 space-y-4">
      {/* balance hero */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-5">
        <svg className="absolute -right-6 -top-6 opacity-[.10]" width="170" height="170" viewBox="0 0 100 100" aria-hidden><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" /><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="6" /><circle cx="50" cy="50" r="14" fill="currentColor" /></svg>
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] opacity-75">Total across all accounts</p>
        <p className="font-display text-[42px] leading-[1.05] font-semibold tnum mt-1">{peso(total)}</p>
        <button onClick={() => go("accounts")} className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-[13px] font-semibold active:bg-primary-foreground/25">
          <Wallet size={14} /> {data.accounts.length} accounts <ChevronRight size={14} />
        </button>
      </section>

      {/* month switch */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">{monthLabel(month)}</h2>
        <div className="flex gap-1">
          <button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month" className="h-9 w-9 grid place-items-center rounded-full bg-secondary active:brightness-95"><ChevronLeft size={18} /></button>
          <button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month" className="h-9 w-9 grid place-items-center rounded-full bg-secondary active:brightness-95"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3"><TrendingUp size={16} className="text-primary" /><p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Income</p><p className="font-display text-[17px] font-semibold tnum">{peso(m.income, { compact: true })}</p></Card>
        <Card className="p-3"><TrendingDown size={16} className="text-destructive" /><p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</p><p className="font-display text-[17px] font-semibold tnum">{peso(m.spent + m.fees, { compact: true })}</p></Card>
        <Card className={cn("p-3", m.net >= 0 ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20")}><Wallet size={16} className={m.net >= 0 ? "text-primary" : "text-destructive"} /><p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net saved</p><p className="font-display text-[17px] font-semibold tnum">{peso(m.net, { compact: true })}</p></Card>
      </div>
      {m.fees > 0 && <p className="-mt-2 text-xs text-muted-foreground">Includes {peso(m.fees)} in transfer/withdrawal fees.</p>}

      {/* budget */}
      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold">Target expenses</h3>
          <button onClick={() => go("settings/targets")} className="text-[13px] font-semibold text-primary">Edit</button>
        </div>
        <div className="mt-2 flex items-baseline justify-between tnum">
          <span className="text-[15px]"><b className="font-semibold">{peso(m.spent)}</b> <span className="text-muted-foreground">of {peso(m.target)}</span></span>
          <span className={cn("text-sm font-bold", tone === "over" && "text-destructive", tone === "warn" && "text-[hsl(32_75%_36%)]")}>{Math.round(used * 100)}%</span>
        </div>
        <div className="mt-2"><Progress pct={used} tone={tone} /></div>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          {m.target - m.spent >= 0 ? `${peso(m.target - m.spent)} left to spend this month` : `${peso(m.spent - m.target)} over the monthly target`}
        </p>

        <ul className="mt-4 space-y-3.5">
          {shown.map((c) => {
            const p = c.target ? c.spent / c.target : c.spent > 0 ? 1.01 : 0;
            const t = p > 1 ? "over" : p >= 0.8 ? "warn" : "ok";
            return (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className={cn("shrink-0 tnum text-[12.5px]", t === "over" ? "text-destructive font-semibold" : "text-muted-foreground")}>{peso(c.spent)} / {peso(c.target)}</span>
                </div>
                <div className="mt-1"><Progress pct={p} tone={t} /></div>
              </li>
            );
          })}
        </ul>
        {rows.length > 6 && <button onClick={() => setShowAll(!showAll)} className="mt-3 text-[13px] font-semibold text-primary">{showAll ? "Show less" : `Show all ${rows.length}`}</button>}
      </Card>

      {/* recent */}
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold">Recent activity</h3>
          <button onClick={() => go("history")} className="text-[13px] font-semibold text-primary">See all</button>
        </div>
        <Card className="mt-2 px-3 py-1">
          {m.tx.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nothing logged in {monthLabel(month)} yet. Tap + to add.</p> :
            <div className="divide-y divide-border/60">{m.tx.slice(0, 6).map((t) => <TxRow key={t.type + t.id} tx={t} showDate />)}</div>}
        </Card>
      </section>
    </div>
  );
}
