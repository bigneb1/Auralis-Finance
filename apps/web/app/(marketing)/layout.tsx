import Link from "next/link";

const links = [["/product", "Product"], ["/ratings", "Ratings"], ["/methodology", "Methodology"], ["/security", "Security"], ["/docs", "Docs"], ["/faq", "FAQ"], ["/business", "Business"]];
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div><header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--paper)]/90 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"><Link href="/" className="font-display text-2xl">Auralis</Link><div className="hidden gap-5 text-sm md:flex">{links.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</div><div className="flex items-center gap-3"><span className="rounded-full bg-[var(--teal-wash)] px-3 py-1 text-xs text-[var(--teal)]">Mantle 5000</span><Link href="/app" className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white">Open App</Link></div></nav></header>{children}<footer className="border-t border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">Auralis Finance · Compliance tooling, not legal advice.</footer></div>;
}
