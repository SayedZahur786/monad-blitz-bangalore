// Mock ABDM (Ayushman Bharat Digital Mission) registry.
//
// Simulates an ABHA identity + linked-health-records lookup. In a real build,
// "Verify" would call the ABDM gateway and "Fetch" would pull consented records
// from the patient's linked care contexts. Here we return believable demo data
// so the flow looks authentic. IMPORTANT: this rich data is OFF-CHAIN — only a
// keccak256 commitment of the decision ever touches Monad.

export interface LinkedHealthRecord {
  facility: string;
  date: string; // human-readable
  procedure: string;
  diagnosis: string;
  preAuthorizationProvided: boolean;
  amount: number; // INR
}

export interface AbhaProfile {
  abhaNumber: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  abhaAddress: string; // e.g. rajesh.kumar@abdm
  state: string;
  records: LinkedHealthRecord[];
}

const digitsOf = (s: string) => s.replace(/\D/g, "");

/** A few named demo patients keyed by their ABHA digits. */
const REGISTRY: Record<string, AbhaProfile> = {
  "12345678901234": {
    abhaNumber: "12-3456-7890-1234",
    name: "Rajesh Kumar",
    age: 58,
    gender: "Male",
    abhaAddress: "rajesh.kumar@abdm",
    state: "Karnataka",
    records: [
      {
        facility: "Aravind Eye Hospital, Bengaluru",
        date: "02 Jun 2026",
        procedure: "Cataract Surgery",
        diagnosis: "Senile cataract, left eye",
        preAuthorizationProvided: true,
        amount: 45000,
      },
    ],
  },
  "98765432109876": {
    abhaNumber: "98-7654-3210-9876",
    name: "Priya Sharma",
    age: 64,
    gender: "Female",
    abhaAddress: "priya.sharma@abdm",
    state: "Maharashtra",
    records: [
      {
        facility: "Apollo Hospital, Mumbai",
        date: "21 May 2026",
        procedure: "Knee Replacement",
        diagnosis: "Severe osteoarthritis, right knee",
        preAuthorizationProvided: true,
        amount: 480000,
      },
    ],
  },
  "44998877665544": {
    abhaNumber: "44-9988-7766-5544",
    name: "Lakshmi Nair",
    age: 52,
    gender: "Female",
    abhaAddress: "lakshmi.nair@abdm",
    state: "Kerala",
    records: [
      {
        facility: "Government Medical College, Thiruvananthapuram",
        date: "18 May 2026",
        procedure: "Angioplasty",
        diagnosis: "Single-vessel coronary artery disease",
        preAuthorizationProvided: true,
        amount: 165000,
      },
    ],
  },
};

const FALLBACK_NAMES = [
  "Amit Verma",
  "Sunita Reddy",
  "Mohammed Iqbal",
  "Anjali Gupta",
  "Vikram Singh",
  "Deepa Menon",
];
const FALLBACK_STATES = ["Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "West Bengal", "Telangana"];
const FALLBACK_PROCS: Array<Omit<LinkedHealthRecord, "facility" | "date">> = [
  { procedure: "Appendectomy", diagnosis: "Acute appendicitis", preAuthorizationProvided: true, amount: 72000 },
  { procedure: "Cataract Surgery", diagnosis: "Senile cataract, right eye", preAuthorizationProvided: true, amount: 42000 },
  { procedure: "Dialysis", diagnosis: "Chronic kidney disease, stage 4", preAuthorizationProvided: true, amount: 38000 },
];

/** Deterministic small hash so the same ABHA always returns the same profile. */
function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Look up (or believably generate) an ABHA profile. If `abha` is empty, returns
 * a default demo patient so the "Fetch" flow always works in the demo.
 */
export function lookupAbha(abha: string): AbhaProfile {
  const d = digitsOf(abha);
  if (d && REGISTRY[d]) return REGISTRY[d];

  // Deterministic synthetic profile for any other (or empty) ABHA.
  const seed = hashNum(d || "demo");
  const name = FALLBACK_NAMES[seed % FALLBACK_NAMES.length];
  const proc = FALLBACK_PROCS[seed % FALLBACK_PROCS.length];
  const pretty = abha.trim() || "00-0000-0000-0000";
  return {
    abhaNumber: pretty,
    name,
    age: 35 + (seed % 45),
    gender: seed % 2 === 0 ? "Male" : "Female",
    abhaAddress: `${name.toLowerCase().replace(/\s+/g, ".")}@abdm`,
    state: FALLBACK_STATES[seed % FALLBACK_STATES.length],
    records: [
      {
        facility: "City General Hospital",
        date: "28 May 2026",
        ...proc,
      },
    ],
  };
}
