"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, Mail, Network, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useChainId, useConnect } from "wagmi";
import type { Connector } from "wagmi";
import { Button, Card, StatusPill } from "@auralis/ui";

const MANTLE_CHAIN_ID = 5000;
const stepDef = ["Connect", "Network", "Mode", "Risk profile", "First scan"];
const wallets = [
  { id: "metamask", name: "MetaMask", desc: "Browser extension wallet", emoji: "🦊" },
  { id: "wc", name: "WalletConnect", desc: "Mobile wallets via QR", emoji: "🔗" },
  { id: "cb", name: "Coinbase Wallet", desc: "Self-custody wallet", emoji: "🪙" },
  { id: "rabby", name: "Rabby", desc: "DeFi-focused desktop wallet", emoji: "🐰" },
];

type NetworkState = "idle" | "pending" | "success" | "wrong" | "error";
type WalletId = (typeof wallets)[number]["id"];

type EthereumProvider = { isRabby?: boolean; request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };

function getEthereumProvider(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const eth = (window as typeof window & { ethereum?: EthereumProvider & { providers?: EthereumProvider[] } }).ethereum;
  const providers: EthereumProvider[] | undefined = eth?.providers;
  return providers?.find((provider: EthereumProvider) => provider.isRabby) ?? eth;
}

