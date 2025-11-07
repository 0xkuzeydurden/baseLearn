const explorerByChain: Record<number, string | undefined> = {
  8453: "https://basescan.org",
  84532: "https://sepolia.basescan.org",
  31337: undefined
};

export function getExplorerBaseUrl(chainId?: number) {
  if (!chainId) return undefined;
  return explorerByChain[chainId];
}

export function getExplorerTxUrl(chainId: number | undefined, hash?: string) {
  const base = getExplorerBaseUrl(chainId);
  if (!base || !hash) return undefined;
  return `${base}/tx/${hash}`;
}

export function getExplorerAddressUrl(chainId: number | undefined, address?: string) {
  const base = getExplorerBaseUrl(chainId);
  if (!base || !address) return undefined;
  return `${base}/address/${address}`;
}

export function formatAddress(address?: string, size = 4) {
  if (!address) return "";
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}
