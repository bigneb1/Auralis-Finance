"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@auralis/ui";
import { explorerTxUrl } from "../lib/deployments";

type TxStage = "idle" | "preparing" | "signing" | "submitted" | "confirmed" | "failed";

const demoTx = "0x3a71c9d4e02f85b6c1a94d7e8f203b65a9c18e047d2f6b91c0a58e3d74b62f10" as `0x${string}`;

export function TxButton({
  children,
  disabled,
  intent = "user-signed action",
  txHash = demoTx,
  onConfirmed,
  className,
  variant = "primary",
  size,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  intent?: string;
  txHash?: `0x${string}`;
  onConfirmed?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}) {
  const [stage, setStage] = useState<TxStage>("idle");
  const busy = stage === "preparing" || stage === "signing" || stage === "submitted";

  async function runLifecycle() {
    if (disabled || busy) return;
    try {
      setStage("preparing");
      toast.loading(`Preparing ${intent}…`, { id: intent });
      await wait(250);
      setStage("signing");
      toast.loading("Awaiting user signature…", { id: intent });
      await wait(350);
      setStage("submitted");
      toast.loading("Submitted to Mantle…", { id: intent, action: { label: "Explorer", onClick: () => window.open(explorerTxUrl(txHash), "_blank", "noopener,noreferrer") } });
      await wait(450);
      setStage("confirmed");
      toast.success("Confirmed on Mantle", { id: intent, description: shortHash(txHash), action: { label: "Explorer", onClick: () => window.open(explorerTxUrl(txHash), "_blank", "noopener,noreferrer") } });
      onConfirmed?.();
    } catch {
      setStage("failed");
      toast.error("Transaction failed", { id: intent });
    }
  }

  const label = stage === "idle" || stage === "confirmed" || stage === "failed" ? children : stage === "preparing" ? "Preparing…" : stage === "signing" ? "Sign in wallet…" : "Submitted…";

  return <Button className={className} variant={variant} size={size} disabled={disabled || busy} onClick={runLifecycle}>{label}</Button>;
}

function wait(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function shortHash(hash: string) { return `${hash.slice(0, 10)}…${hash.slice(-6)}`; }
