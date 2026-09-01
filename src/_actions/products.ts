"use server";

import db from "@/lib/supabase/db";
import { products } from "@/lib/supabase/schema";
import { requireAdminActionUser } from "@/lib/auth/require-admin";
import { invalidateStorefrontCache } from "@/lib/cache/invalidate-storefront";
import {
  buildBulkProductInsertValues,
  type NormalizedBulkDraftShared,
} from "@/lib/admin/normalize-bulk-product-shared";
import { insertProductWithoutTransaction } from "@/lib/admin/product-insert";
import {
  createProductRecord,
  updateProductRecord,
  type ProductImageOptions,
} from "@/lib/admin/save-product";
import { mapProductSaveError } from "@/lib/supabase/pooler-errors";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type { ProductImageOptions };

function revalidateProductCatalogPaths() {
  // Keep this light — broad layout revalidation after admin saves can surface
  // as a vague "Server Components" error on serverless.
  try {
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/featured");
  } catch (error) {
    console.error("[products] revalidatePath failed:", error);
  }
}

async function softInvalidateStorefrontCache() {
  try {
    await invalidateStorefrontCache();
  } catch (error) {
    console.error("[products] invalidateStorefrontCache failed:", error);
  }
}

export const createProductAction = async (
  product: Parameters<typeof createProductRecord>[0],
  options?: ProductImageOptions,
) => {
  await requireAdminActionUser();
  const created = await createProductRecord(product, options);
  revalidateProductCatalogPaths();
  void softInvalidateStorefrontCache();
  return [created];
};

export const updateProductAction = async (
  productId: string,
  product: Parameters<typeof updateProductRecord>[1],
  options?: ProductImageOptions,
) => {
  await requireAdminActionUser();
  const updated = await updateProductRecord(productId, product, options);
  revalidateProductCatalogPaths();
  void softInvalidateStorefrontCache();
  return [updated];
};

export const getProductsByIds = async (productIds: string[]) => {
  return await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));
};

type DraftSourceMedia = {
  mediaId: string;
  originalFileName: string;
};

export type BulkDraftSharedData = NormalizedBulkDraftShared;

export type BulkDraftCreateResult = {
  id: string;
  productCode: string;
  name: string;
  slug: string;
};

function getFileNameBase(fileName: string) {
  const cleaned = fileName.replace(/\.[^/.]+$/, "").trim();
  return cleaned || "Product";
}

const DEFAULT_BULK_SHARED: NormalizedBulkDraftShared = {
  baseName: "Product",
  description: "",
  isDraft: true,
  collectionId: null,
  badge: null,
  rating: "4",
  price: "0",
  stock: 0,
  discountEnabled: false,
  discountPercent: null,
};

export async function createDraftProductsFromMedia(
  mediaItems: DraftSourceMedia[],
  shared?: BulkDraftSharedData,
): Promise<BulkDraftCreateResult[]> {
  await requireAdminActionUser();
  if (mediaItems.length === 0) return [];

  const normalizedShared = shared ?? DEFAULT_BULK_SHARED;

  const uniqueMediaItems: DraftSourceMedia[] = [];
  const seenMediaIds = new Set<string>();
  for (const item of mediaItems) {
    if (seenMediaIds.has(item.mediaId)) continue;
    seenMediaIds.add(item.mediaId);
    uniqueMediaItems.push(item);
  }

  try {
    const createdProducts: BulkDraftCreateResult[] = [];

    for (const mediaItem of uniqueMediaItems) {
      const [existing] = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          productCode: products.productCode,
        })
        .from(products)
        .where(
          and(
            eq(products.featuredImageId, mediaItem.mediaId),
            isNull(products.archivedAt),
          ),
        )
        .limit(1);

      if (existing) {
        createdProducts.push({
          id: existing.id,
          name: existing.name,
          slug: existing.slug,
          productCode: existing.productCode ?? "",
        });
        continue;
      }

      const fileNameBase = getFileNameBase(mediaItem.originalFileName);
      const nameBase = (normalizedShared.baseName || fileNameBase).trim();

      const row = await insertProductWithoutTransaction(
        (productCode) => `${nameBase} ${productCode}`,
        (identity) =>
          buildBulkProductInsertValues({
            shared: normalizedShared,
            productName: identity.name,
            slug: identity.slug,
            productCode: identity.productCode,
            featuredImageId: mediaItem.mediaId,
          }),
      );

      createdProducts.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        productCode: row.productCode ?? "",
      });
    }

    revalidateProductCatalogPaths();
    await invalidateStorefrontCache();
    return createdProducts;
  } catch (error) {
    throw mapProductSaveError(error);
  }
}
