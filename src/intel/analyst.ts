// War Room Analyst — AI-powered intel digestion and strategic briefs
// Reads raw signals from the monitor, synthesizes actionable intelligence

import "dotenv/config";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { OpenRouterClient } from "./openrouter.js";
import { banner, info, success, fail, logStep, divider, timestamp } from "../utils/logger.js";
import type { IntelAlert, MonitorResult, XTweet } from "../x-monitor/types.js";
import { ALL_ACCOUNTS } from "../x-monitor/accounts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const INTEL_DIR = join(__dirname, "../../war-room/intel");
const ALERTS_FILE = join(DATA_DIR, "alerts.json");
const TWEETS_FILE = join(DATA_DIR, "tweets.json");

function loadJSON<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8"));
}

// Build context window for the analyst — last 24h of raw intel
function buildIntelContext(alerts: IntelAlert[], tweets: MonitorResult[]): string {
  const last24h = new Date(Date.now() - 86400000).toISOString();

  const recentAlerts = alerts.filter((a) => a.detectedAt > last24h);
  const recentTweets = tweets.filter((r) => r.fetchedAt > last24h);

  const sections: string[] = [];

  // Alert summary
  if (recentAlerts.length > 0) {
    sections.push("## RAW ALERTS (last 24h)");
    for (const a of recentAlerts) {
      sections.push(`[${a.severity.toUpperCase()}] ${a.type} — ${a.source}`);
      sections.push(`  "${a.tweet.text.slice(0, 300)}"`);
      sections.push(`  Engagement: ${a.tweet.metrics.likes}L ${a.tweet.metrics.retweets}RT ${a.tweet.metrics.views}V`);
      sections.push(`  ${a.tweet.url}`);
      sections.push("");
    }
  }

  // Raw tweets by account
  if (recentTweets.length > 0) {
    sections.push("## RAW TWEETS BY ACCOUNT (last 24h)");
    for (const batch of recentTweets) {
      sections.push(`### @${batch.account} — ${batch.tweets.length} tweet(s)`);
      for (const t of batch.tweets.slice(0, 10)) {
        sections.push(`- "${t.text.slice(0, 250)}"`);
        sections.push(`  ${t.metrics.likes}L ${t.metrics.retweets}RT ${t.metrics.views}V | ${t.createdAt}`);
      }
      sections.push("");
    }
  }

  // Account roster for context
  sections.push("## MONITORED ACCOUNTS");
  for (const a of ALL_ACCOUNTS) {
    sections.push(`- @${a.handle} — ${a.name} (${a.role}, ${a.org}) [${a.tier}]`);
  }

  return sections.join("\n");
}

const SYSTEM_PROMPT = `You are the chief intelligence analyst for Agent Zero — a war room operation competing in the pump.fun "Build in Public" hackathon.

Our project: pump.studio — a post-launch control room for pump.fun tokens. Infrastructure play, not a consumer product.

Hackathon details:
- $3M total, 12 winners x $250K investment at $10M valuation
- Deadline: Feb 25, 2026 23:59 EST
- No judges — market momentum is the primary signal
- Winners are selected by pump.fun team based on public traction, advisor engagement, and build-in-public activity
- First winner (zauth) won for AI agent trust infrastructure — signals pump.fun values infra over consumer

Your job: Digest raw X monitoring data and produce a strategic intelligence brief. Focus on:
1. THREAT DETECTION — winner announcements, new strong competitors, negative signals
2. OPPORTUNITY MAPPING — advisor engagement patterns, what topics get traction, gaps we can exploit
3. SENTIMENT ANALYSIS — how the ecosystem is talking about the hackathon, pump.fun, and our space
4. ACTIONABLE DIRECTIVES — specific things our team should do in the next 12-24 hours
5. ADVISOR TARGETING — which advisors are most active/engaged and how to get their attention

Write in direct military briefing style. No fluff. Every sentence should be actionable or critical context.
Structure your brief with clear headers and bullet points.
End with a "PRIORITY ACTIONS" section — max 5 items, ranked by urgency.`;

