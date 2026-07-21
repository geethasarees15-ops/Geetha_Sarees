export const BULK_DRAFT_IDEM_PREFIX = "bulk_draft_idem_";
export const DIRECT_UPLOAD_IDEM_PREFIX = "direct_upload_idem_";

function normalizeKey(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 128) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function buildBulkDraftIdempotencyStorageKey(
  raw: string,
): string | null {
  const key = normalizeKey(raw);
  return key ? `${BULK_DRAFT_IDEM_PREFIX}${key}` : null;
}

export function buildDirectUploadIdempotencyStorageKey(
  raw: string,
): string | null {
  const key = normalizeKey(raw);
  return key ? `${DIRECT_UPLOAD_IDEM_PREFIX}${key}` : null;
}
