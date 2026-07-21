import {
  buildBulkDraftIdempotencyStorageKey,
  buildDirectUploadIdempotencyStorageKey,
  BULK_DRAFT_IDEM_PREFIX,
  DIRECT_UPLOAD_IDEM_PREFIX,
} from "./bulk-draft-idempotency-keys";

describe("bulk-draft-idempotency keys", () => {
  it("accepts stable client keys", () => {
    expect(buildBulkDraftIdempotencyStorageKey("abc12345")).toBe(
      `${BULK_DRAFT_IDEM_PREFIX}abc12345`,
    );
    expect(buildDirectUploadIdempotencyStorageKey("upload_key_01")).toBe(
      `${DIRECT_UPLOAD_IDEM_PREFIX}upload_key_01`,
    );
  });

  it("rejects empty or unsafe keys", () => {
    expect(buildBulkDraftIdempotencyStorageKey("")).toBeNull();
    expect(buildBulkDraftIdempotencyStorageKey("short")).toBeNull();
    expect(buildBulkDraftIdempotencyStorageKey("bad key!")).toBeNull();
    expect(buildDirectUploadIdempotencyStorageKey("../hack")).toBeNull();
  });
});
