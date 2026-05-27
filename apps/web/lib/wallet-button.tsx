"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@auralis/ui";

export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted, authenticationStatus }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && { "aria-hidden": true, style: { opacity: 0, pointerEvents: "none", userSelect: "none" } })}
            className="flex items-center gap-2"
          >
            {(() => {
              if (!connected) return <Button onClick={openConnectModal}>Connect wallet</Button>;
              if (chain.unsupported) return <Button variant="secondary" onClick={openChainModal}>Wrong network</Button>;
              return (
                <>
                  <Button variant="secondary" onClick={openChainModal}>
                    {chain.hasIcon && chain.iconUrl && (
                      <img alt={chain.name ?? "Chain"} src={chain.iconUrl} className="mr-1.5 h-4 w-4 rounded-full" />
                    )}
                    {chain.name}
                  </Button>
                  <Button variant="secondary" onClick={openAccountModal}>
                    {account.displayName}
                    {account.displayBalance ? ` · ${account.displayBalance}` : ""}
                  </Button>
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
