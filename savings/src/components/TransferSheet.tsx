import { Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { accName, peso, dayLabel } from "@/lib/fin";
import { Btn, Sheet } from "./kit";

export default function TransferSheet() {
  const { transferId, openTransfer } = useUI();
  const st = useStore();
  const t = st.data.transfers.find((x) => x.id === transferId);
  if (!t) return null;
  const a = st.data.accounts;
  const Row = ({ k, v }: { k: string; v: string }) => (
    <div className="flex justify-between py-2.5 border-b border-border/60 last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-semibold tnum text-right">{v}</span></div>
  );
  return (
    <Sheet open onClose={() => openTransfer(null)} title={t.kind === "withdraw" ? "Withdrawal" : "Transfer"}>
      <div className="rounded-2xl bg-card border border-border px-4">
        <Row k="Date" v={dayLabel(t.date)} />
        <Row k="From" v={accName(a, t.fromId)} />
        <Row k="To" v={accName(a, t.toId)} />
        <Row k="Amount received" v={peso(t.amount)} />
        <Row k={t.kind === "withdraw" ? "Withdrawal fee" : "Transfer fee"} v={peso(t.fee)} />
        <Row k="Total taken from source" v={peso(t.amount + t.fee)} />
        {t.remarks && <Row k="Remarks" v={t.remarks} />}
      </div>
      <Btn variant="danger" className="w-full" onClick={() => { if (confirm("Delete this transfer? Balances will be restored.")) { st.deleteTransfer(t.id); openTransfer(null); } }}>
        <Trash2 size={17} /> Delete transfer
      </Btn>
    </Sheet>
  );
}
