"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardBody, Input, Label, Select, Textarea } from "@/components/ui";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { useI18n } from "@/lib/i18n";
import { lookupAbha, type AbhaProfile } from "@/lib/abdm";
import { DEFAULT_POLICY, PMJAY_POLICY } from "@/lib/policy";
import { SAMPLE_CLAIMS } from "@/lib/samples";
import { saveClaim } from "@/lib/store";
import { formatINR, generateClaimId } from "@/lib/utils";
import type { AIDecision, BlockchainProof, ClaimInput, ClaimType, Scheme } from "@/lib/types";

const CLAIM_TYPES: ClaimType[] = ["Pharmacy", "Pre-Authorization", "Hospital Claim"];

export default function NewClaimPage() {
  const { t } = useI18n();
  const router = useRouter();

  // Patient / policy identity
  const [abha, setAbha] = useState("");
  const [abhaVerified, setAbhaVerified] = useState(false);
  const [profile, setProfile] = useState<AbhaProfile | null>(null);
  const [fetched, setFetched] = useState(false);
  const [policyNumber, setPolicyNumber] = useState("");
  const [claimType, setClaimType] = useState<ClaimType>("Hospital Claim");
  const [scheme, setScheme] = useState<Scheme>("Private");

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

  function handleVerify() {
    setProfile(lookupAbha(abha));
    setAbhaVerified(true);
  }

  function handleFetch() {
    const p = lookupAbha(abha);
    setProfile(p);
    setAbhaVerified(true);
    setFetched(true);
    const rec = p.records[0];
    if (rec) {
      // Auto-fill the claim + hospital record from the consented ABHA records.
      setProcedure(rec.procedure);
      setClaimedAmount(String(rec.amount));
      setProcedurePerformed(rec.procedure);
      setPreAuthProvided(rec.preAuthorizationProvided);
      setDescription(`${rec.diagnosis}. Treated at ${rec.facility} on ${rec.date}.`);
    }
  }

  function applyScheme(next: Scheme) {
    setScheme(next);
    const pol = next === "PM-JAY" ? PMJAY_POLICY : DEFAULT_POLICY;
    setCoveredProcedures(pol.coveredProcedures.join(", "));
    setCoverageLimit(String(pol.coverageLimit));
    setRequiresPreAuth(pol.requiresPreAuthorization);
  }

  function loadSample(i: number) {
    const s = SAMPLE_CLAIMS[i].input;
    setAbha(s.abhaNumber);
    setAbhaVerified(false);
    setProfile(null);
    setFetched(false);
    setPolicyNumber(s.policyNumber);
    setClaimType(s.claimType);
    setScheme(s.scheme);
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
      scheme,
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
            {/* Scheme selector */}
            <div className="rounded-xl border border-border bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">{t("schemePmjay")}</div>
                  <p className="text-xs text-muted">{t("schemePmjayHint")}</p>
                </div>
                <SwitchOnly checked={scheme === "PM-JAY"} onChange={(on) => applyScheme(on ? "PM-JAY" : "Private")} />
              </div>
              {scheme === "PM-JAY" && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                  🇮🇳 Ayushman Bharat — PM-JAY · ₹5,00,000 family cover · cashless
                </div>
              )}
            </div>

            {/* Identity + ABDM */}
            <Section title="Patient & Policy">
              <Label>{t("abhaOptional")}</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  className="min-w-[180px] flex-1"
                  value={abha}
                  onChange={(e) => {
                    setAbha(e.target.value);
                    setAbhaVerified(false);
                    setFetched(false);
                  }}
                  placeholder="12-3456-7890-1234"
                />
                <Button type="button" variant={abhaVerified ? "success" : "outline"} onClick={handleVerify}>
                  {abhaVerified ? t("verified") : t("verify")}
                </Button>
                <Button type="button" variant="primary" onClick={handleFetch}>
                  ⬇ {t("fetchRecords")}
                </Button>
              </div>

              {/* Verified patient card (ABDM) */}
              {profile && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{profile.name}</div>
                        <div className="text-xs text-muted">
                          {profile.age} yrs · {profile.gender} · {profile.state}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      ✓ {t("abhaVerifiedVia")}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-xs text-muted">{profile.abhaAddress}</div>

                  {fetched && profile.records.length > 0 && (
                    <div className="mt-3 border-t border-blue-100 pt-2">
                      <div className="mb-1 text-xs font-medium text-foreground">{t("linkedRecords")}</div>
                      <ul className="space-y-1">
                        {profile.records.map((r, i) => (
                          <li key={i} className="text-xs text-slate-700">
                            🏥 <span className="font-medium">{r.procedure}</span> — {r.facility}, {r.date} ·{" "}
                            {formatINR(r.amount)} · pre-auth {r.preAuthorizationProvided ? "✓" : "✕"}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-accent">↳ {t("autoFilled")}</p>
                    </div>
                  )}
                </div>
              )}

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
                <Toggle checked={requiresPreAuth} onChange={setRequiresPreAuth} label={t("requiresPreAuth")} />
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
                <Toggle checked={preAuthProvided} onChange={setPreAuthProvided} label={t("preAuthProvided")} />
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

            {/* Privacy by design */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                🔒 {t("privacyTitle")}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">{t("privacyNote")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-emerald-100 bg-white p-2.5">
                  <div className="text-xs font-medium text-foreground">{t("offChainData")}</div>
                  <div className="text-xs text-muted">ABHA, name, full records, reasons</div>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-white p-2.5">
                  <div className="text-xs font-medium text-foreground">{t("onChainData")}</div>
                  <div className="text-xs text-muted">keccak256 hash, decision, masked summary</div>
                </div>
              </div>
            </div>

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

/** Switch with a label-on-top, matching input height (used in 2-col grids). */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 text-sm text-foreground transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <span className={checked ? "font-medium text-accent" : "text-muted"}>{checked ? "Yes" : "No"}</span>
        <Knob checked={checked} />
      </button>
    </div>
  );
}

/** Bare switch (no label/border), used for the scheme selector row. */
function SwitchOnly({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="shrink-0 focus:outline-none"
    >
      <Knob checked={checked} />
    </button>
  );
}

function Knob({ checked }: { checked: boolean }) {
  return (
    <span className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-slate-300"}`}>
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  );
}
