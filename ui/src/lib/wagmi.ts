import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { appChains } from "@/lib/chains";

const FALLBACK_PROJECT_ID = "00000000000000000000000000000000";
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || FALLBACK_PROJECT_ID;

if (import.meta.env.DEV && projectId === FALLBACK_PROJECT_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    "[walletconnect] VITE_WALLETCONNECT_PROJECT_ID is not set. WalletConnect may not function correctly in production."
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "Base Camp Launcher",
  projectId,
  chains: appChains,
  transports: {
    84532: http("https://sepolia.base.org")
  }
});
