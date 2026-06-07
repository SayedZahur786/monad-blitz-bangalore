import { Badge } from "@/components/ui";
import type { DecisionOutcome } from "@/lib/types";

const MAP: Record<DecisionOutcome, { tone: "green" | "red"; icon: string; label: string }> = {
  APPROVE: { tone: "green", icon: "✓", label: "Approved" },
  REJECT: { tone: "red", icon: "✕", label: "Rejected" },
};

export function DecisionBadge({ decision }: { decision: DecisionOutcome }) {
  const m = MAP[decision];
  return (
    <Badge tone={m.tone}>
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </Badge>
  );
}

export const DECISION_LABEL: Record<DecisionOutcome, string> = {
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
};

/** Larger, hero-style result banner colors. */
export const DECISION_HERO: Record<DecisionOutcome, string> = {
  APPROVE: "from-emerald-500 to-green-600",
  REJECT: "from-rose-500 to-red-600",
};
