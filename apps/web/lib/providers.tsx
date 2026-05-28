"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { PropsWithChildren, useState } from "react";
import { WagmiProvider } from "wagmi";
import { Toaster } from "sonner";
import { CommandPalette } from "../components/CommandPalette";
import { CopilotWidget } from "../components/CopilotWidget";
import { wagmiConfig } from "./wagmi";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const rainbowTheme = darkTheme({
  accentColor: "#0E9E8C",
  accentColorForeground: "#FBFBF9",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const app = (
    <RainbowKitProvider theme={rainbowTheme} modalSize="compact" appInfo={{ appName: "Auralis Finance" }}>
      {children}
      <CommandPalette />
      <CopilotWidget />
      <Toaster richColors />
    </RainbowKitProvider>
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {privyAppId ? <PrivyProvider appId={privyAppId} config={{ loginMethods: ["email"], embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } } }}>{app}</PrivyProvider> : app}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