function shortAddress(address?: string) { return address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—"; }
function title(value: string) { return value ? value[0].toUpperCase() + value.slice(1) : value; }

export default function AppHome() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connectAsync, isPending: walletPending } = useConnect();
  const [emailWalletAddress, setEmailWalletAddress] = useState<string | undefined>();
  const [step, setStep] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>("idle");
  const [mode, setModeState] = useState("advisory");
  const [risk, setRiskState] = useState("Balanced");
  const [drawdown, setDrawdownState] = useState("-15% (Moderate)");
  const [liq, setLiqState] = useState("Medium · 72h exit");
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const walletAddress = address ?? emailWalletAddress;
  const liveChainId = chainId || (emailWalletAddress ? MANTLE_CHAIN_ID : undefined);
  const currentNetworkState: NetworkState = chainId === MANTLE_CHAIN_ID ? "success" : isConnected ? "wrong" : "idle";
  const displayedNetworkState = networkState === "pending" || networkState === "error" ? networkState : currentNetworkState;
  const verified = liveChainId === MANTLE_CHAIN_ID && displayedNetworkState === "success";
  const canNext = step === 0 ? !!walletAddress : step === 1 ? verified : step < 4;

  const persistUser = useCallback(async (patch: Record<string, unknown>) => {
    if (!walletAddress) return;
    await fetch(`/api/users/${walletAddress}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ walletAddress, chainId: liveChainId, ...patch }) });
  }, [liveChainId, walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    void persistUser({ mode, riskProfile: risk, maxDrawdown: drawdown, liquidity: liq });
  }, [drawdown, liq, mode, persistUser, risk, walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    void fetch(`/api/users/${walletAddress}`).then((res) => res.json()).then(({ user }) => { if (user?.onboardingDone) router.replace("/app/dashboard"); }).catch(() => undefined);
  }, [router, walletAddress]);

  function pickConnector(id: WalletId): Connector | undefined {
    if (id === "wc") return connectors.find((connector) => connector.id === "walletConnect" || /walletconnect/i.test(connector.name));
    if (id === "cb") return connectors.find((connector) => connector.id === "coinbaseWallet" || /coinbase/i.test(connector.name));
    if (id === "rabby") return connectors.find((connector) => /rabby/i.test(connector.name)) ?? connectors.find((connector) => connector.id === "injected");
    return connectors.find((connector) => /metaMask/i.test(connector.name)) ?? connectors.find((connector) => connector.id === "injected");
  }

  async function connectWallet(id: WalletId, name: string) {
    setSelectedWallet(name);
    const connector = pickConnector(id);
    if (!connector) return;
    const result = await connectAsync({ connector });
    await fetch(`/api/users/${result.accounts[0]}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ walletAddress: result.accounts[0], chainId: result.chainId, mode, riskProfile: risk, maxDrawdown: drawdown, liquidity: liq }) });
  }

  async function connectEmail() { setSelectedWallet("Email"); }

  const handleEmailWallet = useCallback(async (wallet: string) => {
    setEmailWalletAddress(wallet);
    await fetch(`/api/users/${wallet}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ walletAddress: wallet, chainId: MANTLE_CHAIN_ID, mode, riskProfile: risk, maxDrawdown: drawdown, liquidity: liq }) });
  }, [drawdown, liq, mode, risk]);

  async function switchToMantle() {
    const provider = getEthereumProvider();
    if (!provider) { setNetworkState("error"); return; }
    setNetworkState("pending");
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1388" }] });
      setNetworkState("success");
      await persistUser({ chainId: MANTLE_CHAIN_ID });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code === 4902) {
        await provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: "0x1388", chainName: "Mantle", nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 }, rpcUrls: [process.env.NEXT_PUBLIC_MANTLE_RPC_URL ?? "https://rpc.mantle.xyz"], blockExplorerUrls: [process.env.NEXT_PUBLIC_MANTLE_EXPLORER_URL ?? "https://explorer.mantle.xyz"] }] });
        setNetworkState("success");
        await persistUser({ chainId: MANTLE_CHAIN_ID });
      } else setNetworkState(currentNetworkState === "success" ? "success" : "wrong");
    }
  }

  const saveMode = (value: string) => { setModeState(value); void persistUser({ mode: value }); };
  const saveRisk = (value: string) => { setRiskState(value); void persistUser({ riskProfile: value }); };
  const saveDrawdown = (value: string) => { setDrawdownState(value); void persistUser({ maxDrawdown: value }); };
  const saveLiquidity = (value: string) => { setLiqState(value); void persistUser({ liquidity: value }); };

  async function runScan(){
    if (!walletAddress) return;
    setScanning(true); setScanMessage(null);
    for (const pct of [18,38,64,83]) { setScanPct(pct); await new Promise(r=>setTimeout(r,120)); }
    try {
      const res = await fetch("/api/compliance/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ wallet: walletAddress, jurisdiction: "NG" }) });
      if (!res.ok) throw new Error(`Compliance scan failed: ${res.status}`);
      await res.json();
      setScanPct(100);
      await persistUser({ onboardingDone: true, jurisdiction: "NG" });
      router.replace("/app/dashboard");
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : "Compliance scan failed.");
      setScanning(false);
    }
  }

  return <main className="mx-auto max-w-6xl"><div className="mb-8 text-center"><h1 className="font-display text-5xl tracking-[-0.03em]">Welcome to Auralis Finance</h1><p className="mt-3 text-[var(--text-secondary)]">No seed phrase. No gas for your first check.</p></div><div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]"><Card className="p-8"><StepRail step={step}/>{step===0&&<section><h2 className="font-display text-[28px]">Connect your wallet</h2><p className="mt-2 text-[var(--text-secondary)]">Pick how you&apos;d like to sign in. You can change this later.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{wallets.map(w=><button key={w.id} onClick={()=>connectWallet(w.id as WalletId, w.name)} disabled={walletPending} className={`rounded-[var(--radius-card)] border p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 ${selectedWallet===w.name?"border-[var(--teal)] bg-[var(--teal-wash)]":"border-[var(--border)] bg-[var(--surface)]"}`}><div className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--surface-muted)] text-lg">{w.emoji}</span><span><span className="block font-medium">{w.name}</span><span className="text-xs text-[var(--text-secondary)]">{w.desc}</span></span></div></button>)}</div><div className="my-6 h-px bg-[var(--border)]"/><EmailConnectButton active={selectedWallet==="Email"} onSelect={connectEmail} onWallet={handleEmailWallet}/>{walletAddress&&<div className="mt-4 flex items-center justify-between rounded-[var(--radius-card)] border border-transparent bg-[#E6F5EC] p-3 text-sm"><span className="flex items-center gap-2 font-medium text-[var(--emerald)]"><Check size={14}/>Connected via {selectedWallet ?? "Wallet"}</span><span className="font-mono text-xs">{shortAddress(walletAddress)}</span></div>}</section>}
  {step===1&&<section><h2 className="font-display text-[28px]">Verify network</h2><p className="mt-2 text-[var(--text-secondary)]">Auralis runs on Mantle. We&apos;ll confirm your wallet is on the right chain.</p><Card className="mt-6 flex items-center justify-between p-5 shadow-none"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--teal-wash)] text-[var(--teal)]"><Network size={18}/></span><span><span className="block font-medium">Mantle Mainnet</span><span className="font-mono text-xs text-[var(--text-secondary)]">Chain ID 5000 · current {liveChainId ?? "—"}</span></span></div>{displayedNetworkState==="success"?<StatusPill status="eligible"><Check size={12}/>Verified</StatusPill>:<Button onClick={switchToMantle} size="sm" disabled={!walletAddress || displayedNetworkState==="pending"}>{displayedNetworkState==="pending"?"Switching…":displayedNetworkState==="wrong"?"Switch network":"Verify"}</Button>}</Card>{displayedNetworkState==="wrong"&&<p className="mt-3 text-sm text-[var(--amber)]">Wrong network. Please approve the Mantle switch in your wallet.</p>}{displayedNetworkState==="error"&&<p className="mt-3 text-sm text-[var(--rose)]">No injected wallet provider found for network switching.</p>}</section>}
  {step===2&&<section><h2 className="font-display text-[28px]">Choose mode</h2><p className="mt-2 text-[var(--text-secondary)]">How much should Auralis do for you? You can change this any time.</p><div className="mt-6 grid gap-3">{[["simulation","Simulation","Run risk-aware simulations. No funds move.",SlidersHorizontal],["advisory","Advisory","Get recommendations. You execute every action.",Sparkles],["guarded","Guarded Execution","Auralis executes within your guardrails.",ShieldCheck]].map(([id,t,sub,Icon])=>{const active=mode===id; const I=Icon as typeof Sparkles; return <button key={String(id)} onClick={()=>saveMode(String(id))} className={`flex items-center justify-between rounded-[var(--radius-card)] border p-4 text-left shadow-[var(--shadow-soft)] ${active?"border-[var(--teal)] bg-[var(--teal-wash)]":"border-[var(--border)] bg-[var(--surface)]"}`}><span className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--surface-muted)] text-[var(--teal)]"><I size={18}/></span><span><span className="block font-medium">{String(t)}</span><span className="text-sm text-[var(--text-secondary)]">{String(sub)}</span></span></span>{active&&<StatusPill tone="teal"><Check size={12}/>Selected</StatusPill>}</button>})}</div></section>}
  {step===3&&<section><h2 className="font-display text-[28px]">Risk profile</h2><p className="mt-2 text-[var(--text-secondary)]">Set the shape of your portfolio. We&apos;ll size your guardrails to match.</p><div className="mt-6 flex rounded-[10px] bg-[var(--surface-muted)] p-1">{["Conservative","Moderate","Balanced","Growth","Aggressive"].map(r=><button key={r} onClick={()=>saveRisk(r)} className={`flex-1 rounded-md px-2 py-2 text-sm ${risk===r?"bg-[var(--surface)] font-medium shadow-[var(--shadow-soft)]":"text-[var(--text-secondary)]"}`}>{r}</button>)}</div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Max drawdown</span><select value={drawdown} onChange={e=>saveDrawdown(e.target.value)} className="h-10 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3"><option>-5% (Conservative)</option><option>-10% (Cautious)</option><option>-15% (Moderate)</option><option>-25% (Growth)</option></select></label><label className="grid gap-2 text-sm"><span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Liquidity preference</span><select value={liq} onChange={e=>saveLiquidity(e.target.value)} className="h-10 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3"><option>High · same-day exit</option><option>Medium · 72h exit</option><option>Low · &gt; 1 week</option></select></label></div></section>}
  {step===4&&<section><h2 className="font-display text-[28px]">First compliance scan</h2><p className="mt-2 text-[var(--text-secondary)]">Auralis checks your wallet against sanctions lists and risk heuristics. It takes a moment.</p><Card className="mt-6 bg-[var(--surface-muted)] p-8 text-center shadow-none">{!scanning?<><div className="mx-auto grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--teal-wash)] text-[var(--teal)]"><ShieldCheck size={24}/></div><div className="mt-4 font-display text-xl">Run my first compliance scan</div><p className="mt-2 text-sm text-[var(--text-secondary)]">No seed phrase. No gas for your first check.</p><Button className="mt-5" size="lg" disabled={!walletAddress} onClick={runScan}>Start scan <ArrowRight size={14}/></Button>{scanMessage&&<p className="mt-3 text-sm text-[var(--rose)]">{scanMessage}</p>}</>:<><div className="font-medium">Scanning wallet eligibility…</div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]"><div className="h-full bg-[var(--teal)] transition-all" style={{width:`${scanPct}%`}}/></div></>}</Card></section>}
  <div className="mt-8 flex items-center justify-between"><Button variant="ghost" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}><ChevronLeft size={14}/>Back</Button><div className="flex gap-3">{step<4&&<Button disabled={!canNext} onClick={()=>setStep(step+1)}>Next <ArrowRight size={14}/></Button>}</div></div></Card><ConfigCard step={step} connected={selectedWallet} address={walletAddress} chainId={liveChainId} verified={verified} mode={mode} risk={risk} drawdown={drawdown} liq={liq}/></div></main>;
}

function EmailConnectButton({ active, onSelect, onWallet }: { active: boolean; onSelect: () => void; onWallet: (wallet: string) => void }) {
  const privyEnabled = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
  if (!privyEnabled) return <button onClick={onSelect} className={`flex w-full items-center justify-between rounded-[var(--radius-card)] border p-4 text-left shadow-[var(--shadow-soft)] transition ${active?"border-[var(--teal)] bg-[var(--teal-wash)]":"border-[var(--border)] bg-[var(--surface)]"}`}><span className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--surface-muted)]"><Mail size={18}/></span><span><span className="block font-medium">Continue with email</span><span className="text-xs text-[var(--text-secondary)]">Privy email login is enabled when NEXT_PUBLIC_PRIVY_APP_ID is configured.</span></span></span><ArrowRight size={14}/></button>;
  return <PrivyEmailConnect active={active} onSelect={onSelect} onWallet={onWallet} />;
}
function PrivyEmailConnect({ active, onSelect, onWallet }: { active: boolean; onSelect: () => void; onWallet: (wallet: string) => void }) {
  const { login, authenticated, user } = usePrivy();
  useEffect(() => { const wallet = user?.wallet?.address; if (authenticated && wallet) onWallet(wallet); }, [authenticated, onWallet, user?.wallet?.address]);
  return <button onClick={() => { onSelect(); void login(); }} className={`flex w-full items-center justify-between rounded-[var(--radius-card)] border p-4 text-left shadow-[var(--shadow-soft)] transition ${active?"border-[var(--teal)] bg-[var(--teal-wash)]":"border-[var(--border)] bg-[var(--surface)]"}`}><span className="flex gap-3"><span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--surface-muted)]"><Mail size={18}/></span><span><span className="block font-medium">Continue with email</span><span className="text-xs text-[var(--text-secondary)]">No wallet today — we&apos;ll generate one for you.</span></span></span><ArrowRight size={14}/></button>;
}
function StepRail({ step }: { step: number }) { return <div className="mb-7 flex items-center gap-2">{stepDef.map((label,i)=><div key={label} className="flex flex-1 items-center gap-2"><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${i<step?"bg-[var(--teal)] text-white":i===step?"border-2 border-[var(--teal)] bg-[var(--teal-wash)] text-[var(--teal)]":"bg-[var(--surface-muted)] text-[var(--text-secondary)]"}`}>{i<step?<Check size={12}/>:i+1}</span><span className={`hidden text-xs sm:block ${i===step?"font-medium text-[var(--ink)]":"text-[var(--text-secondary)]"}`}>{label}</span>{i<stepDef.length-1&&<span className={`h-px flex-1 ${i<step?"bg-[var(--teal)]":"bg-[var(--border)]"}`}/>}</div>)}</div> }
function ConfigCard({ step, connected, address, chainId, verified, mode, risk, drawdown, liq }: { step:number; connected:string|null; address?:string; chainId?:number; verified:boolean; mode:string; risk:string; drawdown:string; liq:string }) { const row=(l:string,v:string)=><div className="flex justify-between gap-4 border-b border-[var(--border)] py-2 text-sm"><span className="text-[var(--text-secondary)]">{l}</span><span className={`text-right font-medium ${v==="—"?"text-[var(--text-secondary)]":""}`}>{v}</span></div>; return <aside><Card className="sticky top-24 p-5"><div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Your configuration</div>{row("Wallet", address ? `${connected ?? "Wallet"} · ${shortAddress(address)}` : "—")}{row("Network", verified ? "Mantle Mainnet · 5000" : chainId ? `Wrong network · ${chainId}` : "—")}{row("Mode", step>=2 ? title(mode) : "—")}{row("Risk profile", step>=3 ? risk : "—")}{row("Max drawdown", step>=3 ? drawdown : "—")}{row("Liquidity", step>=3 ? liq : "—")}<div className="my-3 h-px bg-[var(--border)]"/><div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Why this matters</div><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Your mode and risk profile shape every recommendation. Auralis enforces them as hard limits — nothing executes outside.</p></Card></aside> }
