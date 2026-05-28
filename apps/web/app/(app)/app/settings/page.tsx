"use client";

import { useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, StateWrapper, Switch } from "@auralis/ui";

const demoWallet = "0x000000000000000000000000000000000000aAaA";
const jurisdictions = ["NG", "EU", "US", "GB", "SG", "AE"];
const riskProfiles = ["Capital preservation", "Balanced treasury", "Yield-seeking"];

export default function SettingsPage() {
  const [jurisdiction, setJurisdiction] = useState("NG");
  const [pendingJurisdiction, setPendingJurisdiction] = useState("NG");
  const [riskProfile, setRiskProfile] = useState(riskProfiles[1]);
  const [mode, setMode] = useState("Advisory only");
  const [appearance, setAppearance] = useState("System");
  const [notifications, setNotifications] = useState({ rating: true, compliance: true, policy: false });
  const [scanStatus, setScanStatus] = useState<"populated" | "loading" | "error" | "stale">("populated");
  const [scanMessage, setScanMessage] = useState("No jurisdiction change pending.");

  const needsRescan = pendingJurisdiction !== jurisdiction;
  const profileSummary = useMemo(() => `${riskProfile} · ${mode} · ${appearance} appearance`, [riskProfile, mode, appearance]);

  async function applyJurisdiction() {
    setScanStatus("loading");
    setScanMessage(`Re-scanning ${demoWallet} for ${pendingJurisdiction} jurisdiction…`);
    try {
      const res = await fetch("/api/compliance/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: demoWallet, jurisdiction: pendingJurisdiction }),
      });
      if (!res.ok) throw new Error(`Compliance scan failed: ${res.status}`);
      const report = await res.json() as { results?: { verdict: "ELIGIBLE" | "RESTRICTED" | "DENIED" }[]; reportHash?: string };
      const results = report.results ?? [];
      const eligible = results.filter((item) => item.verdict === "ELIGIBLE").length;
      const restricted = results.filter((item) => item.verdict === "RESTRICTED").length;
      const denied = results.filter((item) => item.verdict === "DENIED").length;
      setJurisdiction(pendingJurisdiction);
      setScanStatus("populated");
      setScanMessage(`Re-scan complete. ${eligible} eligible, ${restricted} restricted, ${denied} denied. Hash ${report.reportHash?.slice(0, 10)}…`);
    } catch (error) {
      setScanStatus("error");
      setScanMessage(error instanceof Error ? error.message : "Compliance re-scan failed.");
    }
  }

  return <div className="space-y-6">
    <section>
      <p className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-[var(--teal)]">Configuration</p>
      <h1 className="mt-3 font-display text-4xl text-[var(--ink)]">Settings</h1>
      <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">Control the profile inputs that affect Auralis explanations, compliance checks, and policy recommendations. Jurisdiction changes explicitly trigger a compliance re-scan.</p>
    </section>

    <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
      <div className="space-y-5">
        <Card><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" defaultValue="Francis Treasury" />
          <Field label="Primary wallet" defaultValue={demoWallet} />
          <div className="sm:col-span-2 rounded-xl bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-secondary)]">Current profile: {profileSummary}</div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Jurisdiction declaration</CardTitle></CardHeader><CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">This feeds the compliance engine. Changing it prompts Auralis to re-scan asset eligibility before showing fresh verdicts.</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <select value={pendingJurisdiction} onChange={(event) => { setPendingJurisdiction(event.target.value); setScanStatus("stale"); setScanMessage("Jurisdiction changed. Re-scan required before verdicts should be trusted."); }} className="h-10 rounded-[10px] border border-[var(--border)] bg-white px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]">
              {jurisdictions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button onClick={applyJurisdiction} disabled={!needsRescan || scanStatus === "loading"}>{scanStatus === "loading" ? "Scanning…" : "Apply + re-scan"}</Button>
          </div>
          <StateWrapper status={scanStatus}><p className="rounded-xl border border-[var(--border)] p-3 text-sm text-[var(--text-secondary)]">{scanMessage}</p></StateWrapper>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Risk profile</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3">{riskProfiles.map((profile) => <button key={profile} onClick={() => setRiskProfile(profile)} className={`rounded-xl border p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)] ${riskProfile === profile ? "border-[var(--teal)] bg-[var(--teal-wash)]" : "border-[var(--border)] hover:bg-[var(--surface-muted)]"}`}><span className="font-medium">{profile}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">Adjusts policy defaults and copilot explanations.</span></button>)}</div></CardContent></Card>

        <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="grid gap-3">{Object.entries(notifications).map(([key, value]) => <label key={key} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><span className="capitalize">{key} alerts</span><Switch checked={value} onChange={(event) => setNotifications((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}</CardContent></Card>
      </div>

      <div className="space-y-5">
        <Card><CardHeader><CardTitle>Mode</CardTitle></CardHeader><CardContent><select value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-white px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]"><option>Advisory only</option><option>Guarded execution preview</option><option>Read-only judge demo</option></select><p className="mt-2 text-sm text-[var(--text-secondary)]">Auralis never signs transactions. Execution remains user-signed.</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Appearance</CardTitle></CardHeader><CardContent><select value={appearance} onChange={(event) => setAppearance(event.target.value)} className="h-10 w-full rounded-[10px] border border-[var(--border)] bg-white px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]"><option>System</option><option>Light</option><option>High contrast</option></select></CardContent></Card>
        <Card className="border-[var(--rose)]/30"><CardHeader><CardTitle>Danger zone</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-[var(--text-secondary)]"><p>Clears local preferences only. It does not revoke attestations or touch on-chain records.</p><Button variant="secondary" onClick={() => { setPendingJurisdiction("NG"); setJurisdiction("NG"); setRiskProfile(riskProfiles[1]); setMode("Advisory only"); setAppearance("System"); setScanMessage("Local settings reset. No on-chain action performed."); }}>Reset local demo settings</Button></CardContent></Card>
      </div>
    </div>
  </div>;
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) { return <label className="grid gap-1 text-sm"><span className="text-[var(--text-secondary)]">{label}</span><input defaultValue={defaultValue} className="h-10 rounded-[10px] border border-[var(--border)] px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]" /></label>; }
