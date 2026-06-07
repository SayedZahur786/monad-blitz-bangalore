// Small shared helpers.

export type ClassValue = string | false | null | undefined;

/** Lightweight className combiner (no extra deps). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function shortHash(hash: string, lead = 10, tail = 8): string {
  if (!hash) return "";
  if (hash.length <= lead + tail) return hash;
  return `${hash.slice(0, lead)}…${hash.slice(-tail)}`;
}

/** Generate a human-friendly claim id like CLM-2026-4821. */
export function generateClaimId(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(1000 + Math.random() * 9000);
  return `CLM-${year}-${n}`;
}
