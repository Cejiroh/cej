import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { todayISO, uid, num } from "@/lib/fin";
import type { Expense, Income, NeedWant } from "@/lib/types";
import { Btn, Field, Input, Select, Segmented, Sheet } from "./kit";

export default function EntrySheet() {
  const { entry, closeEntry } = useUI();
  const st = useStore();
  const { settings, accounts, expenses, income } = st.data;

  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("");
  const [item, setItem] = useState("");
  const [accountId, setAccountId] = useState("");
  const [needWant, setNeedWant] = useState<NeedWant>("Need");
  const [remarks, setRemarks] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>({});

  const editing = entry?.id;
  useEffect(() => {
    if (!entry) return;
    setKind(entry.kind);
    const rec = entry.id ? (entry.kind === "expense" ? expenses.find((e) => e.id === entry.id) : income.find((i) => i.id === entry.id)) : undefined;
    if (rec) {
      setAmount(String(rec.amount)); setDate(rec.date); setCategory(rec.category); setItem(rec.item);
      setAccountId(rec.accountId); setRemarks(rec.remarks); setExtra(rec.extra ?? {});
      setNeedWant(("needWant" in rec ? rec.needWant : "Need") as NeedWant);
    } else {
      setAmount(""); setDate(entry.date ?? todayISO()); setItem(""); setRemarks(""); setExtra({});
      setAccountId(entry.accountId ?? accounts[0]?.id ?? "");
      const first = entry.kind === "expense" ? settings.categories[0] : undefined;
      setCategory(first?.name ?? settings.incomeCategories[0] ?? "");
      setNeedWant(first?.needWant ?? "Need");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  if (!entry) return null;
  const switchKind = (k: "expense" | "income") => {
    setKind(k);
    setCategory(k === "expense" ? settings.categories[0]?.name ?? "" : settings.incomeCategories[0] ?? "");
  };
  const fields = settings.fields.filter((f) => f.appliesTo === "both" || f.appliesTo === kind);
  const valid = num(amount) > 0 && category && accountId;

  const submit = () => {
    if (!valid) return;
    const base = { date, category, item: item.trim(), accountId, amount: num(amount), remarks: remarks.trim(), extra };
    if (kind === "expense") {
      st.saveExpense({ id: editing && entry.kind === "expense" ? editing : uid("EXP"), ...base, needWant } as Expense);
    } else {
      st.saveIncome({ id: editing && entry.kind === "income" ? editing : uid("INC"), ...base } as Income);
    }
    if (editing && entry.kind !== kind) (entry.kind === "expense" ? st.deleteExpense : st.deleteIncome)(editing);
    closeEntry();
  };
  const remove = () => {
    if (!editing || !confirm("Delete this entry?")) return;
    (entry.kind === "expense" ? st.deleteExpense : st.deleteIncome)(editing);
    closeEntry();
  };

  const cats = kind === "expense" ? settings.categories.map((c) => c.name) : settings.incomeCategories;

  return (
    <Sheet open onClose={closeEntry} title={editing ? "Edit entry" : "New entry"}>
      {!editing && <Segmented value={kind} onChange={switchKind} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />}
      <div className="rounded-2xl bg-card border border-border px-4 py-3">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</span>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-3xl text-muted-foreground">₱</span>
          <input inputMode="decimal" autoFocus={!editing} value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0" className="w-full bg-transparent font-display text-4xl font-semibold outline-none tnum" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={kind === "expense" ? "Paid from" : "Received in"}>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Category">
        <Select value={category} onChange={(e) => {
          setCategory(e.target.value);
          const c = settings.categories.find((x) => x.name === e.target.value);
          if (kind === "expense" && c) setNeedWant(c.needWant);
        }}>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label={kind === "expense" ? "Particulars / item" : "Source"}>
        <Input value={item} onChange={(e) => setItem(e.target.value)} placeholder={kind === "expense" ? "e.g. Jollibee lunch" : "e.g. Company payout"} />
      </Field>
      {kind === "expense" && (
        <Field label="Need or want">
          <Segmented value={needWant} onChange={setNeedWant} options={[{ value: "Need", label: "Need" }, { value: "Want", label: "Want" }, { value: "Savings / Debt", label: "Savings/Debt" }]} />
        </Field>
      )}
      {fields.map((f) => (
        <Field key={f.id} label={f.label}>
          {f.type === "select" ? (
            <Select value={extra[f.id] ?? ""} onChange={(e) => setExtra({ ...extra, [f.id]: e.target.value })}>
              <option value="">—</option>
              {f.options.map((o) => <option key={o}>{o}</option>)}
            </Select>
          ) : (
            <Input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} inputMode={f.type === "number" ? "decimal" : undefined}
              value={extra[f.id] ?? ""} onChange={(e) => setExtra({ ...extra, [f.id]: e.target.value })} />
          )}
        </Field>
      ))}
      <Field label="Remarks / merchant"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" /></Field>
      <div className="flex gap-3 pt-1">
        {editing && <Btn variant="danger" onClick={remove} aria-label="Delete"><Trash2 size={18} /></Btn>}
        <Btn className="flex-1" disabled={!valid} onClick={submit}>{editing ? "Save changes" : kind === "expense" ? "Save expense" : "Save income"}</Btn>
      </div>
    </Sheet>
  );
}
