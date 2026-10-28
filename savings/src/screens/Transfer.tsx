import { useEffect, useState } from "react";
import { ArrowDown, TriangleAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { go } from "@/lib/router";
import { accName, num, peso, todayISO, uid } from "@/lib/fin";
import { Btn, Card, Empty, Field, Input, Page, Segmented, Select } from "@/components/kit";
import { TxRow, buildTx } from "@/components/TxRow";

export default function Transfer() {
  const st = useStore();
  const { accounts, settings } = st.data;
  const [mode, setMode] = useState<"transfer" | "withdraw">("transfer");
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("0");
  const [feeTouched, setFeeTouched] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [remarks, setRemarks] = useState("");
  const [done, setDone] = useState(false);

  const cash = accounts.filter((a) => a.kind === "cash");
  const nonCash = accounts.filter((a) => a.kind !== "cash");
  const fromOptions = mode === "withdraw" ? nonCash : accounts;
  const toOptions = mode === "withdraw" ? cash : accounts.filter((a) => a.id !== fromId);

  // keep selections valid when the mode changes
  useEffect(() => {
    if (mode === "withdraw") {
      if (!nonCash.some((a) => a.id === fromId)) setFromId(nonCash[0]?.id ?? "");
      if (!cash.some((a) => a.id === toId)) setToId(cash[0]?.id ?? "");
    } else if (fromId === toId) {
      setToId(accounts.find((a) => a.id !== fromId)?.id ?? "");
    }
    setFeeTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  useEffect(() => {
    if (mode === "transfer" && fromId === toId) setToId(accounts.find((a) => a.id !== fromId)?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId]);

  // default fee comes from Settings → Transfer fees, until the user types their own
  useEffect(() => {
    if (feeTouched) return;
    const a = accounts.find((x) => x.id === fromId);
    const d = mode === "withdraw" ? a?.withdrawFee ?? settings.defaultWithdrawFee : a?.transferFee ?? settings.defaultTransferFee;
    setFee(String(d ?? 0));
  }, [mode, fromId, feeTouched, accounts, settings.defaultTransferFee, settings.defaultWithdrawFee]);

  const amt = num(amount), f = num(fee);
  const bal = st.balances[fromId] ?? 0;
  const valid = amt > 0 && fromId && toId && fromId !== toId;
  const short = valid && amt + f > bal;

  const submit = () => {
    if (!valid) return;
    st.saveTransfer({ id: uid("TRF"), date, kind: mode, fromId, toId, amount: amt, fee: f, remarks: remarks.trim() });
    setAmount(""); setRemarks(""); setFeeTouched(false); setDone(true);
    setTimeout(() => setDone(false), 2200);
  };

  const recent = buildTx(st.data).filter((t) => t.type === "transfer").slice(0, 8);

  return (
    <Page title="Transfer" sub="Move money between your accounts">
      <Segmented value={mode} onChange={setMode} options={[{ value: "transfer", label: "Transfer" }, { value: "withdraw", label: "Withdraw cash" }]} />

      <Card className="p-4 space-y-3.5">
        <Field label={mode === "withdraw" ? "Withdraw from" : "From"} hint={`Balance ${peso(bal)}`}>
          <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>{fromOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        </Field>
        <div className="flex justify-center -my-1"><span className="h-8 w-8 grid place-items-center rounded-full bg-secondary text-muted-foreground"><ArrowDown size={16} /></span></div>
        <Field label={mode === "withdraw" ? "Cash goes to" : "To"} hint={`Balance ${peso(st.balances[toId] ?? 0)}`}>
          <Select value={toId} onChange={(e) => setToId(e.target.value)}>{toOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        </Field>
        {mode === "withdraw" && cash.length === 0 && <p className="text-sm text-destructive">Add a Cash account first (Settings → Banks & wallets).</p>}
      </Card>

      <Card className="p-4 space-y-3.5">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</span>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-3xl text-muted-foreground">₱</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0" className="w-full bg-transparent font-display text-4xl font-semibold outline-none tnum" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fee (₱)" hint="editable">
            <Input inputMode="decimal" value={fee} onChange={(e) => { setFee(e.target.value.replace(/[^0-9.]/g, "")); setFeeTouched(true); }} />
          </Field>
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <Field label="Remarks"><Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" /></Field>
      </Card>

      {valid && (
        <Card className="p-4 bg-secondary/60 border-0 text-[14px] space-y-1.5 tnum">
          <div className="flex justify-between"><span className="text-muted-foreground">{accName(accounts, fromId)} loses</span><b>{peso(amt + f)}</b></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{accName(accounts, toId)} receives</span><b className="text-primary">{peso(amt)}</b></div>
          {f > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><b>{peso(f)}</b></div>}
          {short && <p className="flex items-center gap-1.5 pt-1 text-destructive font-medium"><TriangleAlert size={15} /> Exceeds the balance of {accName(accounts, fromId)}.</p>}
        </Card>
      )}

      <Btn className="w-full h-14 text-base" disabled={!valid} onClick={submit}>{done ? "Saved ✓" : mode === "withdraw" ? "Confirm withdrawal" : "Confirm transfer"}</Btn>
      <button onClick={() => go("settings/fees")} className="block w-full text-center text-[13px] font-semibold text-primary">Change default fees</button>

      <section className="pt-2">
        <h3 className="font-display text-lg font-semibold mb-2">Recent transfers</h3>
        {recent.length === 0 ? <Empty>No transfers yet.</Empty> : <Card className="px-3 py-1 divide-y divide-border/60">{recent.map((t) => <TxRow key={t.id} tx={t} showDate />)}</Card>}
      </section>
    </Page>
  );
}
