// POST /api/analyze — run the AI reasoning agent over a claim.
// Returns a structured AIDecision (decision + plain-language reasons + confidence).

import { NextResponse } from "next/server";
import { analyzeClaim } from "@/lib/ai";
import type { ClaimInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ClaimInput>;

    if (!body || !body.procedure) {
      return NextResponse.json({ error: "Missing claim procedure." }, { status: 400 });
    }

    const input: ClaimInput = {
      abhaNumber: String(body.abhaNumber ?? ""),
      policyNumber: String(body.policyNumber ?? ""),
      claimType: (body.claimType as ClaimInput["claimType"]) ?? "Hospital Claim",
      procedure: String(body.procedure ?? ""),
      claimedAmount: Number(body.claimedAmount ?? 0),
      description: String(body.description ?? ""),
      fileNames: Array.isArray(body.fileNames) ? body.fileNames.map(String) : [],
      policy: {
        coveredProcedures: Array.isArray(body.policy?.coveredProcedures)
          ? body.policy!.coveredProcedures.map(String)
          : [],
        coverageLimit: Number(body.policy?.coverageLimit ?? 0),
        requiresPreAuthorization: Boolean(body.policy?.requiresPreAuthorization),
      },
      hospitalRecord: {
        procedurePerformed: String(body.hospitalRecord?.procedurePerformed ?? ""),
        preAuthorizationProvided: Boolean(body.hospitalRecord?.preAuthorizationProvided),
      },
    };

    const decision = await analyzeClaim(input);
    return NextResponse.json({ decision });
  } catch (err) {
    console.error("[/api/analyze]", err);
    return NextResponse.json({ error: "Failed to analyse claim." }, { status: 500 });
  }
}
