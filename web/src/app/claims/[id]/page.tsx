"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardBody, Badge } from "@/components/ui";
import { DECISION_HERO, DECISION_LABEL } from "@/components/DecisionBadge";
import { useI18n } from "@/lib/i18n";
import { getClaim } from "@/lib/store";
import { downloadReport } from "@/lib/report";
import { formatDateTime, formatINR, shortHash } from "@/lib/utils";
import type { ClaimRecord } from "@/lib/types";

export default function DecisionPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const [claim, setClaim] = useState<ClaimRecord | null | undefined>(undefined);
  const [appealed, setAppealed] = useState(false);

  useEffect(() => {
    // Read from the client-side store after mount (localStorage is client-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClaim(getClaim(params.id) ?? null);
  }, [params.id]);

  if (claim === undefined) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-muted">Loading…</div>;
  }

  if (claim === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-muted">Claim not found.</p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          ← {t("backToDashboard")}
        </Link>
      </div>
    );
  }

  const { decision, input, proof } = claim;
  const hero = DECISION_HERO[decision.decision];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Link href="/" className="text-sm text-primary hover:underline">
        ← {t("backToDashboard")}
      </Link>

      {/* Hero result */}
      <div className={`animate-fade-up rounded-2xl bg-gradient-to-r ${hero} p-7 text-white shadow-md`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm/none opacity-90">{t("decisionTitle")}</div>
            <div className="mt-1 text-4xl font-bold">{DECISION_LABEL[decision.decision]}</div>
            <div className="mt-1 font-mono text-xs opacity-90">{claim.id}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">{t("confidence")}</div>
            <div className="text-3xl font-bold">{decision.confidence}%</div>
            <div className="mt-1 text-sm opacity-90">{formatINR(input.claimedAmount)}</div>
          </div>
        </div>
        {decision.explanation && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/95">{decision.explanation}</p>
        )}
      </div>

      {/* Rule-by-rule evaluation */}
      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("rulesTitle")}</h2>
            <Badge tone="blue">
              {t("poweredBy")}: {decision.source === "gemini" ? "Gemini AI" : "Rule engine"}
            </Badge>
          </div>
          <ol className="space-y-2">
            {decision.ruleResults.map((r) => (
              <li
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <span
                  className={`mt-0.5 flex h-6 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    r.status === "PASS" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {r.id}. {r.rule}
                  </div>
                  <div className="text-sm text-muted">{r.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Reasons */}
        <Card className="lg:col-span-3">
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("reasonsTitle")}</h2>
            <ul className="space-y-3">
              {decision.reasons.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {/* Inputs summary */}
        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("inputsTitle")}</h2>
            <dl className="space-y-2.5 text-sm">
              <Row label={t("abhaNumber")} value={maskAbha(input.abhaNumber)} />
              <Row label={t("schemeLabel")} value={input.scheme === "PM-JAY" ? "PM-JAY (Ayushman Bharat)" : "Private insurance"} />
              <Row label={t("policyNumber")} value={input.policyNumber || "—"} />
              <Row label={t("procedure")} value={input.procedure} />
              <Row label={t("claimAmount")} value={formatINR(input.claimedAmount)} />
              <Row label={t("coverageLimit")} value={formatINR(input.policy.coverageLimit)} />
              <Row label={t("procedurePerformed")} value={input.hospitalRecord.procedurePerformed} />
              <Row label={t("preAuthProvided")} value={input.hospitalRecord.preAuthorizationProvided ? "Yes" : "No"} />
              <Row label={t("timestamp")} value={formatDateTime(claim.createdAt)} />
            </dl>

            {input.description && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-medium text-muted">{t("description")}</div>
                <p className="line-clamp-4 rounded-lg bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700">
                  {input.description}
                </p>
              </div>
            )}

            {input.fileNames.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-muted">{t("uploadDocs")}</div>
                <ul className="flex flex-wrap gap-1.5">
                  {input.fileNames.map((f) => (
                    <li key={f} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      📎 {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Blockchain proof */}
      <Card>
        <CardBody>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">⛓️</span>
            <h2 className="text-lg font-semibold text-foreground">{t("blockchainProof")}</h2>
            {proof && (
              <Badge tone={proof.simulated ? "amber" : "green"}>
                {proof.simulated ? "Demo (simulated)" : "Live on Monad"}
              </Badge>
            )}
          </div>

          {proof ? (
            <>
              <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
                <MonoRow label={t("txHash")} value={proof.txHash} />
                <MonoRow label={t("reasonsHash")} value={proof.reasonsHash} />
                <MonoRow label={t("contract")} value={proof.contractAddress} />
                <Row label="Chain" value={`Monad Testnet (${proof.chainId})`} />
                {proof.blockNumber !== undefined && <Row label="Block" value={`#${proof.blockNumber}`} />}
              </dl>
              <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-xs leading-relaxed text-emerald-800">
                🔒 {t("immutableNote")}
              </p>
              <div className="mt-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-foreground">
                  🔒 {t("privacyTitle")}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-slate-50 p-2.5">
                    <div className="text-xs font-medium text-foreground">{t("offChainData")}</div>
                    <div className="text-xs text-muted">ABHA, name, full records, full reasons</div>
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5">
                    <div className="text-xs font-medium text-foreground">{t("onChainData")}</div>
                    <div className="break-all font-mono text-[11px] text-emerald-800">{shortHash(proof.reasonsHash, 14, 10)}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{t("privacyNote")}</p>
              </div>
              {proof.simulated && <p className="mt-2 text-xs text-amber-700">⚠ {t("simulatedNote")}</p>}
            </>
          ) : (
            <p className="text-sm text-muted">No blockchain proof recorded for this claim.</p>
          )}
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {proof && (
          <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer">
            <Button>⛓️ {t("viewOnChain")}</Button>
          </a>
        )}
        <Button variant="outline" onClick={() => downloadReport(claim)}>
          ⬇ {t("downloadReport")}
        </Button>
        <Button variant="ghost" onClick={() => setAppealed(true)}>
          ⚖ {t("fileAppeal")}
        </Button>
      </div>

      {appealed && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {t("appealMock")}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function MonoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm:col-span-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="break-all font-mono text-xs text-foreground" title={value}>
        {shortHash(value, 18, 14)}
      </dd>
    </div>
  );
}

function maskAbha(abha: string): string {
  const digits = abha.replace(/\D/g, "");
  if (digits.length < 4) return abha || "—";
  return `**-****-****-${digits.slice(-4)}`;
}
