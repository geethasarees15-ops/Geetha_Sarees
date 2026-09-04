/**
 * Push .env.local to Vercel via REST API (Geetha team only).
 * Requires VERCEL_TOKEN (Account Settings → Tokens) in env or Geetha-Sarees-IDs.txt.
 *
 * Run: node scripts/push-vercel-env-api.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEAM_ID = "team_LB4nYuqRF3J4bWptxgnlR8NW";
/** Both projects import the same GitHub repo — env must match on each. */
const PROJECTS = ["geethasarees", "geetha-sarees"];
const DEPLOY_PROJECT = "geethasarees";

function loadToken() {
  if (process.env.VERCEL_TOKEN?.trim()) return process.env.VERCEL_TOKEN.trim();
  const idsPath = resolve(root, "Geetha-Sarees-IDs.txt");
  try {
    const text = readFileSync(idsPath, "utf8");
    const m = text.match(/^VERCEL_TOKEN:\s*(.+)$/m);
    if (m?.[1]?.trim()) return m[1].trim();
  } catch {
    /* optional */
  }
  throw new Error(
    "VERCEL_TOKEN missing. Add to Geetha-Sarees-IDs.txt as VERCEL_TOKEN: ... or set env VERCEL_TOKEN.",
  );
}

function loadVars() {
  const envPath = resolve(root, ".env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  const vars = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    const value = t.slice(eq + 1).trim();
    if (key) vars[key] = value;
  }
  vars.NEXT_PUBLIC_SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://geethasarees.com";
  vars.SKIP_ENV_VALIDATION = "true";
  if (!vars.S3_ACCESS_KEY_ID) vars.S3_ACCESS_KEY_ID = "unused-proxy-only";
  if (!vars.S3_SECRET_ACCESS_KEY) vars.S3_SECRET_ACCESS_KEY = "unused-proxy-only";
  return vars;
}

function envBody(vars) {
  return Object.entries(vars).map(([key, value]) => ({
    key,
    value,
    type:
      key.includes("SECRET") ||
      key.includes("KEY") ||
      key.includes("ROLE") ||
      key.includes("PASSWORD")
        ? "encrypted"
        : "plain",
    target: ["production", "preview"],
  }));
}

async function pushEnv(token, project, vars) {
  const url = new URL(
    `https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/env`,
  );
  url.searchParams.set("teamId", TEAM_ID);
  url.searchParams.set("upsert", "true");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envBody(vars)),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Vercel env API failed for ${project}: ${res.status} ${JSON.stringify(json)}`,
    );
  }

  const created = json.created?.length ?? 0;
  const updated = json.updated?.length ?? 0;
  console.log(`Environment variables upserted for ${project} (+${created} ~${updated})`);
}

async function triggerDeploy(token, project) {
  const deployUrl = new URL("https://api.vercel.com/v13/deployments");
  deployUrl.searchParams.set("teamId", TEAM_ID);
  const deployRes = await fetch(deployUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: project,
      target: "production",
      gitSource: {
        type: "github",
        org: "geethasarees15-ops",
        repo: "Geetha_Sarees",
        ref: "main",
      },
    }),
  });
  const deployJson = await deployRes.json().catch(() => ({}));
  if (!deployRes.ok) {
    console.warn(`Deploy trigger failed for ${project}:`, deployRes.status, deployJson);
    return null;
  }
  console.log(`Production deploy triggered for ${project}:`, deployJson.url || deployJson.id);
  return deployJson;
}

async function main() {
  const token = loadToken();
  const vars = loadVars();

  for (const project of PROJECTS) {
    await pushEnv(token, project, vars);
  }

  if (!process.argv.includes("--no-deploy")) {
    await triggerDeploy(token, DEPLOY_PROJECT);
  } else {
    console.log("Skipped deploy (--no-deploy). Redeploy from Vercel dashboard if env changed.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
