import db from "@/lib/supabase/db";
import { collections, medias, products } from "@/lib/supabase/schema";
import { and, eq, isNotNull } from "drizzle-orm";

/** Published products assigned to an existing category (excludes drafts and uncategorized). */
export function categorizedPublishedProductConditions() {
  return and(eq(products.isDraft, false), isNotNull(products.collectionId));
}

export type CategorizedProductPriceRow = {
  id: string;
  price: string;
  discountEnabled: boolean;
  discountPercent: number | null;
  featured: boolean | null;
  mediaKey: string | null;
  mediaAlt: string | null;
};

/** Load published, categorized products for storefront price grouping. */
export async function loadCategorizedProductsForPricing(): Promise<
  CategorizedProductPriceRow[]
> {
  return db
    .select({
      id: products.id,
      price: products.price,
      discountEnabled: products.discountEnabled,
      discountPercent: products.discountPercent,
      featured: products.featured,
      mediaKey: medias.key,
      mediaAlt: medias.alt,
    })
    .from(products)
    .innerJoin(collections, eq(products.collectionId, collections.id))
    .leftJoin(medias, eq(products.featuredImageId, medias.id))
    .where(categorizedPublishedProductConditions());
}
