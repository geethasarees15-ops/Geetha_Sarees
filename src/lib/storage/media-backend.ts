import { env } from "@/env.mjs";

/**
 * R2 is active only when real endpoint + CDN + non-placeholder credentials exist.
 * Until then, SSR Tex keeps writing to Supabase Storage (empty-shop safe).
 */
export function isR2MediaConfigured(): boolean {
  const endpoint = String(env.S3_ENDPOINT ?? "").trim();
  const cdn = String(env.NEXT_PUBLIC_CDN_URL ?? "").trim();
  const accessKey = String(env.S3_ACCESS_KEY_ID ?? "").trim();
  const secretKey = String(env.S3_SECRET_ACCESS_KEY ?? "").trim();
  const bucket = String(env.NEXT_PUBLIC_S3_BUCKET ?? "").trim();

  if (!endpoint || !cdn || !accessKey || !secretKey || !bucket) return false;
  if (accessKey === "placeholder" || secretKey === "placeholder") return false;
  if (bucket === "placeholder") return false;
  return true;
}
