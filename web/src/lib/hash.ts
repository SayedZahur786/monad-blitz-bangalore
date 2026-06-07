// Canonical decision payload + commitment hashing.
//
// The on-chain `reasonsHash` is keccak256 of a CANONICAL string built from the
// decision. Anyone can reproduce this from the published decision and compare it
// to the on-chain value to prove the record was not altered. Keep this function
// stable — changing it changes every hash.

import { keccak256, toBytes, stringToHex } from "viem";
import type { AIDecision } from "./types";

/** Deterministic, human-inspectable representation of a decision. */
export function canonicalDecisionPayload(claimId: string, decision: AIDecision): string {
  return [
    `claimId=${claimId}`,
    `decision=${decision.decision}`,
    `confidence=${decision.confidence}`,
    `rules=${decision.ruleResults.map((r) => `${r.id}:${r.rule}=${r.status}`).join(" | ")}`,
    `reasons=${decision.reasons.join(" || ")}`,
    `explanation=${decision.explanation}`,
  ].join("\n");
}

/** keccak256 commitment of the canonical payload. */
export function reasonsHashOf(claimId: string, decision: AIDecision): `0x${string}` {
  return keccak256(toBytes(canonicalDecisionPayload(claimId, decision)));
}

/** Convert the app-level claim id string into a bytes32 for the contract. */
export function claimIdToBytes32(claimId: string): `0x${string}` {
  return keccak256(stringToHex(claimId));
}
