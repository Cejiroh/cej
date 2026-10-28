import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutDashboard, CalendarDays, ListOrdered, Target, SlidersHorizontal, ArrowLeftRight, Landmark, PlugZap, RefreshCw, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useUI } from "@/lib/ui";
import { go, useRoute } from "@/lib/router";
import { addMonths, monthKey, monthLabel, parseISO, todayISO, toISO } from "@/lib/fin";
import { cn } from "@/lib/utils";

function Calendar({ onPick }: { onPick: (iso: string) => void }) {
  const { data } = useStore();
  const route = useRoute();
  const selected = route.view === "day" ? route.arg : "";
  const [month, setMonth] = useState(monthKey(selected || todayISO()));
  const today = todayISO();

  const marks = useMemo(() => {
    const m = new Map<string, { out: boolean; inn: boolean }>();
    const mark = (d: string, k: "out" | "inn") => { const x = m.get(d) ?? { out: false, inn: false }; x[k] = true; m.set(d, x); };
    data.expenses.forEach((e) => mark(e.date, "out"));
    data.transfers.forEach((e) => mark(e.date, "out"));
    data.income.forEach((e) => mark(e.date, "inn"));
    return m;
  }, [data]);

  const first = parseISO(month + "-01");
  const lead = first.getDay();
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => toISO(new Date(first.getFullYear(), first.getMonth(), i + 1)))];

  return (
    <div className="rounded-2xl bg-card border border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMonth(addMonths(month, -1))} aria-label="Previous month" className="h-9 w-9 grid place-items-center rounded-full active:bg-secondary"><ChevronLeft size={18} /></button>
        <button onClick={() => setMonth(monthKey(today))} className="font-display font-semibold text-[16px]">{monthLabel(month)}</button>
        <button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month" className="h-9 w-9 grid place-items-center rounded-full active:bg-secondary"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((iso, i) =>
          iso ? (
            <button key={iso} onClick={() => onPick(iso)}
              className={cn("relative h-8 rounded-lg text-[14px] tnum active:bg-secondary",
                iso === selected && "bg-primary text-primary-foreground font-semibold",
                iso === today && iso !== selected && "ring-1 ring-accent font-semibold")}>
              {Number(iso.slice(8))}
              {marks.has(iso) && (
                <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 flex gap-[3px]">
                  {marks.get(iso)!.out && <i className={cn("h-1 w-1 rounded-full", iso === selected ? "bg-primary-foreground" : "bg-destructive")} />}
                  {marks.get(iso)!.inn && <i className={cn("h-1 w-1 rounded-full", iso === selected ? "bg-primary-foreground" : "bg-primary")} />}
                </span>
              )}
            </button>
          ) : <span key={`b${i}`} />,
        )}
      </div>
      <div className="mt-2 flex items-center gap-3 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-destructive" />spent</span>
        <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-primary" />income</span>
        <button onClick={() => onPick(today)} className="ml-auto font-semibold text-primary">Today</button>
      </div>
    </div>
  );
}

export default function Drawer() {
  const { drawer, setDrawer } = useUI();
  const st = useStore();
  const route = useRoute();
  if (!drawer) return null;

  const nav = (path: string) => { setDrawer(false); go(path); };
  const Item = ({ icon: I, label, path, sub }: { icon: typeof LayoutDashboard; label: string; path: string; sub?: string }) => {
    const active = `${route.view}${route.arg ? "/" + route.arg : ""}` === path;
    return (
      <button onClick={() => nav(path)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 h-11 text-left text-[15px] font-medium active:bg-secondary", active && "bg-secondary text-primary font-semibold")}>
        <I size={19} className="shrink-0" /><span className="flex-1">{label}</span>{sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </button>
    );
  };
  const Group = ({ children }: { children: string }) => <p className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">{children}</p>;

  const syncLabel = st.sync.state === "off" ? "Not connected" : st.sync.state === "syncing" ? "Syncing…" : st.sync.state === "error" ? "Sync problem" : st.sync.pending ? `${st.sync.pending} waiting to sync` : "Synced with Google Sheet";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40 anim-fade" onClick={() => setDrawer(false)} />
      <aside className="anim-right absolute left-0 top-0 h-full w-[86%] max-w-[340px] bg-background shadow-2xl flex flex-col pt-safe">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="./favicon.svg" alt="" className="h-9 w-9 rounded-xl" />
            <div><p className="font-display text-xl font-semibold leading-none">Ipon</p><p className="text-[11px] text-muted-foreground mt-0.5">Savings tracker</p></div>
          </div>
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="h-9 w-9 grid place-items-center rounded-full bg-secondary"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <Calendar onPick={(iso) => nav(`day/${iso}`)} />
          <Group>Go to</Group>
          <Item icon={LayoutDashboard} label="Hub" path="hub" />
          <Item icon={CalendarDays} label="Today" path={`day/${todayISO()}`} />
          <Item icon={ListOrdered} label="All transactions" path="history" />
          <Item icon={ArrowLeftRight} label="Transfer & withdraw" path="transfer" />
          <Item icon={Landmark} label="Accounts" path="accounts" />
          <Group>Settings</Group>
          <Item icon={Target} label="Target expenses" path="settings/targets" />
          <Item icon={SlidersHorizontal} label="Custom fields" path="settings/fields" />
          <Item icon={ArrowLeftRight} label="Transfer fees" path="settings/fees" />
          <Item icon={Landmark} label="Banks & wallets" path="settings/banks" />
          <Item icon={PlugZap} label="Google Sheet connection" path="settings/connection" />
        </div>
        <button onClick={() => void st.syncNow()} disabled={st.sync.state === "off"}
          className="mx-3 mb-3 mt-1 flex items-center gap-2 rounded-xl bg-secondary px-3 h-12 text-sm font-medium text-left disabled:opacity-60 pb-safe">
          <RefreshCw size={16} className={cn(st.sync.state === "syncing" && "animate-spin")} />
          <span className="flex-1">{syncLabel}</span>
          {st.sync.state !== "off" && <span className="text-xs font-semibold text-primary">Sync now</span>}
        </button>
      </aside>
    </div>
  );
}
