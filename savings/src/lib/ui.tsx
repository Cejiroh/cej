import { createContext, useContext, useState, type ReactNode } from "react";

export interface EntryReq { kind: "expense" | "income"; id?: string; date?: string; accountId?: string }

interface UI {
  drawer: boolean;
  setDrawer: (v: boolean) => void;
  entry: EntryReq | null;
  openEntry: (r: EntryReq) => void;
  closeEntry: () => void;
  transferId: string | null;
  openTransfer: (id: string | null) => void;
}
const Ctx = createContext<UI | null>(null);
export const useUI = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("UIProvider missing");
  return c;
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const [entry, setEntry] = useState<EntryReq | null>(null);
  const [transferId, openTransfer] = useState<string | null>(null);
  return (
    <Ctx.Provider value={{ drawer, setDrawer, entry, openEntry: setEntry, closeEntry: () => setEntry(null), transferId, openTransfer }}>
      {children}
    </Ctx.Provider>
  );
}
