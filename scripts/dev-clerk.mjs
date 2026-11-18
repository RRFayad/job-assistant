// Runs Clerk's webhook tunnel during `npm run dev`, scoped to this project:
// - Uses this project's relay token (CLERK_WEBHOOK_RELAY_TOKEN in frontend/.env.local),
//   so its inbox URL never changes. No ngrok, no Clerk login.
// - Generates and saves the token on the first run.
// - Forwards deliveries to FORWARD_TO: change it if the webhook route moves.
//   The relay ignores extra URL paths, so the full route belongs here.
//
// `--print-url` (npm run clerk:webhook-url) only prints the relay URL, creating
// the token if needed, so Clerk can be configured before the first dev run.
import { execFileSync, spawn } from "node:child_process";
import { appendFileSync } from "node:fs";

const ENV_FILE = "frontend/.env.local";
const CLERK_CLI = "node_modules/.bin/clerk";
const FORWARD_TO = "http://localhost:3000/api/webhooks/clerk";

const createRelayToken = () => {
  const output = execFileSync(CLERK_CLI, ["webhooks", "token", "--json"], {
    encoding: "utf8",
  });

  return JSON.parse(output).token;
};

const getRelayUrl = (token) => `https://webhooks.clerk.com/in/${token}/`;

try {
  process.loadEnvFile(ENV_FILE);
} catch {
  // No .env.local yet: a token is created and saved below.
}

let token = process.env.CLERK_WEBHOOK_RELAY_TOKEN;

if (!token) {
  token = createRelayToken();
  appendFileSync(ENV_FILE, `\nCLERK_WEBHOOK_RELAY_TOKEN=${token}\n`);
  console.log(`Created CLERK_WEBHOOK_RELAY_TOKEN in ${ENV_FILE}.`);
}

if (process.argv.includes("--print-url")) {
  console.log(`Clerk webhook endpoint URL: ${getRelayUrl(token)}`);
  process.exit(0);
}

console.log(`Clerk webhook relay: ${getRelayUrl(token)} → ${FORWARD_TO}`);

const listener = spawn(
  CLERK_CLI,
  ["webhooks", "listen", "--token", token, "--forward-to", FORWARD_TO],
  { stdio: "inherit", shell: process.platform === "win32" },
);

listener.on("exit", (code) => process.exit(code ?? 0));
