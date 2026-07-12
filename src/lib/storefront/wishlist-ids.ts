/** Pure wishlist id helpers — kept separate for unit tests without DB. */

export function uniqueWishlistProductIds(productIds: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of productIds) {
    const trimmed = String(id ?? "").trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Keep preferred order; drop ids not in `availableIds`. */
export function orderWishlistProductIds(
  preferredOrder: string[],
  availableIds: string[],
): string[] {
  const available = new Set(availableIds);
  return uniqueWishlistProductIds(preferredOrder).filter((id) =>
    available.has(id),
  );
}