// Generate a daily strategic brief
async function generateDailyBrief(client: OpenRouterClient, alerts: IntelAlert[], tweets: MonitorResult[]): Promise<string> {
  const context = buildIntelContext(alerts, tweets);

  const deadline = new Date("2026-02-25T23:59:00-05:00");
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));

  const userPrompt = `Generate the daily strategic intelligence brief.

CURRENT STATUS:
- Days until deadline: ${daysLeft}
- Date: ${new Date().toISOString().slice(0, 10)}
- Alerts in last 24h: ${alerts.filter((a) => a.detectedAt > new Date(Date.now() - 86400000).toISOString()).length}
- Accounts monitored: ${ALL_ACCOUNTS.length}

RAW INTEL DATA:
${context}

Produce the brief now. Title it "AGENT ZERO — STRATEGIC BRIEF" with today's date.`;

  const response = await client.chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);

  return response.content;
}

// Generate a critical alert brief — triggered immediately when high-severity signals fire
async function generateCriticalBrief(client: OpenRouterClient, alert: IntelAlert): Promise<string> {
  const userPrompt = `CRITICAL ALERT — immediate analysis required.

Type: ${alert.type}
Severity: ${alert.severity}
Source: ${alert.source}
Tweet: "${alert.tweet.text}"
Engagement: ${alert.tweet.metrics.likes}L ${alert.tweet.metrics.retweets}RT ${alert.tweet.metrics.views}V
URL: ${alert.tweet.url}
Detected: ${alert.detectedAt}

Analyze this signal. What does it mean for pump.studio? What should we do immediately?
Keep it under 500 words. Be decisive.`;

  const response = await client.chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ], 0.2);

  return response.content;
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    fail("OPENROUTER_API_KEY not set. Add it to .env or pass as environment variable.");
    process.exit(1);
  }

  const mode = process.argv.includes("--critical") ? "critical" : "daily";
  const client = new OpenRouterClient(apiKey);

  banner("AGENT ZERO — AI ANALYST");
  info(`Mode: ${mode}`);
  info(`Started at ${timestamp()}`);
  divider();

  const alerts = loadJSON<IntelAlert[]>(ALERTS_FILE, []);
  const tweets = loadJSON<MonitorResult[]>(TWEETS_FILE, []);
  info(`Loaded ${alerts.length} alerts, ${tweets.length} tweet batches`);

  mkdirSync(INTEL_DIR, { recursive: true });

  if (mode === "daily") {
    logStep("ANALYST", "Generating daily strategic brief...");
    const brief = await generateDailyBrief(client, alerts, tweets);

    const date = new Date().toISOString().slice(0, 10);
    const filename = `brief-${date}.md`;
    const filepath = join(INTEL_DIR, filename);

    writeFileSync(filepath, brief);
    success(`Brief written to ${filepath}`);

    // Also write to GitHub Actions summary
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      writeFileSync(summaryPath, brief, { flag: "a" });
      success("Brief appended to GitHub Actions summary");
    }

    divider();
    console.log(brief);
  }

  if (mode === "critical") {
    // Process unhandled critical alerts from last hour
    const lastHour = new Date(Date.now() - 3600000).toISOString();
    const criticals = alerts.filter(
      (a) => (a.severity === "critical" || a.severity === "high") && a.detectedAt > lastHour
    );

    if (criticals.length === 0) {
      info("No critical alerts in the last hour.");
      return;
    }

    for (const a of criticals) {
      logStep("CRITICAL", `Analyzing: ${a.type} from ${a.source}`);
      const brief = await generateCriticalBrief(client, a);

      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `critical-${ts}.md`;
      const filepath = join(INTEL_DIR, filename);

      writeFileSync(filepath, brief);
      success(`Critical brief: ${filepath}`);

      divider();
      console.log(brief);
    }
  }

  success("Analyst complete.");
}

main().catch((err) => {
  fail(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
