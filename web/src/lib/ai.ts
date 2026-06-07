// AI reasoning agent. Uses Google Gemini when GEMINI_API_KEY is set; otherwise
// falls back to the deterministic rule engine. Both follow the SAME ordered
// 4-rule process so results are consistent.

import "server-only";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { buildClaimJson, runRuleEngine } from "./policy";
import type { AIDecision, ClaimInput, RuleResult } from "./types";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

/** The exact adjudication prompt template, with {{CLAIM_JSON}} injected. */
function buildPrompt(input: ClaimInput): string {
  const claimJson = JSON.stringify(buildClaimJson(input), null, 2);
  return `Evaluate the following insurance claim.

Apply the rules exactly in the order listed.

Rules:

1. Procedure Coverage Check
   PASS if claim.procedure exists in policy.coveredProcedures.

2. Coverage Limit Check
   PASS if claim.claimedAmount <= policy.coverageLimit.

3. Pre Authorization Check
   If policy.requiresPreAuthorization is true,
   then hospitalRecord.preAuthorizationProvided must be true.

4. Procedure Match Check
   PASS if claim.procedure equals hospitalRecord.procedurePerformed.

Final Decision Rule:

- If any rule FAILS, decision = REJECT.
- If all rules PASS, decision = APPROVE.

Claim Data:

${claimJson}

Return only valid JSON following the required schema:
{
  "decision": "APPROVE" | "REJECT",
  "ruleResults": [
    { "id": 1, "rule": "Procedure Coverage Check", "status": "PASS" | "FAIL", "detail": "<plain-language reason>" },
    { "id": 2, "rule": "Coverage Limit Check", "status": "PASS" | "FAIL", "detail": "<plain-language reason>" },
    { "id": 3, "rule": "Pre Authorization Check", "status": "PASS" | "FAIL", "detail": "<plain-language reason>" },
    { "id": 4, "rule": "Procedure Match Check", "status": "PASS" | "FAIL", "detail": "<plain-language reason>" }
  ],
  "reasons": ["<plain-language bullet>", "..."],
  "explanation": "<one short paragraph for the policyholder>",
  "confidence": <integer 0-100>
}
Evaluate the rules deterministically and explain each verdict in plain language.`;
}

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    decision: { type: SchemaType.STRING, enum: ["APPROVE", "REJECT"] },
    ruleResults: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.NUMBER },
          rule: { type: SchemaType.STRING },
          status: { type: SchemaType.STRING, enum: ["PASS", "FAIL"] },
          detail: { type: SchemaType.STRING },
        },
        required: ["id", "rule", "status", "detail"],
      },
    },
    reasons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    explanation: { type: SchemaType.STRING },
    confidence: { type: SchemaType.NUMBER },
  },
  required: ["decision", "ruleResults", "explanation", "confidence"],
} as const;

function clampConfidence(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 90;
  return Math.max(0, Math.min(100, Math.round(v)));
}

export async function analyzeClaim(input: ClaimInput): Promise<AIDecision> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return { ...runRuleEngine(input), source: "mock" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: RESPONSE_SCHEMA as any,
        temperature: 0,
      },
    });

    const result = await model.generateContent(buildPrompt(input));
    const parsed = JSON.parse(result.response.text());

    const decision = parsed.decision === "APPROVE" || parsed.decision === "REJECT" ? parsed.decision : "REJECT";
    const ruleResults: RuleResult[] = Array.isArray(parsed.ruleResults)
      ? parsed.ruleResults.map((r: Record<string, unknown>, i: number) => ({
          id: typeof r.id === "number" ? r.id : i + 1,
          rule: String(r.rule ?? `Rule ${i + 1}`),
          status: r.status === "PASS" ? "PASS" : "FAIL",
          detail: String(r.detail ?? ""),
        }))
      : runRuleEngine(input).ruleResults;

    return {
      decision,
      ruleResults,
      reasons: Array.isArray(parsed.reasons) && parsed.reasons.length
        ? parsed.reasons.map(String)
        : ruleResults.filter((r) => r.status === "FAIL").map((r) => `${r.rule}: ${r.detail}`),
      explanation: String(parsed.explanation ?? ""),
      confidence: clampConfidence(parsed.confidence),
      source: "gemini",
    };
  } catch (err) {
    console.error("[ai] Gemini failed, using rule-engine fallback:", err);
    return { ...runRuleEngine(input), source: "mock" };
  }
}
