import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mantle } from "./chain";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "auralis-demo-walletconnect-project-id";

export const wagmiConfig = getDefaultConfig({
  appName: "Auralis Finance",
  projectId,
  chains: [mantle],
  ssr: true,
});
