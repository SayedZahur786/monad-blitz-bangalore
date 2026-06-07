// ClaimRegistry contract config. The address is filled in after deployment
// (see contracts/deployment.json / .env.local NEXT_PUBLIC_CLAIM_REGISTRY_ADDRESS).

import type { DecisionOutcome } from "./types";

export const CLAIM_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_CLAIM_REGISTRY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

/**
 * Solidity enum Decision: Unset=0, Approved=1, Rejected=2, Partial=3.
 * The app's binary outcome maps APPROVE->Approved(1), REJECT->Rejected(2).
 */
export const DECISION_ENUM: Record<DecisionOutcome, number> = {
  APPROVE: 1,
  REJECT: 2,
};

export const DECISION_FROM_ENUM: Record<number, DecisionOutcome> = {
  1: "APPROVE",
  2: "REJECT",
};

export const CLAIM_REGISTRY_ABI = [
  {
    type: "function",
    name: "logDecision",
    stateMutability: "nonpayable",
    inputs: [
      { name: "claimId", type: "bytes32" },
      { name: "decision", type: "uint8" },
      { name: "confidence", type: "uint16" },
      { name: "reasonsHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "index", type: "uint256" }],
  },
  {
    type: "function",
    name: "getRecord",
    stateMutability: "view",
    inputs: [{ name: "claimId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "claimId", type: "bytes32" },
          { name: "submitter", type: "address" },
          { name: "decision", type: "uint8" },
          { name: "confidence", type: "uint16" },
          { name: "reasonsHash", type: "bytes32" },
          { name: "timestamp", type: "uint64" },
          { name: "metadataURI", type: "string" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "exists",
    stateMutability: "view",
    inputs: [{ name: "claimId", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "verifyReasons",
    stateMutability: "view",
    inputs: [
      { name: "claimId", type: "bytes32" },
      { name: "reasonsHash", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "totalClaims",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "ClaimDecisionLogged",
    inputs: [
      { name: "claimId", type: "bytes32", indexed: true },
      { name: "submitter", type: "address", indexed: true },
      { name: "decision", type: "uint8", indexed: false },
      { name: "confidence", type: "uint16", indexed: false },
      { name: "reasonsHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint64", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
] as const;
