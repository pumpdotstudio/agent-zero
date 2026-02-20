// Colored terminal output for war room operations

const c = {
  green: "\x1b[38;2;34;197;94m",
  red: "\x1b[38;2;239;68;68m",
  yellow: "\x1b[38;2;234;179;8m",
  cyan: "\x1b[38;2;34;211;238m",
  magenta: "\x1b[38;2;168;85;247m",
  gray: "\x1b[38;2;113;113;122m",
  white: "\x1b[38;2;237;237;237m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

export function banner(text: string) {
  console.log(`\n${c.bold}${c.cyan}${"═".repeat(60)}${c.reset}`);
  console.log(`${c.bold}${c.white}  ${text}${c.reset}`);
  console.log(`${c.cyan}${"═".repeat(60)}${c.reset}\n`);
}

export function alert(severity: string, msg: string) {
  const color = severity === "critical" ? c.red : severity === "high" ? c.yellow : c.cyan;
  const icon = severity === "critical" ? "🚨" : severity === "high" ? "⚠️" : "📡";
  console.log(`${color}${icon} [${severity.toUpperCase()}]${c.reset} ${msg}`);
}

export function info(msg: string) {
  console.log(`${c.gray}  ${msg}${c.reset}`);
}

export function success(msg: string) {
  console.log(`${c.green}✓${c.reset} ${msg}`);
}

export function fail(msg: string) {
  console.log(`${c.red}✗${c.reset} ${msg}`);
}

export function logStep(label: string, detail: string) {
  console.log(`${c.cyan}●${c.reset} ${c.bold}${label}${c.reset}  ${c.gray}${detail}${c.reset}`);
}

export function divider() {
  console.log(`${c.gray}${"─".repeat(60)}${c.reset}`);
}

export function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
