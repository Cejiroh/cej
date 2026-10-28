import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { X, ChevronLeft } from "lucide-react";
import { back } from "@/lib/router";
import { cn } from "@/lib/utils";

export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" | "danger" | "accent" }) {
  const v = {
    primary: "bg-primary text-primary-foreground active:brightness-90",
    accent: "bg-accent text-accent-foreground active:brightness-95",
    soft: "bg-secondary text-secondary-foreground active:brightness-95",
    ghost: "text-primary active:bg-secondary",
    danger: "bg-destructive/10 text-destructive active:bg-destructive/20",
  }[variant];
  return <button {...p} className={cn("h-12 px-5 rounded-xl font-semibold text-[15px] transition disabled:opacity-40 inline-flex items-center justify-center gap-2", v, className)} />;
}

export const inputCls = "w-full h-12 rounded-xl border border-input bg-card px-3.5 text-[16px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60";

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cn(inputCls, "appearance-none bg-no-repeat pr-9", p.className)}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7a72' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: "right 12px center" }} />
);

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}
export const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block"><Label hint={hint}>{label}</Label>{children}</label>
);

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn("rounded-2xl bg-card border border-border/70 shadow-[0_1px_0_hsl(var(--border)/.6)]", className)}>{children}</div>;
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex rounded-xl bg-secondary p-1">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn("flex-1 h-10 rounded-lg text-sm font-semibold transition", value === o.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 anim-fade" onClick={onClose} />
      <div className="anim-up relative w-full max-w-lg max-h-[92dvh] flex flex-col rounded-t-3xl bg-background">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="h-9 w-9 grid place-items-center rounded-full bg-secondary"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 pt-2 pb-[calc(1.25rem+var(--safe-bottom))] space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function Page({ title, back: showBack, right, children, sub }: { title: string; back?: boolean; right?: ReactNode; children: ReactNode; sub?: string }) {
  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-2 py-3">
        {showBack && <button onClick={back} aria-label="Back" className="h-10 w-10 -ml-2 grid place-items-center rounded-full active:bg-secondary"><ChevronLeft /></button>}
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-[26px] leading-tight font-semibold truncate">{title}</h1>
          {sub && <p className="text-sm text-muted-foreground -mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Progress({ pct, tone }: { pct: number; tone: "ok" | "warn" | "over" }) {
  const c = tone === "over" ? "bg-destructive" : tone === "warn" ? "bg-accent" : "bg-primary";
  return (
    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", c)} style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%` }} />
    </div>
  );
}

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">{children}</div>
);
