# agent-zero

War room operations center for [pump.studio](https://pump.studio) — the post-launch control room for pump.fun tokens.

## What This Does

- **X Monitor** — Tracks hackathon advisors, pump.fun founders, and competitors via the X API. Detects hackathon-relevant signals (winner announcements, advisor engagement, mentions of pump.studio).
- **Intel Synthesizer** — Generates daily reports combining X signals with API health checks.
- **GitHub Actions** — Automated monitoring every 30 minutes + daily war room reports.

## Quick Start

```bash
cp .env.example .env
# Add your X_API_KEY to .env
npm install
npm run monitor        # Single run
npm run monitor:loop   # Continuous monitoring
npm run intel          # Generate daily report
```

## GitHub Actions Setup

Add these secrets to your repo:

- `X_API_KEY` — Your X API key
- `PUMP_STUDIO_API_KEY` — Your pump.studio API key

Workflows:
- **X Monitor** — Runs every 30 minutes, tracks all accounts, commits intel to `data/`
- **Daily War Room Report** — Runs at 6 AM UTC, synthesizes 24h of signals + API health

## Structure

```
agent-zero/
├── .github/workflows/     # Automated monitoring & reporting
├── src/
│   ├── x-monitor/         # X API client + signal detection
│   ├── intel/             # Daily report synthesis
│   └── utils/             # Logging utilities
├── data/                  # Intel data (gitignored except .gitkeep)
└── war-room/              # Strategy docs, pitches, account lists
```

## Monitoring Tiers

| Tier | Accounts | Frequency |
|------|----------|-----------|
| Critical | @pumpdotfun, @a1lon9 | Every cycle |
| High | Founders + top advisors | Every cycle |
| Standard | All advisors + competitors | Every 3rd cycle |
