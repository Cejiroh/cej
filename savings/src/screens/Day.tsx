import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { go } from "@/lib/router";
import { addDays, dayLabel, peso, todayISO } from "@/lib/fin";
import { Btn, Card, Empty, Page } from "@/components/kit";
import { TxRow, buildTx } from "@/components/TxRow";

export default function Day({ iso }: { iso: string }) {
  const { data } = useStore();
  const { openEntry } = useUI();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : todayISO();
  const tx = buildTx(data).filter((t) => t.date === date);
  const spent = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const inc = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const fees = tx.reduce((s, t) => s + (t.type === "transfer" ? t.fee : 0), 0);

  return (
    <Page title={date === todayISO() ? "Today" : "Daily log"} sub={dayLabel(date)}
      right={
        <div className="flex gap-1">
          <button onClick={() => go(`day/${addDays(date, -1)}`)} aria-label="Previous day" className="h-10 w-10 grid place-items-center rounded-full bg-secondary"><ChevronLeft size={18} /></button>
          <button onClick={() => go(`day/${addDays(date, 1)}`)} aria-label="Next day" className="h-10 w-10 grid place-items-center rounded-full bg-secondary"><ChevronRight size={18} /></button>
        </div>
      }>
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="p-3.5"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spent</p><p className="font-display text-2xl font-semibold tnum">{peso(spent + fees)}</p></Card>
        <Card className="p-3.5"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Income</p><p className="font-display text-2xl font-semibold tnum text-primary">{peso(inc)}</p></Card>
      </div>
      {tx.length === 0 ? <Empty>No entries on this day.</Empty> : <Card className="px-3 py-1 divide-y divide-border/60">{tx.map((t) => <TxRow key={t.type + t.id} tx={t} />)}</Card>}
      <div className="grid grid-cols-2 gap-2.5">
        <Btn onClick={() => openEntry({ kind: "expense", date })}>Add expense</Btn>
        <Btn variant="soft" onClick={() => openEntry({ kind: "income", date })}>Add income</Btn>
      </div>
    </Page>
  );
}
