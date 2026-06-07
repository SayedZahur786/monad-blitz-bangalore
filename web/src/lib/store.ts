// Client-side persistence for claims (localStorage). Used for the dashboard
// list, history, and the decision page. The source of truth for the audit trail
// is the on-chain record; this is just convenient local demo state.

"use client";

import type { ClaimRecord } from "./types";

const KEY = "claimtrust:claims";

function read(): ClaimRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ClaimRecord[]) : [];
  } catch {
    return [];
  }
}

function write(claims: ClaimRecord[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(claims));
  window.dispatchEvent(new Event("claimtrust:updated"));
}

export function getClaims(): ClaimRecord[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getClaim(id: string): ClaimRecord | undefined {
  return read().find((c) => c.id === id);
}

export function saveClaim(claim: ClaimRecord): void {
  const claims = read().filter((c) => c.id !== claim.id);
  claims.push(claim);
  write(claims);
}

export function clearClaims(): void {
  write([]);
}
