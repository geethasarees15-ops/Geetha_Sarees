import { nanoid } from "nanoid";
import { env } from "@/env.mjs";
import { putObject } from "@/lib/s3";
import { isR2MediaConfigured } from "@/lib/storage/media-backend";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/utils";

export async function ensureMediaBucket() {
  // Staging + fallback uploads still use Supabase Storage until R2 is live.
  const supabase = createServiceRoleClient();
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (buckets?.some((b) => b.name === SUPABASE_MEDIA_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(SUPABASE_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
  });
  if (error && !error.message.includes("already exists")) throw error;
}

async function uploadMediaToSupabaseStorage(
  buffer: Buffer,
  contentType: string,
  extension: string,
  namePrefix: string,
): Promise<string> {
  await ensureMediaBucket();

  const storagePath = `sakthi/${namePrefix}-${nanoid()}.${extension}`;
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;
  return storagePath;
}

export async function uploadMediaToR2(
  buffer: Buffer,
  contentType: string,
  extension: string,
  namePrefix = "upload",
): Promise<string> {
  const key = `uploads/${namePrefix}-${nanoid()}.${extension}`;

  await putObject({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  return key;
}

/**
 * Final media write path:
 * - R2 when S3_ENDPOINT + CDN + real keys are set
 * - otherwise Supabase Storage (current / empty-shop default)
 */
export async function uploadMediaToSupabase(
  buffer: Buffer,
  contentType: string,
  extension: string,
  namePrefix = "upload",
): Promise<string> {
  if (isR2MediaConfigured()) {
    return uploadMediaToR2(buffer, contentType, extension, namePrefix);
  }
  return uploadMediaToSupabaseStorage(
    buffer,
    contentType,
    extension,
    namePrefix,
  );
}
