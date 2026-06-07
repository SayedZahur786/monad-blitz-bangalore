// Monad testnet chain definition + explorer helpers.

import { defineChain } from "viem";

export const MONAD_TESTNET_ID = 10143;

export const RPC_URL = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";

/** Base explorer URL for the demo (MonadVision testnet explorer). */
export const EXPLORER_BASE = process.env.NEXT_PUBLIC_MONAD_EXPLORER ?? "https://testnet.monadexplorer.com";

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "MonadExplorer", url: EXPLORER_BASE },
  },
  testnet: true,
});

export const txUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;
export const addressUrl = (addr: string) => `${EXPLORER_BASE}/address/${addr}`;
