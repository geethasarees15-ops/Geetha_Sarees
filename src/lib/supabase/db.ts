import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env.mjs";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "./resolve-database-url";

const connectionString = resolveDatabaseUrl(env.DATABASE_URL);

if (!connectionString) {
  console.log("🔴 no database URL");
}

/** Serverless: one connection per instance; transaction pooler (6543) handles concurrency. */
const isServerless = process.env.VERCEL === "1";

const client = postgres(connectionString, {
  prepare: false,
  max: isServerless ? 1 : 3,
  idle_timeout: 20,
  connect_timeout: 15,
});

const db = drizzle(client, { schema });

export default db;
