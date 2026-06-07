// Shared types for We-WhoCares.

export type ClaimType = "Pharmacy" | "Pre-Authorization" | "Hospital Claim";

/** Funding scheme the claim is filed under. */
export type Scheme = "Private" | "PM-JAY";

/** Binary outcome of the rule-based adjudication. */
export type DecisionOutcome = "APPROVE" | "REJECT";

/** Policy terms the rules are evaluated against. */
export interface PolicyData {
  coveredProcedures: string[];
  coverageLimit: number; // INR
  requiresPreAuthorization: boolean;
}

/** Hospital-side record of what actually happened. */
export interface HospitalRecord {
  procedurePerformed: string;
  preAuthorizationProvided: boolean;
}

/** Raw input captured from the claim submission form. */
export interface ClaimInput {
  abhaNumber: string;
  policyNumber: string;
  claimType: ClaimType;
  scheme: Scheme; // Private insurance or PM-JAY government scheme
  procedure: string; // claim.procedure
  claimedAmount: number; // claim.claimedAmount (INR)
  description: string; // free-text notes / doctor's summary
  fileNames: string[]; // uploaded document names (not OCR'd in MVP)
  policy: PolicyData;
  hospitalRecord: HospitalRecord;
}

/** One rule's verdict, in the exact evaluation order. */
export interface RuleResult {
  id: number;
  rule: string;
  status: "PASS" | "FAIL";
  detail: string; // plain-language explanation of the verdict
}

/** Structured output produced by the AI reasoning agent. */
export interface AIDecision {
  decision: DecisionOutcome; // APPROVE only if every rule passes
  ruleResults: RuleResult[]; // rule-by-rule PASS/FAIL, in order
  reasons: string[]; // plain-language bullet reasons
  explanation: string; // one short paragraph
  confidence: number; // 0..100
  source: "gemini" | "mock";
}

/** On-chain recording result. */
export interface BlockchainProof {
  txHash: string;
  reasonsHash: string;
  explorerUrl: string;
  blockNumber?: number;
  contractAddress: string;
  chainId: number;
  simulated: boolean;
  timestamp: number; // ms epoch
}

/** A fully recorded claim, persisted in localStorage for the demo. */
export interface ClaimRecord {
  id: string; // app-level claim id, e.g. "CLM-2026-XXXX"
  createdAt: number; // ms epoch
  input: ClaimInput;
  decision: AIDecision;
  proof: BlockchainProof | null;
}
