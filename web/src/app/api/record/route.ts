// POST /api/record — commit a decision to the Monad ClaimRegistry (server-signed
// with the agent wallet). Returns a BlockchainProof (real tx hash + explorer URL,
// or a clearly-flagged simulated proof when no signer is configured).

import { NextResponse } from "next/server";
import { recordOnChain } from "@/lib/blockchain";
import type { AIDecision, ClaimInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      claimId?: string;
      input?: ClaimInput;
      decision?: AIDecision;
    };

    if (!body.claimId || !body.input || !body.decision) {
      return NextResponse.json({ error: "Missing claimId, input, or decision." }, { status: 400 });
    }

    const proof = await recordOnChain(body.claimId, body.input, body.decision);
    return NextResponse.json({ proof });
  } catch (err) {
    console.error("[/api/record]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record on-chain." },
      { status: 500 },
    );
  }
}
