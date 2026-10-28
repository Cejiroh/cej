import { useState } from "react";
import { Check, ChevronRight, Copy, Plus, Target, SlidersHorizontal, ArrowLeftRight, Landmark, PlugZap, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { go } from "@/lib/router";
import { APPS_SCRIPT_CODE } from "@/lib/script";
import { num, peso, uid } from "@/lib/fin";
import type { Account, Category, CustomField, NeedWant } from "@/lib/types";
import { Btn, Card, Empty, Field, Input, Page, Select, Sheet } from "@/components/kit";
import { cn } from "@/lib/utils";

/* ============================ Settings home ============================ */
export function SettingsHome() {
  const st = useStore();
  const items = [
    { icon: PlugZap, label: "Google Sheet connection", sub: st.sync.state === "off" ? "Not connected" : "Connected", path: "settings/connection" },
    { icon: Target, label: "Target expenses", sub: `${st.data.settings.categories.length} categories`, path: "settings/targets" },
    { icon: SlidersHorizontal, label: "Custom fields", sub: `${st.data.settings.fields.length} extra fields`, path: "settings/fields" },
    { icon: ArrowLeftRight, label: "Transfer fees", sub: "Defaults for transfer & withdraw", path: "settings/fees" },
    { icon: Landmark, label: "Banks & wallets", sub: `${st.data.accounts.length} accounts`, path: "settings/banks" },
  ];
  return (
    <Page title="Settings">
      <Card className="divide-y divide-border/60 overflow-hidden">
        {items.map((i) => (
          <button key={i.path} onClick={() => go(i.path)} className="flex w-full items-center gap-3.5 px-4 py-4 text-left active:bg-secondary/60">
            <span className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-primary"><i.icon size={20} /></span>
            <span className="flex-1"><span className="block font-semibold text-[15px]">{i.label}</span><span className="block text-[12.5px] text-muted-foreground">{i.sub}</span></span>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        ))}
      </Card>
      <p className="px-1 text-xs text-muted-foreground">Everything is saved on this device first, then sent to your Google Sheet when connected.</p>
    </Page>
  );
}

/* ============================ Connection ============================ */
export function Connection() {
  const st = useStore();
  const { settings } = st.data;
  const [url, setUrl] = useState(settings.scriptUrl);
  const [pass, setPass] = useState(settings.passcode);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      if (url.trim()) await st.testConnection(url.trim(), pass.trim());
      st.updateSettings({ scriptUrl: url.trim(), passcode: pass.trim() });
      setMsg({ ok: true, text: url.trim() ? "Connected! Tap “Sync now” to load your sheet data." : "Disconnected. The app now works offline only." });
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message || "Could not reach the script." });
    } finally { setBusy(false); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(APPS_SCRIPT_CODE); }
    catch {
      const t = document.getElementById("script-code") as HTMLTextAreaElement | null;
      t?.select(); document.execCommand("copy");
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const status = st.sync;
  return (
    <Page title="Google Sheet" back sub="Use your own Google Sheet as the database">
      <Card className="p-4 space-y-3.5">
        <Field label="Apps Script Web app URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" inputMode="url" autoCapitalize="off" autoCorrect="off" /></Field>
        <Field label="Passcode" hint="optional"><Input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Same as PASSCODE in the script" autoCapitalize="off" /></Field>
        <Btn className="w-full" onClick={save} disabled={busy}>{busy ? "Testing…" : url.trim() ? "Save & test connection" : "Save (offline mode)"}</Btn>
        {msg && <p className={cn("text-sm font-medium", msg.ok ? "text-primary" : "text-destructive")}>{msg.text}</p>}
      </Card>

      {status.state !== "off" && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{status.state === "syncing" ? "Syncing…" : status.state === "error" ? "Sync problem" : "Connected"}</p>
              <p className="text-[12.5px] text-muted-foreground">{status.pending ? `${status.pending} change(s) waiting to upload` : "Everything is uploaded"}{status.last && ` · last ${new Date(status.last).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`}</p>
            </div>
          </div>
          {status.message && <p className={cn("text-sm", status.state === "error" ? "text-destructive" : "text-muted-foreground")}>{status.message}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Btn variant="soft" onClick={() => void st.syncNow()} disabled={status.state === "syncing"}>Sync now</Btn>
            <Btn variant="soft" onClick={() => { if (confirm("Upload everything on this phone to the sheet? Rows with the same ID are overwritten.")) void st.uploadAll(); }} disabled={status.state === "syncing"}>Upload to sheet</Btn>
          </div>
          <p className="text-[12px] text-muted-foreground">Sync now replaces what’s on this phone with the sheet’s data. Use “Upload to sheet” the first time to send your starting data (accounts, budgets) up.</p>
        </Card>
      )}

      <section>
        <h3 className="font-display text-lg font-semibold mb-2">Set up your sheet</h3>
        <Card className="p-4">
          <ol className="space-y-2.5 text-[14px]">
            {[
              "Create a new Google Sheet (or open the one you want to use).",
              "Open Extensions → Apps Script and delete any code in the editor.",
              "Copy the script below and paste it in. Optionally set a PASSCODE at the top.",
              "Press Save, choose the function setup, then Run once and approve access.",
              "Deploy → New deployment → type Web app. Execute as: Me. Who has access: Anyone.",
              "Copy the Web app URL, paste it above, and tap Save & test.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3"><span className="mt-0.5 h-6 w-6 shrink-0 grid place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span><span>{t}</span></li>
            ))}
          </ol>
          <p className="mt-3 text-[12.5px] text-muted-foreground">After you edit the script later, use Deploy → Manage deployments → Edit → New version so the URL keeps working.</p>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg font-semibold">Apps Script code</h3>
          <Btn variant={copied ? "accent" : "primary"} className="h-10 px-4 text-sm" onClick={copy}>{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy code</>}</Btn>
        </div>
        <textarea id="script-code" readOnly value={APPS_SCRIPT_CODE} onFocus={(e) => e.currentTarget.select()} spellCheck={false}
          className="h-64 w-full resize-none rounded-2xl border border-border bg-foreground p-3.5 font-mono text-[12px] leading-relaxed text-background/90 outline-none" />
      </section>

      <Btn variant="danger" className="w-full" onClick={() => { if (confirm("Reset this phone's data to the starting template? Your Google Sheet is not touched.")) st.resetLocal(); }}>Reset local data to template</Btn>
    </Page>
  );
}

