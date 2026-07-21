import db from "@/lib/supabase/db";
import { apiSettings } from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import {
  buildBulkDraftIdempotencyStorageKey,
  buildDirectUploadIdempotencyStorageKey,
} from "./bulk-draft-idempotency-keys";

export type BulkDraftIdempotentPayload = {
  message: string;
  created: {
    id: string;
    productCode: string;
    name: string;
    slug: string;
  }[];
  errors: string[];
  status: number;
};

export type DirectUploadIdempotentPayload = {
  mediaId: string;
  fileName: string;
};

export {
  BULK_DRAFT_IDEM_PREFIX,
  DIRECT_UPLOAD_IDEM_PREFIX,
  buildBulkDraftIdempotencyStorageKey,
  buildDirectUploadIdempotencyStorageKey,
} from "./bulk-draft-idempotency-keys";

export async function getBulkDraftIdempotentResponse(
  rawKey: string,
): Promise<BulkDraftIdempotentPayload | null> {
  const storageKey = buildBulkDraftIdempotencyStorageKey(rawKey);
  if (!storageKey) return null;

  const row = await db.query.apiSettings.findFirst({
    where: eq(apiSettings.key, storageKey),
  });
  if (!row?.value || typeof row.value !== "object") return null;

  const value = row.value as Partial<BulkDraftIdempotentPayload>;
  if (!Array.isArray(value.created) || typeof value.status !== "number") {
    return null;
  }

  return {
    message: typeof value.message === "string" ? value.message : "",
    created: value.created as BulkDraftIdempotentPayload["created"],
    errors: Array.isArray(value.errors)
      ? value.errors.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : [],
    status: value.status,
  };
}

export async function saveBulkDraftIdempotentResponse(
  rawKey: string,
  payload: BulkDraftIdempotentPayload,
): Promise<void> {
  const storageKey = buildBulkDraftIdempotencyStorageKey(rawKey);
  if (!storageKey) return;

  const nowIso = new Date().toISOString();
  await db
    .insert(apiSettings)
    .values({
      key: storageKey,
      value: payload,
      isEnabled: true,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: apiSettings.key,
      set: {
        value: payload,
        updatedAt: nowIso,
      },
    });
}

export async function getDirectUploadIdempotentResponse(
  rawKey: string,
): Promise<DirectUploadIdempotentPayload | null> {
  const storageKey = buildDirectUploadIdempotencyStorageKey(rawKey);
  if (!storageKey) return null;

  const row = await db.query.apiSettings.findFirst({
    where: eq(apiSettings.key, storageKey),
  });
  if (!row?.value || typeof row.value !== "object") return null;

  const value = row.value as Partial<DirectUploadIdempotentPayload>;
  if (
    typeof value.mediaId !== "string" ||
    !value.mediaId.trim() ||
    typeof value.fileName !== "string"
  ) {
    return null;
  }

  return {
    mediaId: value.mediaId,
    fileName: value.fileName,
  };
}

export async function saveDirectUploadIdempotentResponse(
  rawKey: string,
  payload: DirectUploadIdempotentPayload,
): Promise<void> {
  const storageKey = buildDirectUploadIdempotencyStorageKey(rawKey);
  if (!storageKey) return;

  const nowIso = new Date().toISOString();
  await db
    .insert(apiSettings)
    .values({
      key: storageKey,
      value: payload,
      isEnabled: true,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: apiSettings.key,
      set: {
        value: payload,
        updatedAt: nowIso,
      },
    });
}
