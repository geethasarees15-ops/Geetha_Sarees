import { revalidatePath } from "next/cache";

/**
 * Narrow path revalidation after product mutations.
 *
 * Storefront list/data freshness comes from `invalidateStorefrontCache()`
 * (revalidateTag + Redis). Broad `revalidatePath("/shop")` on every save
 * caused excess ISR Writes on Vercel — keep paths minimal.
 */
export function revalidateAfterProductMutation(options?: {
  /** Product detail page only — avoid busting the whole /shop listing. */
  slug?: string | null;
}) {
  try {
    revalidatePath("/admin/products");
    const slug = options?.slug?.trim();
    if (slug) {
      revalidatePath(`/shop/${slug}`);
    }
  } catch (error) {
    console.error("[cache] product path revalidate failed:", error);
  }
}

/** Delete / archive / bulk catalog changes — admin UI only; tags cover storefront. */
export function revalidateAfterCatalogBulkChange() {
  try {
    revalidatePath("/admin/products");
  } catch (error) {
    console.error("[cache] catalog bulk path revalidate failed:", error);
  }
}
