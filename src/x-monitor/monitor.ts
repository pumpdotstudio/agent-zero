// War Room X Monitor — tracks hackathon advisors, founders, competitors
// Detects hackathon-relevant signals and generates alerts

import "dotenv/config";
import { XClient } from "./client.js";
import { ALL_ACCOUNTS, CRITICAL_ACCOUNTS, HIGH_ACCOUNTS, ACCOUNT_MAP } from "./accounts.js";
import type { XTweet, IntelAlert, MonitorResult } from "./types.js";
import type { XAccount } from "./accounts.js";
import { banner, alert, info, success, fail, logStep, divider, timestamp } from "../utils/logger.js";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const STATE_FILE = join(DATA_DIR, "monitor-state.json");
const ALERTS_FILE = join(DATA_DIR, "alerts.json");
const TWEETS_FILE = join(DATA_DIR, "tweets.json");

// Hackathon-relevant keywords for signal detection
const SIGNAL_KEYWORDS = {
  hackathon_mention: [
    "hackathon", "build in public", "pump fund", "$250k", "$250,000",
    "$3m", "$3,000,000", "build-in-public", "bip hackathon",
  ],
  winner_announcement: [
    "winner", "selected", "investment", "congratulations", "awarded",
    "funded", "accepted", "announced",
  ],
  pump_studio_mention: [
    "pump.studio", "pump studio", "pumpdotstudio", "$studio",
    "pumpdotstudio", "pumpstudio",
  ],
  advisor_signal: [
    "excited to advise", "reviewing", "impressed by", "shipping",
    "great progress", "notable project", "standout",
  ],
  competitor_activity: [
    "zauth", "hyperscape", "$gold", "$mia", "$rain",
    "pumpcade", "monerochan", "opal ai",
  ],
};

interface MonitorState {
  lastTweetIds: Record<string, string>;
  lastRunAt: string;
  totalAlerts: number;
  totalTweetsFetched: number;
}

function loadState(): MonitorState {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  }
  return { lastTweetIds: {}, lastRunAt: "", totalAlerts: 0, totalTweetsFetched: 0 };
}

