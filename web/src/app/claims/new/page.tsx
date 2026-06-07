"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardBody, Input, Label, Select, Textarea } from "@/components/ui";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_POLICY } from "@/lib/policy";
import { SAMPLE_CLAIMS } from "@/lib/samples";
import { saveClaim } from "@/lib/store";
import { generateClaimId } from "@/lib/utils";
import type { AIDecision, BlockchainProof, ClaimInput, ClaimType } from "@/lib/types";

const CLAIM_TYPES: ClaimType[] = ["Pharmacy", "Pre-Authorization", "Hospital Claim"];

export default function NewClaimPage() {
  const { t } = useI18n();
  const router = useRouter();

  // Patient / policy identity
  const [abha, setAbha] = useState("");
  const [abhaVerified, setAbhaVerified] = useState(false);
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("Hospital Claim");

  // Claim
  const [procedure, setProcedure] = useState("");
  const [claimedAmount, setClaimedAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fileNames, setFileNames] = useState<string[]>([]);

  // Policy terms
  const [coveredProcedures, setCoveredProcedures] = useState(DEFAULT_POLICY.coveredProcedures.join(", "));
  const [coverageLimit, setCoverageLimit] = useState(String(DEFAULT_POLICY.coverageLimit));
  const [requiresPreAuth, setRequiresPreAuth] = useState(DEFAULT_POLICY.requiresPreAuthorization);

  // Hospital record
  const [procedurePerformed, setProcedurePerformed] = useState("");
  const [preAuthProvided, setPreAuthProvided] = useState(false);

  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(-1);

  function loadSample(i: number) {
    const s = SAMPLE_CLAIMS[i].input;
    setAbha(s.abhaNumber);
    setAbhaVerified(false);
    setPolicyNumber(s.policyNumber);
    setClaimType(s.claimType);
    setProcedure(s.procedure);
    setClaimedAmount(String(s.claimedAmount));
    setDescription(s.description);
    setFileNames(s.fileNames);
    setCoveredProcedures(s.policy.coveredProcedures.join(", "));
    setCoverageLimit(String(s.policy.coverageLimit));
    setRequiresPreAuth(s.policy.requiresPreAuthorization);
    setProcedurePerformed(s.hospitalRecord.procedurePerformed);
    setPreAuthProvided(s.hospitalRecord.preAuthorizationProvided);
    setConsent(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!procedure.trim()) return setError("Please enter the claimed procedure.");
    if (!claimedAmount || Number(claimedAmount) <= 0) return setError("Please enter a valid claimed amount.");
    if (!procedurePerformed.trim()) return setError("Please enter the procedure performed (hospital record).");
    if (!consent) return setError("Consent is required to process the claim.");

    const input: ClaimInput = {
      abhaNumber: abha,
      policyNumber,
      claimType,
      procedure: procedure.trim(),
      claimedAmount: Number(claimedAmount),
      description: description.trim(),
      fileNames,
      policy: {
        coveredProcedures: coveredProcedures
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        coverageLimit: Number(coverageLimit),
        requiresPreAuthorization: requiresPreAuth,
      },
      hospitalRecord: {
        procedurePerformed: procedurePerformed.trim(),
        preAuthorizationProvided: preAuthProvided,
      },
    };
    const claimId = generateClaimId();

    try {
      setStep(1);
      const aiRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!aiRes.ok) throw new Error("AI analysis failed");
      const { decision } = (await aiRes.json()) as { decision: AIDecision };

      setStep(2);
      await new Promise((r) => setTimeout(r, 700));

      setStep(3);
      const recRes = await fetch("/api/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, input, decision }),
      });
      let proof: BlockchainProof | null = null;
      if (recRes.ok) proof = (await recRes.json()).proof as BlockchainProof;

      saveClaim({ id: claimId, createdAt: Date.now(), input, decision, proof });
      setStep(4);
      await new Promise((r) => setTimeout(r, 600));
      router.push(`/claims/${claimId}`);
    } catch (err) {
      console.error(err);
      setStep(-1);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {step >= 0 && <ProcessingOverlay step={step} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("newClaimTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">{t("tryShortcut")}:</span>
        {SAMPLE_CLAIMS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => loadSample(i)}
            type="button"
            className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            title={s.hint}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identity */}
            <Section title="Patient & Policy">
              <Label>{t("abhaNumber")}</Label>
              <div className="flex gap-2">
                <Input
                  value={abha}
                  onChange={(e) => {
                    setAbha(e.target.value);
                    setAbhaVerified(false);
                  }}
                  placeholder="12-3456-7890-1234"
                />
                <Button
                  type="button"
                  variant={abhaVerified ? "success" : "outline"}
                  onClick={() => setAbhaVerified(abha.trim().length >= 4)}
                >
                  {abhaVerified ? t("verified") : t("verify")}
                </Button>
              </div>
              {abhaVerified && <p className="mt-1 text-xs text-accent">ABHA verified against the mock registry.</p>}

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>{t("policyNumber")}</Label>
                  <Input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="CT-IND-2026-XXXX" />
                </div>
                <div>
                  <Label>{t("claimType")}</Label>
                  <Select value={claimType} onChange={(e) => setClaimType(e.target.value as ClaimType)}>
                    {CLAIM_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Section>

            {/* Claim */}
            <Section title="Claim">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>{t("procedure")}</Label>
                  <Input value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder="Cataract Surgery" />
                </div>
                <div>
                  <Label>{t("claimAmount")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={claimedAmount}
                    onChange={(e) => setClaimedAmount(e.target.value)}
                    placeholder="45000"
                  />
                </div>
              </div>
            </Section>

            {/* Policy terms */}
            <Section title={t("policyTerms")} subtitle={t("policyTermsHint")}>
              <Label>{t("coveredProcedures")}</Label>
              <Textarea
                rows={2}
                value={coveredProcedures}
                onChange={(e) => setCoveredProcedures(e.target.value)}
                placeholder="Cataract Surgery, Knee Replacement, Angioplasty"
              />
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>{t("coverageLimit")}</Label>
                  <Input type="number" min={0} value={coverageLimit} onChange={(e) => setCoverageLimit(e.target.value)} />
                </div>
                <div className="flex items-end pb-1">
                  <Toggle checked={requiresPreAuth} onChange={setRequiresPreAuth} label={t("requiresPreAuth")} />
                </div>
              </div>
            </Section>

            {/* Hospital record */}
            <Section title={t("hospitalRecord")}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>{t("procedurePerformed")}</Label>
                  <Input
                    value={procedurePerformed}
                    onChange={(e) => setProcedurePerformed(e.target.value)}
                    placeholder="Cataract Surgery"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <Toggle checked={preAuthProvided} onChange={setPreAuthProvided} label={t("preAuthProvided")} />
                </div>
              </div>
            </Section>

            {/* Notes + upload */}
            <Section title="Supporting Documents">
              <Label>{t("description")}</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Doctor's notes, diagnosis, dates…"
              />
              <p className="mt-1 text-xs text-muted">{t("descriptionHint")}</p>

              <div className="mt-4">
                <Label>{t("uploadDocs")}</Label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
                  className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-muted">{t("uploadHint")}</p>
                {fileNames.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {fileNames.map((f) => (
                      <li key={f} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        📎 {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-slate-50 p-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="text-sm text-foreground">{t("consent")}</span>
            </label>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}

            <Button type="submit" size="lg" className="w-full">
              {t("submitClaim")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5 first:border-0 first:pt-0">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm font-medium text-foreground"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-accent" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      {label}: <span className={checked ? "text-accent" : "text-muted"}>{checked ? "Yes" : "No"}</span>
    </button>
  );
}
