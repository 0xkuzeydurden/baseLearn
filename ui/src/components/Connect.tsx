import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMemo } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { appChains } from "@/lib/chains";

const primaryChain: (typeof appChains)[number] = appChains[0];

const isSupportedChain = (chainId?: number) =>
  chainId != null && appChains.some((chain) => chain.id === chainId);

export function ConnectPanel() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  const networkStatus = useMemo(() => {
    if (!isConnected || !chain) {
      return { tone: "muted", label: "Wallet not connected yet." } as const;
    }
    if (!isSupportedChain(chain.id)) {
      return {
        tone: "warning",
        label: `${chain.name} is not supported. Please switch to Base Sepolia.`
      } as const;
    }
    return { tone: "success", label: `Network: ${chain.name}` } as const;
  }, [chain, isConnected]);

  const onWrongNetwork = isConnected && chain && !isSupportedChain(chain.id);

  return (
    <div className="panel wallet-panel connect-kit">
      <div>
        <p className="panel-title">Wallet</p>
        <p className="panel-copy">
          Use RainbowKit + WalletConnect to run the entire Base Camp Learn flow straight from your
          browser—no scripts required.
        </p>
      </div>
      <ConnectButton
        label="Connect wallet"
        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
        chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
        showBalance={false}
      />

      {onWrongNetwork ? (
        <button
          type="button"
          className="btn secondary"
          onClick={() => switchChain({ chainId: primaryChain.id })}
          disabled={isPending}
        >
          {isPending ? "Switching…" : `Switch to ${primaryChain.name}`}
        </button>
      ) : null}

      <p className={`network-pill ${networkStatus.tone}`}>{networkStatus.label}</p>
    </div>
  );
}
