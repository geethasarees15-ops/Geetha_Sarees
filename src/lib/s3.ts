import { requireAdminActionUser } from "@/lib/auth/require-admin";
import { env } from "@/env.mjs";
import { isR2MediaConfigured } from "@/lib/storage/media-backend";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 via S3-compatible API (Vercel Node).
 * No OpenNext / Workers binding required.
 */

function requireR2() {
  if (!isR2MediaConfigured()) {
    throw new Error(
      "R2 media is not configured. Set S3_ENDPOINT, NEXT_PUBLIC_CDN_URL, NEXT_PUBLIC_S3_BUCKET, and real S3 access keys.",
    );
  }
}

function getR2Client() {
  requireR2();
  return new S3Client({
    region: env.NEXT_PUBLIC_S3_REGION || "auto",
    endpoint: env.S3_ENDPOINT!.replace(/\/$/, ""),
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export type PutObjectParams = {
  Bucket: string;
  Key: string;
  Body: Buffer | Uint8Array | string;
  ContentType?: string;
  CacheControl?: string;
};

export async function putObject(params: PutObjectParams) {
  await requireAdminActionUser();
  requireR2();

  const body =
    typeof params.Body === "string"
      ? Buffer.from(params.Body)
      : Buffer.from(params.Body);

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: params.Bucket || env.NEXT_PUBLIC_S3_BUCKET,
      Key: params.Key,
      Body: body,
      ContentType: params.ContentType,
      CacheControl: params.CacheControl,
      ContentLength: body.byteLength,
    }),
  );

  return { etag: null as string | null };
}

export async function getObjectBuffer(params: {
  key: string;
  maxBytes?: number;
}) {
  await requireAdminActionUser();
  requireR2();

  const res = await getR2Client().send(
    new GetObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET,
      Key: params.key,
    }),
  );

  const bytes = await res.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Uploaded file not found. Try uploading again.");
  }
  if (params.maxBytes && bytes.byteLength > params.maxBytes) {
    throw new Error("Image is too large after upload. Compress and retry.");
  }
  return Buffer.from(bytes);
}

export async function deleteObjects(params: { keys: string[] }) {
  await requireAdminActionUser();
  const keys = [...new Set(params.keys.map((k) => k.trim()).filter(Boolean))];
  if (keys.length === 0) return;
  requireR2();

  const client = getR2Client();
  await Promise.all(
    keys.map(async (key) => {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: env.NEXT_PUBLIC_S3_BUCKET,
            Key: key,
          }),
        );
      } catch (error) {
        const status = Number(
          (error as { $metadata?: { httpStatusCode?: number } })?.$metadata
            ?.httpStatusCode ?? 0,
        );
        if (status !== 404) throw error;
      }
    }),
  );
}

/** Legacy alias used by older admin helpers. */
export const uploadImage = async (params: PutObjectParams) => putObject(params);

export const bufferToFile = (buffer: Buffer) =>
  `data:image/webp;base64,${buffer.toString("base64")}`;
