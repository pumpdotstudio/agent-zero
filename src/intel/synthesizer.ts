// Daily intel synthesizer — reads monitor data, generates actionable report
import "dotenv/config";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { banner, info, success, alert, divider, timestamp, logStep } from "../utils/logger.js";
import type { IntelAlert, MonitorResult } from "../x-monitor/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const ALERTS_FILE = join(DATA_DIR, "alerts.json");
const TWEETS_FILE = join(DATA_DIR, "tweets.json");
const REPORT_FILE = join(DATA_DIR, "daily-report.md");

function loadJSON<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8"));
}

async function checkAPIHealth(): Promise<Record<string, number>> {
  const endpoints = [
    "https://api.pump.studio/health",
    "https://api.pump.studio/api/v1/overview",
    "https://api.pump.studio/api/v1/graduating?limit=1",
  ];

  const results: Record<string, number> = {};
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const path = new URL(url).pathname;
      results[path] = res.status;
    } catch {
      const path = new URL(url).pathname;
      results[path] = 0;
    }
  }
  return results;
}

function generateReport(alerts: IntelAlert[], tweets: MonitorResult[], apiHealth: Record<string, number>): string {
  const now = new Date().toISOString().slice(0, 10);
  const last24h = new Date(Date.now() - 86400000).toISOString();

  const recentAlerts = alerts.filter((a) => a.detectedAt > last24h);
  const criticalAlerts = recentAlerts.filter((a) => a.severity === "critical" || a.severity === "high");
  const totalNewTweets = tweets
    .filter((r) => r.fetchedAt > last24h)
    .reduce((sum, r) => sum + r.tweets.length, 0);

  const lines: string[] = [
    `# War Room Daily Report — ${now}`,
    `Generated: ${timestamp()}`,
    "",
    "## Quick Stats",
    `- **Signals (24h):** ${recentAlerts.length} (${criticalAlerts.length} high/critical)`,
    `- **Tweets tracked (24h):** ${totalNewTweets}`,
    `- **Accounts monitored:** ${new Set(tweets.map((r) => r.account)).size}`,
    "",
    "## API Health",
  ];

  for (const [path, status] of Object.entries(apiHealth)) {
    const icon = status === 200 ? "✅" : "❌";
    lines.push(`- ${icon} \`${path}\`: ${status}`);
  }

  lines.push("");

  if (criticalAlerts.length > 0) {
    lines.push("## Critical / High Alerts");
    lines.push("");
    for (const a of criticalAlerts) {
      lines.push(`### ${a.severity === "critical" ? "🚨" : "⚠️"} ${a.type}`);
      lines.push(`**Source:** @${a.source} | **Detected:** ${a.detectedAt}`);
      lines.push(`> ${a.tweet.text.slice(0, 300)}`);
      lines.push(`[View](https://x.com/${a.tweet.authorHandle}/status/${a.tweet.id})`);
      lines.push("");
    }
  }

  if (recentAlerts.length > 0) {
    lines.push("## All Signals (24h)");
    lines.push("");
    lines.push("| Time | Type | Source | Severity | Summary |");
    lines.push("|------|------|--------|----------|---------|");
    for (const a of recentAlerts.slice(0, 30)) {
      lines.push(
        `| ${a.detectedAt.slice(11, 16)} | ${a.type} | ${a.source} | ${a.severity} | ${a.summary.slice(0, 80)} |`
      );
    }
    lines.push("");
  }

  lines.push("## Hackathon Countdown");
  const deadline = new Date("2026-02-25T23:59:00-05:00");
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86400000));
  lines.push(`**${daysLeft} days remaining** until Feb 25 23:59 EST deadline`);
  lines.push("");

  return lines.join("\n");
}

async function main() {
  banner("AGENT ZERO — DAILY INTEL SYNTHESIS");

  const alerts = loadJSON<IntelAlert[]>(ALERTS_FILE, []);
  const tweets = loadJSON<MonitorResult[]>(TWEETS_FILE, []);

  info(`Loaded ${alerts.length} alerts, ${tweets.length} tweet batches`);

  logStep("API", "Checking pump.studio health...");
  const apiHealth = await checkAPIHealth();
  for (const [path, status] of Object.entries(apiHealth)) {
    if (status === 200) success(`${path}: ${status}`);
    else alert("high", `${path}: ${status}`);
  }

  logStep("REPORT", "Generating daily report...");
  const report = generateReport(alerts, tweets, apiHealth);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(REPORT_FILE, report);
  success(`Report written to ${REPORT_FILE}`);

  // Also write to GitHub Actions summary if available
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    writeFileSync(summaryPath, report, { flag: "a" });
    success("Report appended to GitHub Actions summary");
  }

  divider();
  console.log(report);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
