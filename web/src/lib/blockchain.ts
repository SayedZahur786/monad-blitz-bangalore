// Server-side recording of claim decisions onto the Monad ClaimRegistry.
//
// Per the spec, the BACKEND logs the decision to the contract (the user only
// does "Continue as Demo" — no in-browser wallet). We sign with the agent
// wallet key provided via MONAD_PRIVATE_KEY. If no key/contract is configured,
// we return a clearly-flagged simulated proof so the demo still completes.

import "server-only";
import { createWalletClient, createPublicClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet, RPC_URL, txUrl, MONAD_TESTNET_ID } from "./chain";
import { CLAIM_REGISTRY_ADDRESS, CLAIM_REGISTRY_ABI, DECISION_ENUM } from "./contract";
import { reasonsHashOf, claimIdToBytes32 } from "./hash";
import type { AIDecision, BlockchainProof, ClaimInput } from "./types";

function maskAbha(abha: string): string {
  const digits = abha.replace(/\D/g, "");
  if (digits.length < 4) return "ABHA-****";
  return `ABHA-****${digits.slice(-4)}`;
}

/** Short, human-readable on-chain metadata string. */
function buildMetadata(claimId: string, input: ClaimInput, decision: AIDecision): string {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(input.claimedAmount);
  return `${claimId} | ${input.procedure} | ${amount} | ${maskAbha(input.abhaNumber)} | ${decision.decision}`;
}

function getPrivateKey(): Hex | null {
  const raw = process.env.MONAD_PRIVATE_KEY?.trim();
  if (!raw) return null;
  return (raw.startsWith("0x") ? raw : `0x${raw}`) as Hex;
}

function isConfigured(): boolean {
  return (
    getPrivateKey() !== null &&
    CLAIM_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000"
  );
}

/**
 * Record a decision on-chain. Returns a BlockchainProof.
 * Falls back to a simulated proof (simulated:true) when not configured.
 */
export async function recordOnChain(
  claimId: string,
  input: ClaimInput,
  decision: AIDecision,
): Promise<BlockchainProof> {
  const reasonsHash = reasonsHashOf(claimId, decision);
  const idBytes = claimIdToBytes32(claimId);
  const metadata = buildMetadata(claimId, input, decision);

  if (!isConfigured()) {
    // Deterministic, clearly-flagged simulated hash so the UI flow is complete.
    return {
      txHash: reasonsHash, // reuse the commitment as a stand-in hash
      reasonsHash,
      explorerUrl: txUrl(reasonsHash),
      contractAddress: CLAIM_REGISTRY_ADDRESS,
      chainId: MONAD_TESTNET_ID,
      simulated: true,
      timestamp: Date.now(),
    };
  }

  const account = privateKeyToAccount(getPrivateKey()!);
  const transport = http(RPC_URL);
  const walletClient = createWalletClient({ account, chain: monadTestnet, transport });
  const publicClient = createPublicClient({ chain: monadTestnet, transport });

  const txHash = await walletClient.writeContract({
    address: CLAIM_REGISTRY_ADDRESS,
    abi: CLAIM_REGISTRY_ABI,
    functionName: "logDecision",
    args: [idBytes, DECISION_ENUM[decision.decision], decision.confidence, reasonsHash, metadata],
  });

  // Wait for inclusion so the explorer link is live and we can capture the block.
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    txHash,
    reasonsHash,
    explorerUrl: txUrl(txHash),
    blockNumber: Number(receipt.blockNumber),
    contractAddress: CLAIM_REGISTRY_ADDRESS,
    chainId: MONAD_TESTNET_ID,
    simulated: false,
    timestamp: Date.now(),
  };
}
