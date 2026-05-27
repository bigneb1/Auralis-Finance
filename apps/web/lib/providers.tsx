"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { PropsWithChildren, useState } from "react";
import { WagmiProvider } from "wagmi";
import { Toaster } from "sonner";
import { CommandPalette } from "../components/CommandPalette";
import { CopilotWidget } from "../components/CopilotWidget";
import { wagmiConfig } from "./wagmi";

const rainbowTheme = darkTheme({
  accentColor: "#0E9E8C",
  accentColorForeground: "#FBFBF9",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact" appInfo={{ appName: "Auralis Finance" }}>
          {children}
          <CommandPalette />
          <CopilotWidget />
          <Toaster richColors />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
