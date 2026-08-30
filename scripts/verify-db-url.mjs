import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

const {
  resolveDatabaseUrl,
  describeDatabaseUrl,
  TRANSACTION_POOLER_PORT,
  SESSION_POOLER_PORT,
} = await import("../src/lib/supabase/resolve-database-url.ts");

const legacy =
  "postgresql://postgres:xxx@db.cpqcndouxlqutlmvowiy.supabase.co:5432/postgres";
const rewritten = resolveDatabaseUrl(legacy);
const legacyHost = new URL(rewritten.replace(/^postgresql:/i, "http:")).host;
console.log("legacy rewrite host:", legacyHost);
console.log(
  "legacy uses transaction port:",
  legacyHost.includes(`:${TRANSACTION_POOLER_PORT}`),
);

const sessionSample =
  "postgresql://postgres.cpqcndouxlqutlmvowiy:xxx@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
process.env.SUPABASE_DB_FORCE_TRANSACTION_POOLER = "true";
const normalizedSession = resolveDatabaseUrl(sessionSample);
const sessionHost = new URL(
  normalizedSession.replace(/^postgresql:/i, "http:"),
).host;
console.log("session→transaction host:", sessionHost);
console.log(
  "session rewrite ok:",
  sessionHost.endsWith(`:${TRANSACTION_POOLER_PORT}`),
);

const url = resolveDatabaseUrl(process.env.DATABASE_URL);
const info = describeDatabaseUrl(process.env.DATABASE_URL);
console.log("live resolved:", {
  host: info.host,
  port: info.port,
  pooler: info.pooler,
  rewrites: info.rewrites,
  expectedPort: String(TRANSACTION_POOLER_PORT),
  notSessionPort: info.port !== String(SESSION_POOLER_PORT),
});

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });
const [row] = await sql`select 1 as ok`;
console.log("connected:", row);
await sql.end();