/* ============================ Target expenses ============================ */
function CatRow({ c }: { c: Category }) {
  const st = useStore();
  const [name, setName] = useState(c.name);
  const [target, setTarget] = useState(String(c.target));
  const cats = st.data.settings.categories;
  const patch = (p: Partial<Category>) => st.updateSettings({ categories: cats.map((x) => (x.id === c.id ? { ...x, ...p } : x)) });
  return (
    <div className="py-3 space-y-2">
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 bg-transparent font-semibold text-[15px] outline-none"
          onBlur={() => { const n = name.trim(); if (n && n !== c.name) { st.renameCategory(c.name, n); patch({ name: n }); } else setName(c.name); }} />
        <button aria-label={`Remove ${c.name}`} onClick={() => { if (confirm(`Remove “${c.name}”? Past expenses keep their category name.`)) st.updateSettings({ categories: cats.filter((x) => x.id !== c.id) }); }} className="h-8 w-8 grid place-items-center rounded-full text-muted-foreground active:bg-secondary"><X size={16} /></button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
          <Input className="h-11 pl-7 tnum" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^0-9.]/g, ""))} onBlur={() => patch({ target: num(target) })} />
        </div>
        <Select className="h-11 flex-1" value={c.needWant} onChange={(e) => patch({ needWant: e.target.value as NeedWant })}>
          <option>Need</option><option>Want</option><option>Savings / Debt</option>
        </Select>
      </div>
    </div>
  );
}

export function Targets() {
  const st = useStore();
  const { categories, incomeCategories } = st.data.settings;
  const total = categories.reduce((s, c) => s + c.target, 0);
  const [nn, setNn] = useState("");
  const [nt, setNt] = useState("");
  const [ni, setNi] = useState("");
  const add = () => {
    if (!nn.trim()) return;
    st.updateSettings({ categories: [...categories, { id: uid("CAT"), name: nn.trim(), target: num(nt), needWant: "Need" }] });
    setNn(""); setNt("");
  };
  return (
    <Page title="Target expenses" back sub="Monthly budget per category">
      <Card className="p-4 bg-primary text-primary-foreground border-0">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] opacity-75">Total monthly target</p>
        <p className="font-display text-3xl font-semibold tnum">{peso(total)}</p>
      </Card>
      <Card className="px-4 divide-y divide-border/60">{categories.map((c) => <CatRow key={c.id} c={c} />)}</Card>
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Add a category</h3>
        <Input placeholder="Category name" value={nn} onChange={(e) => setNn(e.target.value)} />
        <Input placeholder="Monthly target (₱)" inputMode="decimal" value={nt} onChange={(e) => setNt(e.target.value.replace(/[^0-9.]/g, ""))} />
        <Btn className="w-full" disabled={!nn.trim()} onClick={add}><Plus size={18} /> Add category</Btn>
      </Card>

      <section>
        <h3 className="font-display text-lg font-semibold mb-2">Income categories</h3>
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {incomeCategories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary pl-3 pr-1.5 py-1.5 text-[13.5px] font-medium">
                {c}<button aria-label={`Remove ${c}`} onClick={() => st.updateSettings({ incomeCategories: incomeCategories.filter((x) => x !== c) })} className="h-5 w-5 grid place-items-center rounded-full active:bg-border"><X size={13} /></button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input placeholder="New income category" value={ni} onChange={(e) => setNi(e.target.value)} />
            <Btn variant="soft" disabled={!ni.trim()} onClick={() => { st.updateSettings({ incomeCategories: [...incomeCategories, ni.trim()] }); setNi(""); }}>Add</Btn>
          </div>
        </Card>
      </section>
    </Page>
  );
}

