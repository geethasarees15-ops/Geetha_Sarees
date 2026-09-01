import type { InsertProducts } from "@/lib/supabase/schema";
import { normalizeDiscountPercent } from "@/lib/products/discount";

const BADGE_VALUES = new Set(["new_product", "best_sale", "featured"]);

function normalizeDecimalField(raw: unknown, fallback: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return fallback;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return fallback;
  return trimmed;
}

export function normalizeProductFormPayload(
  data: InsertProducts,
  options?: { stockFallback?: number },
): InsertProducts {
  const stockRaw = Number(data.stock);
  const stock = Number.isFinite(stockRaw)
    ? Math.max(0, Math.round(stockRaw))
    : Math.max(0, Math.round(options?.stockFallback ?? 0));

  const badgeRaw = data.badge == null ? null : String(data.badge).trim();
  const badge =
    badgeRaw && BADGE_VALUES.has(badgeRaw)
      ? (badgeRaw as InsertProducts["badge"])
      : null;

  return {
    ...data,
    name: String(data.name ?? "").trim(),
    slug: String(data.slug ?? "").trim(),
    description: String(data.description ?? ""),
    rating: normalizeDecimalField(data.rating, "4"),
    price: normalizeDecimalField(data.price, "0"),
    isDraft: Boolean(data.isDraft),
    featured: Boolean(data.featured),
    badge,
    stock,
    tags: [],
    collectionId: data.collectionId || null,
    discountEnabled: Boolean(data.discountEnabled),
    discountPercent: data.discountEnabled
      ? normalizeDiscountPercent(data.discountPercent)
      : null,
  };
}

export function productStorefrontVisibilitySummary(product: {
  featured?: boolean | null;
  isDraft?: boolean | null;
}) {
  const featured = Boolean(product.featured);
  const isDraft = Boolean(product.isDraft);

  if (isDraft) {
    return "Saved as draft — hidden from the website.";
  }
  if (featured) {
    return "Saved and live — shown in Featured on the homepage and /featured.";
  }
  return "Saved and live — visible in Shop and Collections.";
}
