// Runs the Stripe webhook listener during `npm run dev`, scoped to this project:
// - Skipped when BILLING_ENABLED isn't "true" in frontend/.env.local.
// - Uses this project's STRIPE_SECRET_KEY (as STRIPE_API_KEY), never the
//   machine-wide `stripe login`.
// - Keeps STRIPE_WEBHOOK_SECRET in frontend/.env.local in sync with the listener's
//   signing secret (Next.js reloads .env.local automatically).
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const ENV_FILE = "frontend/.env.local";

const getListenerSecret = (apiKey) =>
  execFileSync("stripe", ["listen", "--print-secret"], {
    env: { ...process.env, STRIPE_API_KEY: apiKey },
    encoding: "utf8",
  }).trim();

const writeWebhookSecret = (secret) => {
  const content = readFileSync(ENV_FILE, "utf8");
  const line = `STRIPE_WEBHOOK_SECRET=${secret}`;
  const updated = /^STRIPE_WEBHOOK_SECRET=.*$/m.test(content)
    ? content.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, line)
    : `${content.trimEnd()}\n${line}\n`;

  writeFileSync(ENV_FILE, updated);
};

try {
  process.loadEnvFile(ENV_FILE);
} catch {
  // No .env.local: billing counts as disabled.
}

if (process.env.BILLING_ENABLED !== "true") {
  console.log(
    "Billing is disabled (BILLING_ENABLED), so the Stripe listener is skipped.",
  );
  process.exit(0);
}

const apiKey = process.env.STRIPE_SECRET_KEY;

if (!apiKey) {
  console.error(`STRIPE_SECRET_KEY is not set in ${ENV_FILE}.`);
  process.exit(1);
}

const secret = getListenerSecret(apiKey);

if (secret !== process.env.STRIPE_WEBHOOK_SECRET) {
  writeWebhookSecret(secret);
  console.log(`Updated STRIPE_WEBHOOK_SECRET in ${ENV_FILE}.`);
}

const listener = spawn("npm", ["run", "stripe:listen"], {
  env: { ...process.env, STRIPE_API_KEY: apiKey },
  stdio: "inherit",
  shell: process.platform === "win32",
});

listener.on("exit", (code) => process.exit(code ?? 0));
