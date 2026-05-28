export type AIProvenanceInfo = {
  modelId: string;
  promptHash: string;
  responseHash: string;
  cached: boolean;
  generatedAt: string;
};

export function AIProvenance({ provenance }: { provenance?: Partial<AIProvenanceInfo> | null }) {
  if (!provenance) return null;
  const rows = [
    ["Model", provenance.modelId ?? "elfa-default"],
    ["Prompt", provenance.promptHash ?? "—"],
    ["Response", provenance.responseHash ?? "—"],
    ["Cached", provenance.cached ? "Yes" : "No"],
    ["Timestamp", provenance.generatedAt ? new Date(provenance.generatedAt).toISOString() : "—"],
  ];
  return <details className="mt-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-secondary)]">
    <summary className="cursor-pointer font-semibold uppercase tracking-wide text-[var(--text-secondary)]">AI provenance</summary>
    <div className="mt-3 grid gap-2">
      {rows.map(([label, value]) => <div key={label} className="grid gap-1 sm:grid-cols-[96px_1fr]"><span>{label}</span><code className="break-all font-mono text-[var(--ink)]">{value}</code></div>)}
    </div>
  </details>;
}