function saveState(state: MonitorState) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function appendAlerts(alerts: IntelAlert[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  const existing: IntelAlert[] = existsSync(ALERTS_FILE) ? JSON.parse(readFileSync(ALERTS_FILE, "utf-8")) : [];
  existing.push(...alerts);
  // Keep last 500 alerts
  const trimmed = existing.slice(-500);
  writeFileSync(ALERTS_FILE, JSON.stringify(trimmed, null, 2));
}

function appendTweets(results: MonitorResult[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  const existing: MonitorResult[] = existsSync(TWEETS_FILE) ? JSON.parse(readFileSync(TWEETS_FILE, "utf-8")) : [];
  existing.push(...results);
  // Keep last 200 results
  const trimmed = existing.slice(-200);
  writeFileSync(TWEETS_FILE, JSON.stringify(trimmed, null, 2));
}

// Classify a tweet against signal patterns
function classifyTweet(tweet: XTweet, account: XAccount): IntelAlert[] {
  const alerts: IntelAlert[] = [];
  const textLower = tweet.text.toLowerCase();

  for (const [signalType, keywords] of Object.entries(SIGNAL_KEYWORDS)) {
    const matched = keywords.some((kw) => textLower.includes(kw.toLowerCase()));
    if (!matched) continue;

    const severity = determineSeverity(signalType, account, tweet);

    alerts.push({
      type: signalType as IntelAlert["type"],
      severity,
      source: `@${account.handle}`,
      tweet,
      summary: buildSummary(signalType, account, tweet),
      detectedAt: new Date().toISOString(),
    });
  }

  return alerts;
}

function determineSeverity(signalType: string, account: XAccount, tweet: XTweet): IntelAlert["severity"] {
  // Winner announcements from pump.fun are always critical
  if (signalType === "winner_announcement" && account.tier === "critical") return "critical";

  // Any mention of pump.studio is high priority
  if (signalType === "pump_studio_mention") return "high";

  // Hackathon mentions from critical accounts
  if (signalType === "hackathon_mention" && account.tier === "critical") return "high";

  // High-engagement tweets about hackathon
  if (tweet.metrics.likes > 100 || tweet.metrics.retweets > 50) return "high";

  return "medium";
}

function buildSummary(signalType: string, account: XAccount, tweet: XTweet): string {
  const prefix = `${account.name} (${account.org})`;
  const engagement = `[${tweet.metrics.likes}❤ ${tweet.metrics.retweets}🔁 ${tweet.metrics.views}👁]`;

  switch (signalType) {
    case "winner_announcement":
      return `${prefix} may have announced a new hackathon winner ${engagement}`;
    case "pump_studio_mention":
      return `${prefix} mentioned pump.studio! ${engagement}`;
    case "hackathon_mention":
      return `${prefix} posted about the hackathon ${engagement}`;
    case "advisor_signal":
      return `${prefix} showing advisor engagement ${engagement}`;
    case "competitor_activity":
      return `${prefix} referenced a competing project ${engagement}`;
    default:
      return `${prefix} — signal detected ${engagement}`;
  }
}

// Rate-limit-aware polling: critical accounts first, then high, then standard
function getAccountsForCycle(cycleNumber: number): XAccount[] {
  const accounts: XAccount[] = [...CRITICAL_ACCOUNTS];

  // High accounts every cycle
  accounts.push(...HIGH_ACCOUNTS);

  // Standard accounts every 3rd cycle to save rate limits
  if (cycleNumber % 3 === 0) {
    accounts.push(...ALL_ACCOUNTS.filter((a) => a.tier === "standard"));
  }

  return accounts;
}

async function runMonitorCycle(client: XClient, cycleNumber: number): Promise<{ results: MonitorResult[]; alerts: IntelAlert[] }> {
  const state = loadState();
  const accounts = getAccountsForCycle(cycleNumber);
  const results: MonitorResult[] = [];
  const allAlerts: IntelAlert[] = [];

  logStep("CYCLE", `#${cycleNumber} — monitoring ${accounts.length} accounts`);

  for (const account of accounts) {
    try {
      const { tweets } = await client.getUserTweets(account.handle);

      if (tweets.length === 0) {
        info(`@${account.handle}: API returned 0 tweets`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      // Filter to only new tweets since last check
      const lastSeenId = state.lastTweetIds[account.handle];
      const newTweets = lastSeenId
        ? tweets.filter((t) => BigInt(t.id) > BigInt(lastSeenId))
        : tweets.slice(0, 5); // First run: take last 5

      if (newTweets.length > 0) {
        // Update last seen
        state.lastTweetIds[account.handle] = tweets[0].id;

        // Classify each tweet
        for (const tweet of newTweets) {
          const tweetAlerts = classifyTweet(tweet, account);
          allAlerts.push(...tweetAlerts);
        }

        results.push({
          account: account.handle,
          tweets: newTweets,
          fetchedAt: new Date().toISOString(),
          newSinceLastCheck: newTweets.length,
        });

        info(`@${account.handle}: ${newTweets.length} new tweet(s)`);
      } else {
        info(`@${account.handle}: no new tweets`);
      }

      // Small delay between requests to respect rate limits
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      fail(`@${account.handle}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  state.lastRunAt = new Date().toISOString();
  state.totalAlerts += allAlerts.length;
  state.totalTweetsFetched += results.reduce((sum, r) => sum + r.tweets.length, 0);
  saveState(state);

  if (results.length > 0) appendTweets(results);
  if (allAlerts.length > 0) appendAlerts(allAlerts);

  return { results, alerts: allAlerts };
}

function printAlertSummary(alerts: IntelAlert[]) {
  if (alerts.length === 0) {
    info("No signals detected this cycle.");
    return;
  }

  divider();
  banner(`${alerts.length} SIGNAL(S) DETECTED`);

  for (const a of alerts) {
    alert(a.severity, a.summary);
    info(`  Tweet: "${a.tweet.text.slice(0, 120)}..."`);
    info(`  https://x.com/${a.tweet.authorHandle}/status/${a.tweet.id}`);
    divider();
  }
}

// GitHub Actions output mode: write summary to $GITHUB_STEP_SUMMARY
function writeGitHubSummary(results: MonitorResult[], alerts: IntelAlert[]) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  const lines: string[] = [
    `## X Monitor Report — ${timestamp()}`,
    "",
    `**Accounts checked:** ${results.length}`,
    `**New tweets:** ${results.reduce((s, r) => s + r.tweets.length, 0)}`,
    `**Signals detected:** ${alerts.length}`,
    "",
  ];

  if (alerts.length > 0) {
    lines.push("### Alerts", "");
    for (const a of alerts) {
      const icon = a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "📡";
      lines.push(`${icon} **${a.type}** (${a.severity}) — ${a.summary}`);
      lines.push(`> ${a.tweet.text.slice(0, 200)}`);
      lines.push(`> [View tweet](https://x.com/${a.tweet.authorHandle}/status/${a.tweet.id})`);
      lines.push("");
    }
  }

  writeFileSync(summaryPath, lines.join("\n"), { flag: "a" });
}

// Main entry
async function main() {
  const apiKey = process.env.X_API_KEY;
  if (!apiKey) {
    fail("X_API_KEY not set. Add it to .env or pass as environment variable.");
    process.exit(1);
  }

  const client = new XClient(apiKey);
  const isLoop = process.argv.includes("--loop");
  const interval = parseInt(process.env.MONITOR_INTERVAL_MS ?? "300000", 10); // 5 min default

  banner("AGENT ZERO — WAR ROOM X MONITOR");
  info(`Mode: ${isLoop ? "continuous loop" : "single run"}`);
  info(`Tracking ${ALL_ACCOUNTS.length} accounts across ${3} tiers`);
  info(`Started at ${timestamp()}`);
  divider();

  let cycle = 0;

  do {
    cycle++;
    const { results, alerts } = await runMonitorCycle(client, cycle);
    printAlertSummary(alerts);
    writeGitHubSummary(results, alerts);

    if (isLoop) {
      info(`\nNext cycle in ${interval / 1000}s...`);
      await new Promise((r) => setTimeout(r, interval));
    }
  } while (isLoop);

  success(`Monitor complete. ${cycle} cycle(s) run.`);
}

main().catch((err) => {
  fail(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
