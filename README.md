# agent-zero

War room operations center for [pump.studio](https://pump.studio) — the post-launch control room for pump.fun tokens.

## What This Does

- **X Monitor** — Tracks hackathon advisors, pump.fun founders, and competitors via the X API. Detects hackathon-relevant signals (winner announcements, advisor engagement, mentions of pump.studio).
- **AI Analyst** — Grok-powered strategic intelligence briefs. Digests raw signals into actionable directives with threat detection, opportunity mapping, and advisor targeting.
- **Intel Synthesizer** — Generates daily reports combining X signals with API health checks.
- **GitHub Actions** — Automated monitoring every 30 minutes + daily war room reports + AI briefs.

## Quick Start

```bash
cp .env.example .env
# Add your keys to .env
npm install
npm run monitor        # Single run
npm run monitor:loop   # Continuous monitoring
npm run intel          # Generate daily report
npm run analyst        # Generate AI strategic brief
npm run analyst:critical  # Analyze critical alerts only
```

## Agents

| Agent | File | Purpose | Trigger |
|-------|------|---------|---------|
| **X Monitor** | `src/x-monitor/monitor.ts` | Fetches tweets from 17 accounts, classifies signals into 5 categories, persists state | Every 30 min (cron) or manual |
| **Signal Classifier** | `src/x-monitor/monitor.ts` | Pattern-matches tweets against hackathon keywords, assigns severity levels | Runs within X Monitor |
| **X Client** | `src/x-monitor/client.ts` | Unified API client — getUserTweets, searchTweets, getUserInfo, getUserMentions | Called by Monitor |
| **Intel Synthesizer** | `src/intel/synthesizer.ts` | Reads raw alerts + tweets, checks api.pump.studio health, generates markdown report | Daily 6 AM UTC |
| **AI Analyst** | `src/intel/analyst.ts` | Sends raw intel to Grok via OpenRouter, produces strategic briefs with priority actions | Daily + on critical alerts |
| **OpenRouter Client** | `src/intel/openrouter.ts` | Routes LLM calls to Grok 3 Beta (x-ai/grok-3-beta) for analysis | Called by Analyst |
| **Logger** | `src/utils/logger.ts` | Colored ANSI terminal output — banner, alert, info, success, fail, logStep | All agents |

## War Room Index

| File | Contents |
|------|----------|
| [`war-room/STRATEGY.md`](war-room/STRATEGY.md) | Master hackathon strategy — positioning, differentiators, token plan, competition matrix |
| [`war-room/PITCHES.md`](war-room/PITCHES.md) | 30-second and 60-second pitch scripts |
| [`war-room/BATTLE-PLAN.md`](war-room/BATTLE-PLAN.md) | 24-hour execution plan + 5-day daily cadence through deadline |
| [`war-room/HACKATHON-RULES.md`](war-room/HACKATHON-RULES.md) | Complete rules, deadlines, selection criteria, investment terms, advisor roster |
| [`war-room/COMPETITIVE-INTEL.md`](war-room/COMPETITIVE-INTEL.md) | zauth winner analysis, competitor threat matrix, advisor targeting playbook |
| [`war-room/TOKEN-LAUNCH.md`](war-room/TOKEN-LAUNCH.md) | Bundled stealth launch strategy via PumpPortal/Jito, tokenomics, risk factors |
| [`war-room/TECH-VALIDATION.md`](war-room/TECH-VALIDATION.md) | API health results, codebase architecture, X API schema, endpoint status |
| [`war-room/ACCOUNTS.md`](war-room/ACCOUNTS.md) | All 17 monitored X accounts — founders, advisors, competitors |
| [`war-room/RESEARCH-LOG.md`](war-room/RESEARCH-LOG.md) | Full 6-agent research consortium output and key insights |
| `war-room/intel/` | AI-generated strategic briefs (auto-populated by Grok) |

## Signal Detection

5 categories with keyword matching and severity classification:

| Signal | Keywords | Severity Logic |
|--------|----------|---------------|
| `winner_announcement` | winner, selected, investment, funded, awarded | Critical if from pump.fun founders |
| `pump_studio_mention` | pump.studio, pump studio, $studio | Always high priority |
| `hackathon_mention` | hackathon, build in public, $250k, $3m | High if from critical accounts |
| `advisor_signal` | reviewing, impressed by, shipping, standout | Medium baseline |
| `competitor_activity` | zauth, hyperscape, pumpcade, opal ai | Medium baseline |

## Monitoring Tiers

| Tier | Accounts | Frequency |
|------|----------|-----------|
| Critical | @pumpdotfun, @a1lon9 | Every cycle |
| High | @sapijiju, @outdoteth, @TimDraper, @anildelphi, @masonnystrom, @mert | Every cycle |
| Standard | @zsparta, @HugoMartingale, @pdimitrakos, @ArcaChemist, @AricChang, @Rahul_Mahtani, @segall_max, @mdudas, @zauthx402 | Every 3rd cycle |

## GitHub Actions Setup

Add these secrets to your repo (`Settings > Secrets > Actions`):

| Secret | Purpose | Required |
|--------|---------|----------|
| `X_API_KEY` | twitterapi.io API key | Yes |
| `OPENROUTER_API_KEY` | OpenRouter key for Grok analysis | Yes |
| `PUMP_STUDIO_API_KEY` | pump.studio API key | Optional |

Workflows:
- **X Monitor** (`x-monitor.yml`) — Every 30 min + manual trigger. Runs monitor, triggers critical alert analysis, commits intel.
- **Daily War Room Report** (`war-room-report.yml`) — 6 AM UTC daily. Runs synthesizer, generates AI strategic brief, checks API health, commits reports.

## Structure

```
agent-zero/
├── .github/workflows/        # Automated monitoring & reporting
│   ├── x-monitor.yml         # Every 30 min — X monitor + critical analysis
│   └── war-room-report.yml   # Daily — synthesizer + AI brief + health checks
├── src/
│   ├── x-monitor/
│   │   ├── accounts.ts       # 17 accounts across 3 tiers
│   │   ├── client.ts         # X API client (4 endpoints)
│   │   ├── monitor.ts        # Signal detection engine
│   │   └── types.ts          # XTweet, XAPITweet, IntelAlert, MonitorResult
│   ├── intel/
│   │   ├── analyst.ts        # AI analyst — daily + critical briefs via Grok
│   │   ├── openrouter.ts     # OpenRouter API client
│   │   └── synthesizer.ts    # Daily report generator + API health
│   └── utils/
│       └── logger.ts         # Colored terminal output
├── data/                     # Runtime intel data (gitignored, cached in CI)
│   ├── monitor-state.json    # Last seen tweet IDs, run counters
│   ├── alerts.json           # Signal alerts (last 500)
│   └── tweets.json           # Tweet batches (last 200)
├── war-room/                 # Strategy docs, research, intel briefs
│   ├── intel/                # AI-generated briefs (auto-populated)
│   ├── STRATEGY.md
│   ├── PITCHES.md
│   ├── BATTLE-PLAN.md
│   ├── HACKATHON-RULES.md
│   ├── COMPETITIVE-INTEL.md
│   ├── TOKEN-LAUNCH.md
│   ├── TECH-VALIDATION.md
│   ├── ACCOUNTS.md
│   └── RESEARCH-LOG.md
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```
