"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Card, CardBody } from "@/components/ui";
import { StepsStrip } from "@/components/StepsStrip";
import { DecisionBadge } from "@/components/DecisionBadge";
import { useI18n } from "@/lib/i18n";
import { getClaims } from "@/lib/store";
import { formatDateTime, formatINR } from "@/lib/utils";
import type { ClaimRecord } from "@/lib/types";

export default function DashboardPage() {
  const { t } = useI18n();
  const [claims, setClaims] = useState<ClaimRecord[]>([]);

  useEffect(() => {
    const refresh = () => setClaims(getClaims());
    refresh();
    window.addEventListener("claimtrust:updated", refresh);
    return () => window.removeEventListener("claimtrust:updated", refresh);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="brand-gradient border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-primary">
              ⛓️ IRDAI-aligned · Immutable audit trail on Monad
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("welcomeTitle")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted">{t("welcomeBody")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/claims/new">
                <Button size="lg">+ {t("fileNewClaim")}</Button>
              </Link>
              <Link href="/history">
                <Button size="lg" variant="outline">
                  {t("history")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        {/* 4-step flow */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            How it works
          </h2>
          <StepsStrip />
        </section>

        {/* Recent claims */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("recentClaims")}</h2>
            <Link href="/history" className="text-sm font-medium text-primary hover:underline">
              {t("history")} →
            </Link>
          </div>

          {claims.length === 0 ? (
            <Card>
              <CardBody className="flex flex-col items-center gap-4 py-14 text-center">
                <span className="text-4xl">🗂️</span>
                <p className="max-w-sm text-sm text-muted">{t("noClaims")}</p>
                <Link href="/claims/new">
                  <Button>+ {t("fileNewClaim")}</Button>
                </Link>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {claims.slice(0, 6).map((c) => (
                <Link key={c.id} href={`/claims/${c.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardBody className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-muted">{c.id}</span>
                        <DecisionBadge decision={c.decision.decision} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{c.input.procedure}</div>
                        <div className="text-lg font-semibold text-foreground">
                          {formatINR(c.input.claimedAmount)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{formatDateTime(c.createdAt)}</span>
                        {c.proof && (
                          <span className="inline-flex items-center gap-1 text-accent">
                            ⛓️ {c.proof.simulated ? "demo" : "on-chain"}
                          </span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