/* ============================ Custom fields ============================ */
export function Fields() {
  const st = useStore();
  const { fields } = st.data.settings;
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomField["type"]>("text");
  const [options, setOptions] = useState("");
  const [applies, setApplies] = useState<CustomField["appliesTo"]>("expense");

  const add = () => {
    if (!label.trim()) return;
    st.updateSettings({
      fields: [...fields, { id: uid("FLD"), label: label.trim(), type, appliesTo: applies, options: type === "select" ? options.split(",").map((s) => s.trim()).filter(Boolean) : [] }],
    });
    setLabel(""); setOptions("");
  };
  return (
    <Page title="Custom fields" back sub="Extra details on each expense or income entry">
      {fields.length === 0 ? <Empty>No custom fields yet.</Empty> : (
        <Card className="px-4 divide-y divide-border/60">
          {fields.map((f) => (
            <div key={f.id} className="flex items-center gap-3 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[15px]">{f.label}</p>
                <p className="text-[12.5px] text-muted-foreground truncate">{f.type}{f.type === "select" && f.options.length ? ` · ${f.options.join(", ")}` : ""} · {f.appliesTo === "both" ? "expense & income" : f.appliesTo}</p>
              </div>
              <button aria-label={`Delete ${f.label}`} onClick={() => { if (confirm(`Delete field “${f.label}”? Values already saved stay in your sheet.`)) st.updateSettings({ fields: fields.filter((x) => x.id !== f.id) }); }} className="h-9 w-9 grid place-items-center rounded-full text-destructive active:bg-destructive/10"><Trash2 size={17} /></button>
            </div>
          ))}
        </Card>
      )}
      <Card className="p-4 space-y-3.5">
        <h3 className="font-semibold">Add a field</h3>
        <Field label="Field name"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Receipt no., Store, Mood" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as CustomField["type"])}><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Dropdown</option></Select></Field>
          <Field label="Shows on"><Select value={applies} onChange={(e) => setApplies(e.target.value as CustomField["appliesTo"])}><option value="expense">Expenses</option><option value="income">Income</option><option value="both">Both</option></Select></Field>
        </div>
        {type === "select" && <Field label="Dropdown choices" hint="comma separated"><Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Cash, GCash, Card" /></Field>}
        <Btn className="w-full" disabled={!label.trim()} onClick={add}><Plus size={18} /> Add field</Btn>
      </Card>
    </Page>
  );
}

/* ============================ Transfer fees ============================ */
export function Fees() {
  const st = useStore();
  const { settings, accounts } = st.data;
  const [tf, setTf] = useState(String(settings.defaultTransferFee));
  const [wf, setWf] = useState(String(settings.defaultWithdrawFee));
  return (
    <Page title="Transfer fees" back sub="Default costs — you can still change them on each transfer">
      <Card className="p-4 space-y-3.5">
        <h3 className="font-semibold">Global defaults</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Transfer fee (₱)"><Input inputMode="decimal" value={tf} onChange={(e) => setTf(e.target.value.replace(/[^0-9.]/g, ""))} onBlur={() => st.updateSettings({ defaultTransferFee: num(tf) })} /></Field>
          <Field label="Withdraw fee (₱)"><Input inputMode="decimal" value={wf} onChange={(e) => setWf(e.target.value.replace(/[^0-9.]/g, ""))} onBlur={() => st.updateSettings({ defaultWithdrawFee: num(wf) })} /></Field>
        </div>
      </Card>
      <section>
        <h3 className="font-display text-lg font-semibold mb-1">Per bank</h3>
        <p className="text-[13px] text-muted-foreground mb-2">Leave blank to use the global default. Fees are charged to the account the money leaves.</p>
        <Card className="px-4 divide-y divide-border/60">
          {accounts.map((a) => <FeeRow key={a.id} a={a} />)}
        </Card>
      </section>
    </Page>
  );
}
function FeeRow({ a }: { a: Account }) {
  const st = useStore();
  const [t, setT] = useState(a.transferFee === undefined ? "" : String(a.transferFee));
  const [w, setW] = useState(a.withdrawFee === undefined ? "" : String(a.withdrawFee));
  const commit = () => st.saveAccount({ ...a, transferFee: t === "" ? undefined : num(t), withdrawFee: w === "" ? undefined : num(w) });
  return (
    <div className="py-3">
      <p className="mb-2 flex items-center gap-2 font-semibold text-[15px]"><i className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />{a.name}</p>
      <div className="grid grid-cols-2 gap-2.5">
        <Input className="h-11" inputMode="decimal" placeholder="Transfer: default" value={t} onChange={(e) => setT(e.target.value.replace(/[^0-9.]/g, ""))} onBlur={commit} />
        <Input className="h-11" inputMode="decimal" placeholder="Withdraw: default" value={w} onChange={(e) => setW(e.target.value.replace(/[^0-9.]/g, ""))} onBlur={commit} />
      </div>
    </div>
  );
}

/* ============================ Banks ============================ */
const COLORS = ["#1f5c4a", "#2f5fa8", "#2b7fe0", "#e0742f", "#a8432f", "#8a5aa8", "#3b8a4e", "#b0872a", "#4a5568", "#c2547a"];

export function Banks() {
  const st = useStore();
  const [edit, setEdit] = useState<Account | null>(null);
  const blank = (): Account => ({ id: uid("ACC"), name: "", kind: "bank", initial: 0, color: COLORS[st.data.accounts.length % COLORS.length] });
  return (
    <Page title="Banks & wallets" back sub="Where your money lives"
      right={<Btn variant="soft" className="h-10 px-3.5 text-sm" onClick={() => setEdit(blank())}><Plus size={16} /> Add</Btn>}>
      <Card className="px-4 divide-y divide-border/60">
        {st.data.accounts.map((a) => (
          <button key={a.id} onClick={() => setEdit(a)} className="flex w-full items-center gap-3 py-3.5 text-left">
            <i className="h-3 w-3 rounded-full" style={{ background: a.color }} />
            <span className="flex-1 min-w-0"><span className="block truncate font-semibold text-[15px]">{a.name}</span><span className="block text-[12.5px] text-muted-foreground capitalize">{a.kind} · starts at {peso(a.initial)}</span></span>
            <ChevronRight size={17} className="text-muted-foreground" />
          </button>
        ))}
      </Card>
      {edit && <BankForm key={edit.id} acc={edit} isNew={!st.data.accounts.some((a) => a.id === edit.id)} onClose={() => setEdit(null)} />}
    </Page>
  );
}

function BankForm({ acc, isNew, onClose }: { acc: Account; isNew: boolean; onClose: () => void }) {
  const st = useStore();
  const [a, setA] = useState({ ...acc, init: String(acc.initial), tf: acc.transferFee === undefined ? "" : String(acc.transferFee), wf: acc.withdrawFee === undefined ? "" : String(acc.withdrawFee) });
  const [err, setErr] = useState("");
  const save = () => {
    if (!a.name.trim()) return;
    st.saveAccount({ id: a.id, name: a.name.trim(), kind: a.kind, color: a.color, initial: num(a.init), transferFee: a.tf === "" ? undefined : num(a.tf), withdrawFee: a.wf === "" ? undefined : num(a.wf) });
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={isNew ? "Add bank or wallet" : "Edit account"}>
      <Field label="Name"><Input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} placeholder="e.g. BDO, Maya, Piggy bank" autoFocus={isNew} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type"><Select value={a.kind} onChange={(e) => setA({ ...a, kind: e.target.value as Account["kind"] })}><option value="bank">Bank</option><option value="wallet">E-wallet</option><option value="cash">Cash</option></Select></Field>
        <Field label="Starting balance"><Input inputMode="decimal" value={a.init} onChange={(e) => setA({ ...a, init: e.target.value.replace(/[^0-9.-]/g, "") })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Transfer fee" hint="blank = default"><Input inputMode="decimal" value={a.tf} onChange={(e) => setA({ ...a, tf: e.target.value.replace(/[^0-9.]/g, "") })} /></Field>
        <Field label="Withdraw fee" hint="blank = default"><Input inputMode="decimal" value={a.wf} onChange={(e) => setA({ ...a, wf: e.target.value.replace(/[^0-9.]/g, "") })} /></Field>
      </div>
      <div>
        <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Color</span>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => setA({ ...a, color: c })} className={cn("h-9 w-9 rounded-full border-2 grid place-items-center", a.color === c ? "border-foreground" : "border-transparent")} style={{ background: c }}>{a.color === c && <Check size={16} className="text-white" />}</button>)}
        </div>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-3 pt-1">
        {!isNew && <Btn variant="danger" aria-label="Delete" onClick={() => { if (!confirm(`Delete ${acc.name}?`)) return; const e = st.deleteAccount(acc.id); if (e) setErr(e); else onClose(); }}><Trash2 size={18} /></Btn>}
        <Btn className="flex-1" disabled={!a.name.trim()} onClick={save}>{isNew ? "Add account" : "Save"}</Btn>
      </div>
    </Sheet>
  );
}
