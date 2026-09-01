import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.resolve(root, process.argv[2] ?? "");

if (!migrationPath || !fs.existsSync(migrationPath)) {
  console.error("Usage: node scripts/run-migration-once.mjs <path-to.sql>");
  process.exit(1);
}

function parseEnv(file) {
  const vars = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    vars[t.slice(0, i)] = t.slice(i + 1);
  }
  return vars;
}

const { DATABASE_URL } = parseEnv(path.join(root, ".env.local"));
const directUrl =
  process.env.DIRECT_DATABASE_URL?.trim() ||
  (DATABASE_URL
    ? DATABASE_URL.replace(
        /@aws-0-ap-south-1\.pooler\.supabase\.com:5432\/postgres/,
        "@db.cpqcndouxlqutlmvowiy.supabase.co:5432/postgres",
      ).replace("postgres.cpqcndouxlqutlmvowiy@", "postgres@")
    : "");

const candidates = [
  { label: "direct", url: directUrl },
  {
    label: "transaction-pooler",
    url: DATABASE_URL?.replace(":5432/", ":6543/"),
  },
  { label: "session-pooler", url: DATABASE_URL },
].filter((entry) => entry.url);

if (!candidates.length) {
  console.error("DATABASE_URL missing in .env.local");
  process.exit(1);
}

let sql;
let connectedVia = null;
let lastError = null;

for (const candidate of candidates) {
  const client = postgres(candidate.url, {
    max: 1,
    ssl: "require",
    prepare: false,
    connect_timeout: 25,
  });
  try {
    await client`select 1 as ok`;
    sql = client;
    connectedVia = candidate.label;
    break;
  } catch (error) {
    lastError = error;
    await client.end({ timeout: 1 }).catch(() => undefined);
  }
}

if (!sql) {
  console.error(
    "Could not connect to Supabase Postgres:",
    lastError instanceof Error ? lastError.message : lastError,
  );
  process.exit(1);
}

console.log(`Connected via ${connectedVia}`);

try {
  await sql.file(migrationPath);
  const [check] = await sql`
    select
      to_regclass('public.payment_webhook_events') as table_name,
      (
        select count(*)::int
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'payment_webhook_events'
      ) as column_count,
      (
        select count(*)::int
        from pg_indexes
        where schemaname = 'public'
          and tablename = 'payment_webhook_events'
      ) as index_count
  `;
  console.log(
    JSON.stringify(
      { ok: true, connectedVia, migration: path.basename(migrationPath), ...check },
      null,
      2,
    ),
  );
} finally {
  await sql.end();
}
