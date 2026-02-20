// X accounts to monitor — hackathon founders, advisors, and ecosystem
// Organized by priority tier for rate-limit-aware polling

export interface XAccount {
  handle: string;
  name: string;
  role: string;
  org: string;
  tier: "critical" | "high" | "standard";
}

// Tier 1 — Poll every cycle (these accounts drive hackathon decisions)
export const CRITICAL_ACCOUNTS: XAccount[] = [
  { handle: "pumpdotfun", name: "Pump.fun", role: "Platform", org: "Pump.fun", tier: "critical" },
  { handle: "a1lon9", name: "Alon Cohen", role: "Co-founder", org: "Pump.fun", tier: "critical" },
];

// Tier 2 — Poll frequently (founders + top-tier advisors)
export const HIGH_ACCOUNTS: XAccount[] = [
  { handle: "sapijiju", name: "Noah Tweedale", role: "Co-founder & CEO", org: "Pump.fun", tier: "high" },
  { handle: "outdoteth", name: "Dylan Kerler", role: "Co-founder & Dev", org: "Pump.fun", tier: "high" },
  { handle: "TimDraper", name: "Tim Draper", role: "Founder & Managing Partner", org: "Draper Investments", tier: "high" },
  { handle: "anildelphi", name: "Anil Lulla", role: "Founder & CEO", org: "Delphi Digital", tier: "high" },
  { handle: "masonnystrom", name: "Mason Nystrom", role: "Junior Partner", org: "Pantera Capital", tier: "high" },
  { handle: "mert", name: "Mert", role: "Co-founder & CEO", org: "Helius", tier: "high" },
];

// Tier 3 — Poll on standard cadence
export const STANDARD_ACCOUNTS: XAccount[] = [
  { handle: "zsparta", name: "Saurabh Sharma", role: "Chief Investment Officer", org: "Jump Crypto", tier: "standard" },
  { handle: "HugoMartingale", name: "Hugo Martingale", role: "Head of Markets", org: "Polymarket", tier: "standard" },
  { handle: "pdimitrakos", name: "Peter Dimitrakos", role: "Asset Listings Principal", org: "Kraken", tier: "standard" },
  { handle: "ArcaChemist", name: "Sasha Fleyshman", role: "Portfolio Manager", org: "Arca", tier: "standard" },
  { handle: "AricChang", name: "Aric Chang", role: "General Partner", org: "Manifold Ventures", tier: "standard" },
  { handle: "Rahul_Mahtani", name: "Rahul Mahtani", role: "Head of BD", org: "Manifold Ventures", tier: "standard" },
  { handle: "segall_max", name: "Max Segall", role: "COO", org: "Privy", tier: "standard" },
  { handle: "mdudas", name: "Mike Dudas", role: "Founder & Managing Partner", org: "6th Man Ventures", tier: "standard" },
];

// Competitor accounts to watch
export const COMPETITOR_ACCOUNTS: XAccount[] = [
  { handle: "zauthx402", name: "Zauth", role: "Winner #1", org: "Hackathon", tier: "standard" },
];

export const ALL_ACCOUNTS: XAccount[] = [
  ...CRITICAL_ACCOUNTS,
  ...HIGH_ACCOUNTS,
  ...STANDARD_ACCOUNTS,
  ...COMPETITOR_ACCOUNTS,
];

// Quick lookup by handle
export const ACCOUNT_MAP = new Map(ALL_ACCOUNTS.map((a) => [a.handle.toLowerCase(), a]));
