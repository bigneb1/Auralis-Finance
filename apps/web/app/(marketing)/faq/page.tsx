import { ChevronDown } from "lucide-react";
import { PageHero } from "../../../components/marketing";

export default function FaqPage(){const items=[
["What is Auralis?","Auralis is an AI agent that rates tokenized real-world assets, verifies whether your wallet may hold them, and manages a portfolio under hard guardrails — proving every decision on-chain."],
["Is it custodial?","No. Auralis holds no funds and no keys. The user approves every action; the agent advises."],
["Is this financial or legal advice?","No. Auralis provides risk information and compliance tooling. Use it to support your own decisions and due diligence."],
["Which assets are supported?","At launch: USDY, QCDT, mETH, cmETH, USDe, MI4, Aave on Mantle, and Merchant Moe LPs."],
["What does it cost?","Read access is free. The Intelligence API and premium treasury tier are paid. Attestation minting carries a small on-chain fee."],
["How do compliance attestations work?","Auralis evaluates eligibility for your jurisdiction, you mint an attestation, and the result is anchored on Mantle. The attestation is portable."],
["What is the Auralis Rating?","A composite 0–100 risk score and AAA–C letter grade across seven dimensions. Every rating is versioned and verifiable."],
["What's on the roadmap?","More asset classes, deeper simulator scenarios, and a public Intelligence API."],
]; return <main><PageHero eyebrow="Frequently asked" title="Questions, answered." narrow>Everything evaluators, treasury teams, and builders usually ask before opening the app.</PageHero><section className="mx-auto max-w-3xl px-4 pb-24"><div className="grid gap-2">{items.map(([q,a])=><details key={q} className="group rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium"><span>{q}</span><ChevronDown size={16} className="text-[var(--text-secondary)] transition group-open:rotate-180"/></summary><p className="px-5 pb-5 text-[15px] leading-7 text-[var(--text-secondary)]">{a}</p></details>)}</div></section></main>}
