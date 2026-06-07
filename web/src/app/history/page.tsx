"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, CardBody } from "@/components/ui";
import { DecisionBadge } from "@/components/DecisionBadge";
import { useI18n } from "@/lib/i18n";
import { clearClaims, getClaims } from "@/lib/store";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { ClaimRecord } from "@/lib/types";

export default function HistoryPage() {
  const { t } = useI18n();
  const [claims, setClaims] = useState<ClaimRecord[]>([]);

  useEffect(() => {
    const refresh = () => setClaims(getClaims());
    refresh();
    window.addEventListener("claimtrust:updated", refresh);
    return () => window.removeEventListener("claimtrust:updated", refresh);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("history")}</h1>
        <div className="flex gap-2">
          {claims.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearClaims()}>
              Clear
            </Button>
          )}
          <Link href="/claims/new">
            <Button size="sm">+ {t("fileNewClaim")}</Button>
          </Link>
        </div>
      </div>

      {claims.length === 0 ? (
        <Card>
          <CardBody className="py-14 text-center text-sm text-muted">{t("noClaims")}</CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Claim ID</th>
                  <th className="px-5 py-3 font-medium">{t("procedure")}</th>
                  <th className="px-5 py-3 font-medium">{t("amount")}</th>
                  <th className="px-5 py-3 font-medium">{t("status")}</th>
                  <th className="px-5 py-3 font-medium">{t("date")}</th>
                  <th className="px-5 py-3 font-medium">{t("blockchainProof")}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs">{c.id}</td>
                    <td className="px-5 py-3">{c.input.procedure}</td>
                    <td className="px-5 py-3 font-medium">{formatINR(c.input.claimedAmount)}</td>
                    <td className="px-5 py-3">
                      <DecisionBadge decision={c.decision.decision} />
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">{formatDateTime(c.createdAt)}</td>
                    <td className="px-5 py-3 text-xs">
                      {c.proof ? (
                        <a
                          href={c.proof.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {c.proof.simulated ? "demo tx ↗" : "on-chain ↗"}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/claims/${c.id}`} className="text-sm font-medium text-primary hover:underline">
                        {t("view")} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
