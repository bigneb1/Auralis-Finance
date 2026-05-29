"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button, ConfidenceMeter } from "@auralis/ui";
import { AIProvenance, type AIProvenanceInfo } from "./AIProvenance";

const quickActions = ["Explain this screen", "Check compliance next", "Why might this be blocked?"];

type Reply = { summary: string; actions: string[]; outcome: string; reasoningFactors: string[]; caveats: string[]; aiProvenance?: AIProvenanceInfo };

export function CopilotWidget() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("Explain this screen");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [streamText, setStreamText] = useState("");
  const selectedAsset = useMemo(() => pathname.match(/opportunities\/([^/]+)/)?.[1]?.toUpperCase() ?? null, [pathname]);

  async function ask(nextQuestion = question) {
    setQuestion(nextQuestion);
    setOpen(true);
    setLoading(true);
    setStreamText("");
    setReply(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ question: nextQuestion, stream: true, context: { route: pathname, selectedAsset } }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      if (!reader) throw new Error("No stream");
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        for (const event of buffer.split("\n\n")) {
          if (!event.startsWith("data:")) continue;
          const raw = event.replace(/^data:\s*/, "");
          if (raw === "[DONE]") continue;
          const chunk = JSON.parse(raw) as { type: string; text?: string; reply?: Reply };
          if (chunk.type === "chunk") setStreamText((text) => `${text}${chunk.text ?? ""}`);
          if (chunk.type === "final" && chunk.reply) setReply(chunk.reply);
        }
        buffer = buffer.includes("\n\n") ? buffer.slice(buffer.lastIndexOf("\n\n") + 2) : buffer;
      }
    } catch {
      setReply({ summary: "The copilot fallback is available, but the stream could not be opened.", actions: ["Retry the prompt"], outcome: "No transaction required.", reasoningFactors: [pathname], caveats: ["Advisory only"] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 print:hidden">
      {open && <motion.section role="dialog" aria-label="Auralis Copilot" initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : 0.2 }} className="w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl">Auralis Copilot</h2><p className="text-xs text-[var(--text-secondary)]">Context: {pathname}{selectedAsset ? ` · ${selectedAsset}` : ""}</p></div><button aria-label="Close copilot" className="rounded-md px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]" onClick={() => setOpen(false)}>×</button></div>
        <div className="mt-3 flex flex-wrap gap-2">{quickActions.map((action) => <button key={action} onClick={() => ask(action)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs hover:bg-[var(--teal-wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]">{action}</button>)}</div>
        <label className="mt-3 grid gap-1 text-sm"><span className="sr-only">Ask Copilot</span><textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="min-h-20 rounded-xl border border-[var(--border)] bg-white p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--teal)]" /></label>
        <Button className="mt-3 w-full" onClick={() => ask()} disabled={loading}>{loading ? "Streaming…" : "Ask with current context"}</Button>
        <div className="mt-4 rounded-xl bg-[var(--surface-muted)] p-3 text-sm" aria-live="polite">
          {loading && !reply ? <p>{streamText || "Starting structured stream…"}</p> : reply ? <StructuredReply reply={reply} /> : <p className="text-[var(--text-secondary)]">Ask for a structured answer: summary, actions, outcome, reasoning, caveats.</p>}
        </div>
        <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--text-secondary)]">Advisory only. Auralis does not give legal or financial advice and never signs transactions for you.</p>
      </motion.section>}
      <button aria-label="Open Auralis Copilot" onClick={() => setOpen((v) => !v)} className="rounded-full bg-[var(--ink-slab)] px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal)]">Copilot</button>
    </div>
  );
}

function StructuredReply({ reply }: { reply: Reply }) {
  return <div className="space-y-3"><ConfidenceMeter value={86} /><Block title="Summary" lines={[reply.summary]} /><Block title="Actions" lines={reply.actions} /><Block title="Outcome" lines={[reply.outcome]} /><Block title="Reasoning" lines={reply.reasoningFactors} /><Block title="Caveats" lines={reply.caveats} /><AIProvenance provenance={reply.aiProvenance}/></div>;
}
function Block({ title, lines }: { title: string; lines: string[] }) { return <section><h3 className="font-medium">{title}</h3><ul className="mt-1 list-disc pl-5 text-[var(--text-secondary)]">{lines.length ? lines.map((line) => <li key={line}>{line}</li>) : <li>No action required.</li>}</ul></section>; }
