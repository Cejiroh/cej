import { useState } from "react";
import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { monthKey, monthLabel, peso } from "@/lib/fin";
import { Card, Empty, Input, Page, Select } from "@/components/kit";
import { TxRow, buildTx } from "@/components/TxRow";

export default function History() {
  const { data } = useStore();
  const all = buildTx(data);
  const months = [...new Set(all.map((t) => monthKey(t.date)))].sort().reverse();
  const [month, setMonth] = useState("all");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");

  const list = all.filter((t) => (month === "all" || monthKey(t.date) === month) && (type === "all" || t.type === type) &&
    (!q || (t.title + t.sub).toLowerCase().includes(q.toLowerCase())));
  const total = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <Page title="All transactions" back sub={`${list.length} entries · ${peso(total)} spent`}>
      <div className="relative"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10" placeholder="Search item, category, account" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2.5">
        <Select value={month} onChange={(e) => setMonth(e.target.value)}><option value="all">All months</option>{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="transfer">Transfers</option></Select>
      </div>
      {list.length === 0 ? <Empty>No matching transactions.</Empty> : <Card className="px-3 py-1 divide-y divide-border/60">{list.map((t) => <TxRow key={t.type + t.id} tx={t} showDate />)}</Card>}
    </Page>
  );
}
