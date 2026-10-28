import { Menu, Plus, Settings as Gear, LayoutDashboard, ArrowLeftRight, Landmark, CloudOff, Cloud, CloudAlert } from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import { UIProvider, useUI } from "@/lib/ui";
import { go, useRoute } from "@/lib/router";
import { cn } from "@/lib/utils";
import Drawer from "@/components/Drawer";
import EntrySheet from "@/components/EntrySheet";
import TransferSheet from "@/components/TransferSheet";
import Hub from "@/screens/Hub";
import Transfer from "@/screens/Transfer";
import Accounts from "@/screens/Accounts";
import Day from "@/screens/Day";
import History from "@/screens/History";
import { SettingsHome, Connection, Targets, Fields, Fees, Banks } from "@/screens/Settings";

function Shell() {
  const route = useRoute();
  const { setDrawer, openEntry } = useUI();
  const st = useStore();

  const tabs = [
    { id: "hub", label: "Hub", icon: LayoutDashboard },
    { id: "transfer", label: "Transfer", icon: ArrowLeftRight },
    { id: "accounts", label: "Accounts", icon: Landmark },
  ];
  const tabActive = route.view === "account" ? "accounts" : ["day", "history", "settings"].includes(route.view) ? "" : route.view;

  let screen;
  switch (route.view) {
    case "transfer": screen = <Transfer />; break;
    case "accounts": screen = <Accounts />; break;
    case "account": screen = <Accounts detailId={route.arg} />; break;
    case "day": screen = <Day iso={route.arg} />; break;
    case "history": screen = <History />; break;
    case "settings":
      screen = route.arg === "connection" ? <Connection /> : route.arg === "targets" ? <Targets /> : route.arg === "fields" ? <Fields /> : route.arg === "fees" ? <Fees /> : route.arg === "banks" ? <Banks /> : <SettingsHome />;
      break;
    default: screen = <Hub />;
  }

  const SyncIcon = st.sync.state === "off" ? CloudOff : st.sync.state === "error" ? CloudAlert : Cloud;

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col bg-background">
      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between bg-background/95 px-2 backdrop-blur">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="h-12 w-12 grid place-items-center rounded-full active:bg-secondary"><Menu /></button>
        <button onClick={() => go("hub")} className="font-display text-xl font-bold tracking-tight text-primary">Ipon</button>
        <div className="flex">
          <button onClick={() => go("settings/connection")} aria-label="Sync status" className={cn("h-12 w-10 grid place-items-center rounded-full", st.sync.state === "error" ? "text-destructive" : st.sync.state === "off" ? "text-muted-foreground" : "text-primary")}>
            <SyncIcon size={20} className={cn(st.sync.state === "syncing" && "animate-pulse")} />
          </button>
          <button onClick={() => go("settings")} aria-label="Settings" className="h-12 w-12 grid place-items-center rounded-full active:bg-secondary"><Gear size={22} /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28" key={route.view + route.arg}>{screen}</main>

      {["hub", "day", "accounts", "account", "history"].includes(route.view) && <button onClick={() => openEntry({ kind: "expense", date: route.view === "day" ? route.arg : undefined, accountId: route.view === "account" ? route.arg : undefined })} aria-label="Add entry"
        className="fixed right-4 z-40 h-14 w-14 rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/40 grid place-items-center active:scale-95 transition"
        style={{ bottom: "calc(76px + var(--safe-bottom))", right: "max(1rem, calc((100vw - 32rem) / 2 + 1rem))" }}>
        <Plus size={28} strokeWidth={2.6} />
      </button>}

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-safe">
        <div className="mx-auto flex max-w-lg">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} className={cn("flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11.5px] font-semibold", tabActive === t.id ? "text-primary" : "text-muted-foreground")}>
              <span className={cn("h-7 w-14 grid place-items-center rounded-full transition", tabActive === t.id && "bg-primary/12")}><t.icon size={21} /></span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <Drawer />
      <EntrySheet />
      <TransferSheet />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <UIProvider>
        <Shell />
      </UIProvider>
    </StoreProvider>
  );
}
