import { logServerError } from "@/lib/api/public-error";
import { env } from "@/env.mjs";
import { deleteObjects } from "@/lib/s3";

/** Best-effort delete of R2 objects (never throws). No Supabase Storage writes. */
export async function deleteMediaStorageKeys(keys: string[]) {
  const uniqueKeys = [
    ...new Set(keys.map((key) => key.trim()).filter(Boolean)),
  ];
  if (uniqueKeys.length === 0) return;

  const r2Keys: string[] = [];
  const cdnBase = env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "") || "";

  for (const raw of uniqueKeys) {
    if (!raw) continue;

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      if (cdnBase && raw.startsWith(`${cdnBase}/`)) {
        const extracted = raw.slice(`${cdnBase}/`.length);
        if (extracted) r2Keys.push(extracted);
      }
      continue;
    }

    // Legacy sakthi/ objects were never on R2 — skip (no Supabase Storage API).
    if (raw.startsWith("sakthi/")) continue;

    r2Keys.push(raw);
  }

  if (r2Keys.length === 0) return;

  try {
    await deleteObjects({ keys: r2Keys });
  } catch (error) {
    logServerError("deleteMediaStorageKeys/r2", error);
  }
}
