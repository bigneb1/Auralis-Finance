"use client";
import { useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, ConfidenceMeter, Slider, StateWrapper } from "@auralis/ui";
import { MotionDonut } from "../../../../components/MotionPrimitives";
import { TxButton } from "../../../../components/TxButton";

const assets = [
  { symbol: "USDY", current: 42, risk: 28, apy: 4.8 },
  { symbol: "mETH", current: 31, risk: 34, apy: 3.2 },
  { symbol: "USDe", current: 27, risk: 48, apy: 8.4 },
];
const tabs = ["Conservative", "Balanced", "Yield tilt"] as const;
export default function SimulatorPage(){
  const [scenario,setScenario]=useState<typeof tabs[number]>("Balanced");
  const [targets,setTargets]=useState<Record<string,number>>({ USDY: 45, mETH: 30, USDe: 25 });
  const [review,setReview]=useState(false);
  const total = Object.values(targets).reduce((a,b)=>a+b,0);
  const bad = total !== 100 || Math.max(...Object.values(targets)) > 50;
  const policyRows = [
    ["Total allocation = 100%", total === 100, `${total}%`],
    ["Max single asset ≤ 50%", Math.max(...Object.values(targets)) <= 50, `${Math.max(...Object.values(targets))}%`],
    ["AI confidence ≥ 70", true, "82%"],
    ["Liquidity score ≥ 60", true, "78"],
    ["Slippage ≤ 0.50%", true, "0.22%"],
  ] as const;
  const impact = useMemo(()=>({ apy:(assets.reduce((s,a)=>s+a.apy*(targets[a.symbol]??0),0)/100).toFixed(2), risk:(assets.reduce((s,a)=>s+a.risk*(targets[a.symbol]??0),0)/100).toFixed(1), liquidity:"$42.8M", tx:"~0.03 MNT" }),[targets]);
  function setTarget(symbol:string,value:number){ setTargets((t)=>({...t,[symbol]:value})); }
  function applyScenario(s: typeof scenario){ setScenario(s); setTargets(s==="Conservative"?{USDY:50,mETH:35,USDe:15}:s==="Yield tilt"?{USDY:30,mETH:25,USDe:45}:{USDY:45,mETH:30,USDe:25}); }
  return <div className="mx-auto max-w-7xl space-y-6"><div><p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--teal)]">Simulator</p><h1 className="font-display text-4xl">Rebalance simulator</h1><p className="mt-2 text-[var(--text-secondary)]">Preview allocations and enforce AuralisPolicyGuard before any user-signed transaction.</p></div><div className="flex flex-wrap gap-2">{tabs.map(t=><Button key={t} variant={scenario===t?"primary":"secondary"} onClick={()=>applyScenario(t)}>{t}</Button>)}</div><StateWrapper status="populated"><section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"><Card><CardHeader><CardTitle>Current vs proposed</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex flex-wrap items-center gap-8"><div><p className="mb-2 text-sm text-[var(--text-secondary)]">Current USDY weight</p><MotionDonut percent={42} label="current USDY weight"/></div><div><p className="mb-2 text-sm text-[var(--text-secondary)]">Proposed USDY weight</p><MotionDonut percent={targets.USDY} label="proposed USDY weight"/></div></div><div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full text-sm"><thead><tr className="text-left text-[var(--text-secondary)]"><th className="p-3">Asset</th><th className="p-3">Current</th><th className="p-3">Target</th><th className="p-3">Slider</th></tr></thead><tbody>{assets.map(a=><tr className="border-t border-[var(--border)]" key={a.symbol}><td className="p-3 font-medium">{a.symbol}</td><td className="p-3">{a.current}%</td><td className="p-3">{targets[a.symbol]}%</td><td className="p-3"><Slider aria-label={`Target allocation for ${a.symbol}`} min={0} max={100} value={targets[a.symbol]} onChange={e=>setTarget(a.symbol,Number(e.target.value))}/></td></tr>)}</tbody></table></div><div className={total===100?"text-[var(--emerald)]":"text-[var(--rose)]"}>=100% validator: {total}%</div><RoutePreview /></CardContent></Card><Card><CardHeader><CardTitle>Impact summary</CardTitle></CardHeader><CardContent className="space-y-4"><Metric label="APY" value={`${impact.apy}%`}/><Metric label="Risk" value={impact.risk}/><Metric label="Liquidity" value={impact.liquidity}/><Metric label="Tx cost" value={impact.tx}/><ConfidenceMeter value={82}/><Button className="w-full" onClick={()=>setReview(true)}>Review approval</Button></CardContent></Card></section></StateWrapper>{review&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"><Card className="w-full max-w-xl"><CardHeader><CardTitle>Confirm sheet</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-[var(--text-secondary)]">Exact assets: {assets.map(a=>`${a.symbol} ${targets[a.symbol]}%`).join(", ")}</p><Metric label="ChainId" value="5003 Sepolia rehearsal"/><Metric label="Gas estimate" value="~0.03 MNT"/><div className="space-y-2">{policyRows.map(([label,ok,value])=><div key={label} className="flex justify-between rounded-lg border border-[var(--border)] p-2"><span>{label}</span><span className={ok?"text-[var(--emerald)]":"text-[var(--rose)]"}>{ok?"PASS":"BLOCK"} · {value}</span></div>)}</div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setReview(false)}>Close</Button><TxButton disabled={bad} intent="executeRebalance">executeRebalance</TxButton></div></CardContent></Card></div>}</div>;
}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-[var(--surface-muted)] p-3"><div className="text-xs uppercase text-[var(--text-secondary)]">{label}</div><div className="font-medium">{value}</div></div>}
function RoutePreview(){return <div className="rounded-xl bg-[var(--teal-wash)] p-4 text-sm"><b>Route preview:</b> reduce USDe, increase USDY, maintain mETH staking exposure. No autonomous execution.</div>}
