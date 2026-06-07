// Minimal English <-> Hindi i18n for ClaimTrust India.
// Stores the chosen language in localStorage and exposes a `t()` helper.

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

type Dict = Record<string, { en: string; hi: string }>;

const DICT: Dict = {
  appName: { en: "ClaimTrust India", hi: "क्लेमट्रस्ट इंडिया" },
  tagline: {
    en: "Explainable AI claim decisions, permanently on Monad.",
    hi: "व्याख्या-योग्य एआई दावा निर्णय, मोनाड पर स्थायी रूप से दर्ज।",
  },
  // nav
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  history: { en: "History", hi: "इतिहास" },
  fileNewClaim: { en: "File New Claim", hi: "नया दावा दर्ज करें" },
  demoUser: { en: "Demo User", hi: "डेमो उपयोगकर्ता" },
  // dashboard
  welcomeTitle: { en: "Trust, made verifiable.", hi: "भरोसा, अब सत्यापन-योग्य।" },
  welcomeBody: {
    en: "Every AI claim decision is explained in plain language and recorded immutably on the Monad blockchain — so policyholders, insurers and IRDAI can all verify exactly why a decision was made.",
    hi: "हर एआई दावा निर्णय सरल भाषा में समझाया जाता है और मोनाड ब्लॉकचेन पर अपरिवर्तनीय रूप से दर्ज किया जाता है — ताकि पॉलिसीधारक, बीमाकर्ता और IRDAI यह सत्यापित कर सकें कि निर्णय क्यों लिया गया।",
  },
  recentClaims: { en: "Recent Claims", hi: "हाल के दावे" },
  noClaims: { en: "No claims yet. File your first claim to see it here.", hi: "अभी तक कोई दावा नहीं। अपना पहला दावा दर्ज करें।" },
  // steps
  step1: { en: "Submit Claim", hi: "दावा जमा करें" },
  step2: { en: "AI Reasoning", hi: "एआई तर्क" },
  step3: { en: "Record on Monad", hi: "मोनाड पर दर्ज करें" },
  step4: { en: "Transparent Decision", hi: "पारदर्शी निर्णय" },
  // form
  newClaimTitle: { en: "File a New Claim", hi: "नया दावा दर्ज करें" },
  abhaNumber: { en: "ABHA Number", hi: "आभा नंबर" },
  verify: { en: "Verify", hi: "सत्यापित करें" },
  verified: { en: "Verified ✓", hi: "सत्यापित ✓" },
  policyNumber: { en: "Policy Number", hi: "पॉलिसी नंबर" },
  claimType: { en: "Claim Type", hi: "दावा प्रकार" },
  claimAmount: { en: "Claimed Amount (₹)", hi: "दावा राशि (₹)" },
  procedure: { en: "Procedure", hi: "प्रक्रिया" },
  policyTerms: { en: "Policy Terms", hi: "पॉलिसी शर्तें" },
  policyTermsHint: {
    en: "Terms the AI evaluates the claim against (pre-filled from the policy on file).",
    hi: "जिन शर्तों के विरुद्ध एआई दावे का मूल्यांकन करता है (फ़ाइल पर मौजूद पॉलिसी से भरी गईं)।",
  },
  coveredProcedures: { en: "Covered Procedures (comma-separated)", hi: "कवर की गई प्रक्रियाएँ (अल्पविराम से अलग)" },
  coverageLimit: { en: "Coverage Limit (₹)", hi: "कवरेज सीमा (₹)" },
  requiresPreAuth: { en: "Requires Pre-Authorisation", hi: "पूर्व-अनुमोदन आवश्यक" },
  hospitalRecord: { en: "Hospital Record", hi: "अस्पताल रिकॉर्ड" },
  procedurePerformed: { en: "Procedure Performed", hi: "की गई प्रक्रिया" },
  preAuthProvided: { en: "Pre-Authorisation Provided", hi: "पूर्व-अनुमोदन प्रदान किया गया" },
  rulesTitle: { en: "Rule-by-rule evaluation", hi: "नियम-दर-नियम मूल्यांकन" },
  description: { en: "Document Description", hi: "दस्तावेज़ विवरण" },
  descriptionHint: {
    en: "Describe the treatment, doctor notes, diagnosis, and any pre-authorisation. This is the main input the AI reasons over.",
    hi: "उपचार, डॉक्टर के नोट्स, निदान और किसी भी पूर्व-अनुमोदन का वर्णन करें। एआई मुख्य रूप से इसी का विश्लेषण करता है।",
  },
  uploadDocs: { en: "Upload Documents", hi: "दस्तावेज़ अपलोड करें" },
  uploadHint: { en: "Optional. File names are stored for the record (no OCR in this demo).", hi: "वैकल्पिक। रिकॉर्ड के लिए फ़ाइल नाम सहेजे जाते हैं (इस डेमो में OCR नहीं)।" },
  consent: {
    en: "I consent to AI processing my data and logging the decision on the blockchain.",
    hi: "मैं अपने डेटा के एआई प्रसंस्करण और ब्लॉकचेन पर निर्णय दर्ज करने के लिए सहमति देता/देती हूँ।",
  },
  submitClaim: { en: "Analyse & Record Claim", hi: "विश्लेषण करें और दर्ज करें" },
  tryShortcut: { en: "Try a sample claim", hi: "एक नमूना दावा आज़माएँ" },
  // processing
  processing: { en: "Processing your claim", hi: "आपका दावा संसाधित हो रहा है" },
  procAI: { en: "AI analysing claim against policy rules…", hi: "एआई नीति नियमों के विरुद्ध दावे का विश्लेषण कर रहा है…" },
  procReasons: { en: "Generating plain-language reasons…", hi: "सरल भाषा में कारण तैयार किए जा रहे हैं…" },
  procChain: { en: "Recording decision on Monad blockchain…", hi: "मोनाड ब्लॉकचेन पर निर्णय दर्ज किया जा रहा है…" },
  procDone: { en: "Done! Opening your transparent decision…", hi: "हो गया! आपका पारदर्शी निर्णय खोला जा रहा है…" },
  // decision
  decisionTitle: { en: "Claim Decision", hi: "दावा निर्णय" },
  reasonsTitle: { en: "Why this decision?", hi: "यह निर्णय क्यों?" },
  inputsTitle: { en: "Inputs used", hi: "उपयोग किए गए इनपुट" },
  confidence: { en: "AI Confidence", hi: "एआई आत्मविश्वास" },
  approvedAmount: { en: "Approved Amount", hi: "स्वीकृत राशि" },
  timestamp: { en: "Recorded at", hi: "दर्ज किया गया" },
  blockchainProof: { en: "Blockchain Proof", hi: "ब्लॉकचेन प्रमाण" },
  viewOnChain: { en: "View on Blockchain", hi: "ब्लॉकचेन पर देखें" },
  downloadReport: { en: "Download Report (PDF)", hi: "रिपोर्ट डाउनलोड करें (PDF)" },
  fileAppeal: { en: "File Appeal", hi: "अपील दर्ज करें" },
  txHash: { en: "Transaction Hash", hi: "लेन-देन हैश" },
  reasonsHash: { en: "Reasons Hash (keccak256)", hi: "कारण हैश (keccak256)" },
  contract: { en: "Contract", hi: "अनुबंध" },
  poweredBy: { en: "Decision by", hi: "निर्णयकर्ता" },
  simulatedNote: {
    en: "Demo mode: simulated on-chain hash (configure MONAD_PRIVATE_KEY to record a live transaction).",
    hi: "डेमो मोड: अनुकरणित ऑन-चेन हैश (लाइव लेन-देन दर्ज करने के लिए MONAD_PRIVATE_KEY कॉन्फ़िगर करें)।",
  },
  appealMock: { en: "Appeal submitted (demo). A grievance officer will review your case.", hi: "अपील जमा की गई (डेमो)। एक शिकायत अधिकारी आपके मामले की समीक्षा करेगा।" },
  immutableNote: {
    en: "This decision is committed on-chain and cannot be altered. Anyone can re-hash the published reasons and verify the match.",
    hi: "यह निर्णय ऑन-चेन दर्ज है और बदला नहीं जा सकता। कोई भी प्रकाशित कारणों को पुनः-हैश करके मिलान सत्यापित कर सकता है।",
  },
  backToDashboard: { en: "Back to Dashboard", hi: "डैशबोर्ड पर वापस" },
  view: { en: "View", hi: "देखें" },
  status: { en: "Status", hi: "स्थिति" },
  amount: { en: "Amount", hi: "राशि" },
  date: { en: "Date", hi: "तारीख" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("claimtrust:lang") as Lang | null;
    // SSR-safe: read the persisted language only on the client after mount to
    // avoid a hydration mismatch (server has no localStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("claimtrust:lang", l);
  };

  const t = (key: keyof typeof DICT) => DICT[key]?.[lang] ?? String(key);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
