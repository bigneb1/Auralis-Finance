"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, FileText, Home, MessageSquare, Plug, Scale, Search, ShieldCheck, SlidersHorizontal, Sparkles, Star, Target, Settings } from "lucide-react";
import { RouteTransition } from "../../../components/MotionPrimitives";
import { BrandMark } from "../../../components/marketing";
import { WalletButton } from "../../../lib/wallet-button";

const groups = [
  { label: "OVERVIEW", items: [["/app/dashboard", "Dashboard", Home]] },
  { label: "DISCOVER", items: [["/app/opportunities", "Opportunities", Target], ["/ratings", "Ratings", Star]] },
  { label: "ACT", items: [["/app/simulator", "Simulator", SlidersHorizontal], ["/app/copilot", "AI Copilot", Sparkles]] },
  { label: "GOVERN", items: [["/app/compliance", "Compliance", ShieldCheck], ["/app/policies", "Policies", Scale], ["/app/decisions", "Decisions", FileText]] },
  { label: "SYSTEM", items: [["/app/agent", "Agent", Cpu], ["/app/integrations", "Integrations", Plug], ["/app/settings", "Settings", Settings]] },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="min-h-screen max-w-full overflow-x-hidden bg-[var(--paper)] text-[var(--ink)] md:grid md:grid-cols-[240px_minmax(0,1fr)]">
    <aside className="hidden h-screen flex-col border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 md:flex">
      <Link href="/" className="flex items-start gap-3 rounded-lg px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]"><BrandMark /><div><div className="text-sm font-semibold">Auralis Finance</div><div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]"/>Mantle Mainnet</div></div></Link>
      <nav aria-label="Application" className="mt-6 min-h-0 flex-1 overflow-auto pr-1">{groups.map((group)=><div key={group.label} className="mb-5"><div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--text-secondary)]">{group.label}</div><div className="grid gap-1">{group.items.map(([href,label,Icon])=>{const active = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} className={`relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)] ${active ? "bg-[var(--teal-wash)] font-medium text-[var(--teal)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"}`}>{active && <span className="absolute left-0 top-2 h-5 w-0.5 rounded-full bg-[var(--teal)]"/>}<Icon size={16}/><span>{label}</span></Link>})}</div></div>)}</nav>
      <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] p-3"><div className="flex items-center gap-2 text-sm font-medium"><MessageSquare size={14}/>Need help?</div><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Browse the docs or ask the Copilot.</p></div>
    </aside>
    <main className="min-w-0"><header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-6"><div className="hidden h-9 w-full max-w-md items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-secondary)] lg:flex"><Search size={14}/><span className="flex-1">Search any asset, protocol, or page…</span><kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px]">⌘K</kbd></div><span className="text-sm text-[var(--text-secondary)] lg:ml-auto">Mantle Mainnet · chainId 5000</span><WalletButton /></header><RouteTransition><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div></RouteTransition></main>
  </div>;
}
