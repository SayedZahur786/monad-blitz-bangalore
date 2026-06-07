// Deterministic 4-rule adjudication for ClaimTrust India.
//
// The rules are applied EXACTLY in the order below. If any rule FAILS the
// decision is REJECT; only if all PASS is it APPROVE. This mirrors the prompt
// given to Gemini (see ai.ts) so the LLM and the fallback engine agree.

import type { AIDecision, ClaimInput, PolicyData, RuleResult } from "./types";

/** A sensible default policy pre-filled into the form for the demo. */
export const DEFAULT_POLICY: PolicyData = {
  coveredProcedures: [
    "Cataract Surgery",
    "Knee Replacement",
    "Angioplasty",
    "Appendectomy",
    "Chemotherapy",
    "Dialysis",
  ],
  coverageLimit: 500_000,
  requiresPreAuthorization: true,
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Build the CLAIM_JSON object injected into the prompt and evaluated by the rules.
 * Shape matches the rule references: claim.*, policy.*, hospitalRecord.*
 */
export function buildClaimJson(input: ClaimInput) {
  return {
    claim: {
      claimId: undefined as string | undefined, // filled by caller if needed
      procedure: input.procedure,
      claimedAmount: input.claimedAmount,
      claimType: input.claimType,
    },
    policy: {
      coveredProcedures: input.policy.coveredProcedures,
      coverageLimit: input.policy.coverageLimit,
      requiresPreAuthorization: input.policy.requiresPreAuthorization,
    },
    hospitalRecord: {
      procedurePerformed: input.hospitalRecord.procedurePerformed,
      preAuthorizationProvided: input.hospitalRecord.preAuthorizationProvided,
    },
  };
}

/**
 * Apply the four rules in order and return the structured decision.
 * (Deterministic — used directly as the no-API fallback, and to validate the
 * LLM's output shape.)
 */
export function runRuleEngine(input: ClaimInput): Omit<AIDecision, "source"> {
  const { policy, hospitalRecord } = input;
  const ruleResults: RuleResult[] = [];

  // Rule 1 — Procedure Coverage Check
  const covered = policy.coveredProcedures.some((p) => norm(p) === norm(input.procedure));
  ruleResults.push({
    id: 1,
    rule: "Procedure Coverage Check",
    status: covered ? "PASS" : "FAIL",
    detail: covered
      ? `"${input.procedure}" is listed in the policy's covered procedures.`
      : `"${input.procedure}" is not in the policy's covered procedures.`,
  });

  // Rule 2 — Coverage Limit Check
  const withinLimit = input.claimedAmount <= policy.coverageLimit;
  ruleResults.push({
    id: 2,
    rule: "Coverage Limit Check",
    status: withinLimit ? "PASS" : "FAIL",
    detail: withinLimit
      ? `Claimed ${inr(input.claimedAmount)} is within the coverage limit of ${inr(policy.coverageLimit)}.`
      : `Claimed ${inr(input.claimedAmount)} exceeds the coverage limit of ${inr(policy.coverageLimit)}.`,
  });

  // Rule 3 — Pre Authorization Check
  const preAuthOk = !policy.requiresPreAuthorization || hospitalRecord.preAuthorizationProvided;
  ruleResults.push({
    id: 3,
    rule: "Pre Authorization Check",
    status: preAuthOk ? "PASS" : "FAIL",
    detail: !policy.requiresPreAuthorization
      ? "Policy does not require pre-authorisation."
      : hospitalRecord.preAuthorizationProvided
        ? "Pre-authorisation was required and has been provided."
        : "Pre-authorisation is required by the policy but was not provided.",
  });

  // Rule 4 — Procedure Match Check
  const matches = norm(input.procedure) === norm(hospitalRecord.procedurePerformed);
  ruleResults.push({
    id: 4,
    rule: "Procedure Match Check",
    status: matches ? "PASS" : "FAIL",
    detail: matches
      ? `Claimed procedure matches the procedure performed ("${hospitalRecord.procedurePerformed}").`
      : `Claimed procedure "${input.procedure}" does not match the procedure performed "${hospitalRecord.procedurePerformed}".`,
  });

  const failed = ruleResults.filter((r) => r.status === "FAIL");
  const decision = failed.length === 0 ? "APPROVE" : "REJECT";

  const reasons =
    decision === "APPROVE"
      ? ruleResults.map((r) => `${r.rule}: PASS — ${r.detail}`)
      : failed.map((r) => `${r.rule}: FAIL — ${r.detail}`);

  const explanation =
    decision === "APPROVE"
      ? `The claim is APPROVED. All four policy rules passed for ${inr(input.claimedAmount)}.`
      : `The claim is REJECTED because ${failed.length} rule${failed.length > 1 ? "s" : ""} failed: ${failed
          .map((r) => r.rule)
          .join(", ")}.`;

  return {
    decision,
    ruleResults,
    reasons,
    explanation,
    confidence: 100, // deterministic rule evaluation
  };
}
