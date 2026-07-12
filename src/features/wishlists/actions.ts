"use server";

import { getPublishedWishlistProductsByIds } from "@/lib/storefront/wishlist-server";
import { uniqueWishlistProductIds } from "@/lib/storefront/wishlist-ids";

/** Client guest wishlist: resolve published product cards by IDs. */
export async function fetchGuestWishlistProductsAction(productIds: string[]) {
  const ids = uniqueWishlistProductIds(productIds).slice(0, 100);
  return getPublishedWishlistProductsByIds(ids);
}
