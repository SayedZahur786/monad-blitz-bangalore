// Pre-filled sample claims for instant demo testing. Each exercises a different
// rule outcome (one APPROVE, plus a REJECT for each failing rule).

import { DEFAULT_POLICY } from "./policy";
import type { ClaimInput } from "./types";

export interface SampleClaim {
  label: string;
  hint: string;
  input: ClaimInput;
}

const base = {
  abhaNumber: "12-3456-7890-1234",
  policyNumber: "CT-IND-2026-0091",
  claimType: "Hospital Claim" as const,
  fileNames: ["discharge_summary.pdf", "final_bill.pdf"],
  policy: DEFAULT_POLICY,
};

export const SAMPLE_CLAIMS: SampleClaim[] = [
  {
    label: "All rules pass",
    hint: "APPROVE",
    input: {
      ...base,
      procedure: "Cataract Surgery",
      claimedAmount: 45000,
      description: "Day-care cataract surgery, left eye. Pre-authorisation obtained prior to admission.",
      hospitalRecord: { procedurePerformed: "Cataract Surgery", preAuthorizationProvided: true },
    },
  },
  {
    label: "Procedure not covered",
    hint: "REJECT · Rule 1",
    input: {
      ...base,
      procedure: "Rhinoplasty",
      claimedAmount: 90000,
      description: "Cosmetic nose-reshaping procedure performed at a private clinic.",
      hospitalRecord: { procedurePerformed: "Rhinoplasty", preAuthorizationProvided: true },
    },
  },
  {
    label: "Exceeds coverage limit",
    hint: "REJECT · Rule 2",
    input: {
      ...base,
      procedure: "Knee Replacement",
      claimedAmount: 620000,
      description: "Total knee replacement, 4-day admission. Amount above the policy coverage limit.",
      hospitalRecord: { procedurePerformed: "Knee Replacement", preAuthorizationProvided: true },
    },
  },
  {
    label: "No pre-authorisation",
    hint: "REJECT · Rule 3",
    input: {
      ...base,
      procedure: "Angioplasty",
      claimedAmount: 180000,
      description: "Coronary angioplasty performed without obtaining prior pre-authorisation.",
      hospitalRecord: { procedurePerformed: "Angioplasty", preAuthorizationProvided: false },
    },
  },
  {
    label: "Procedure mismatch",
    hint: "REJECT · Rule 4",
    input: {
      ...base,
      procedure: "Appendectomy",
      claimedAmount: 75000,
      description: "Claim filed for appendectomy, but the hospital record shows a different procedure.",
      hospitalRecord: { procedurePerformed: "Cholecystectomy", preAuthorizationProvided: true },
    },
  },
];
