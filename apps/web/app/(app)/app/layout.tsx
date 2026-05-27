import Link from "next/link";
import { RouteTransition } from "../../../components/MotionPrimitives";
import { WalletButton } from "../../../lib/wallet-button";

const nav = [["/app", "Onboarding"], ["/app/dashboard", "Dashboard"], ["/app/opportunities", "Opportunities"], ["/app/compliance", "Compliance"], ["/app/simulator", "Simulator"], ["/app/copilot", "Copilot"], ["/app/policies", "Policies"], ["/app/decisions", "Decisions"], ["/app/agent", "Agent"], ["/app/integrations", "Integrations"], ["/app/settings", "Settings"]];
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen max-w-full overflow-x-hidden md:grid md:grid-cols-[248px_minmax(0,1fr)]"><aside className="border-r border-[var(--border)] bg-[var(--surface)] p-5"><Link href="/" className="font-display text-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]">Auralis</Link><nav aria-label="Application" className="mt-8 grid gap-2">{nav.map(([href,label])=><Link className="rounded-lg px-3 py-2 hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]" href={href} key={href}>{label}</Link>)}</nav></aside><main className="min-w-0"><div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] p-4"><span className="text-sm text-[var(--text-secondary)]">Mantle Mainnet · chainId 5000</span><WalletButton /></div><RouteTransition><div className="p-4 sm:p-6">{children}</div></RouteTransition></main></div>;
}
