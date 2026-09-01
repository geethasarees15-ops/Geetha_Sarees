import { publicErrorMessage } from "@/lib/api/public-error";
import {
  getDirectUploadIdempotentResponse,
  saveDirectUploadIdempotentResponse,
} from "@/lib/admin/bulk-draft-idempotency";
import { invalidateAdminMediaCache } from "@/lib/admin/media-library";
import { invalidateStorefrontCache } from "@/lib/cache/invalidate-storefront";
import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import {
  finalizeDirectUpload,
  type DirectUploadPurpose,
} from "@/lib/storage/directUpload";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const completeSchema = z.object({
  storagePath: z.string().trim().min(1),
  fileName: z.string().trim().min(1).max(255),
  purpose: z.enum(["upload", "product-draft"]).default("upload"),
  clientUploadKey: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const isAdmin = await isAdminUser(user);
    if (!user || !isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = completeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid upload complete payload." },
        { status: 400 },
      );
    }

    if (parsed.data.clientUploadKey) {
      const cached = await getDirectUploadIdempotentResponse(
        parsed.data.clientUploadKey,
      );
      if (cached) {
        return NextResponse.json(
          { ...cached, idempotent: true as const },
          { status: 200 },
        );
      }
    }

    const result = await finalizeDirectUpload({
      storagePath: parsed.data.storagePath,
      originalFileName: parsed.data.fileName,
      purpose: parsed.data.purpose as DirectUploadPurpose,
    });

    if (parsed.data.clientUploadKey) {
      await saveDirectUploadIdempotentResponse(parsed.data.clientUploadKey, {
        mediaId: result.mediaId,
        fileName: result.fileName,
      });
    }

    invalidateAdminMediaCache();
    if (parsed.data.purpose === "product-draft") {
      await invalidateStorefrontCache();
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[direct-upload/complete] failed:", error);
    return NextResponse.json(
      {
        message: publicErrorMessage(error, "Could not finalize upload."),
      },
      { status: 400 },
    );
  }
}
