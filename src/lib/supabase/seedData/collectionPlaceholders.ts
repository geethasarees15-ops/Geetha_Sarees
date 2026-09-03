/** Geetha Sarees catalog fallbacks — keys under Geetha R2 (see scripts/seed-geetha-catalog-images.mjs). */
export const GEETHA_CATALOG_BASE = "catalog";

export const SAREE_SHOP_MODEL_IMAGES = [
  `${GEETHA_CATALOG_BASE}/silk-sarees.webp`,
  `${GEETHA_CATALOG_BASE}/cotton-sarees.webp`,
  `${GEETHA_CATALOG_BASE}/kanchi-sarees.webp`,
  `${GEETHA_CATALOG_BASE}/designer-sarees.webp`,
] as const;

/** Best-fit Tamil Nadu pattu / model photo per Geetha Sarees category label */
const COLLECTION_IMAGE_BY_LABEL: Record<string, string> = {
  "Softie Sarees": SAREE_SHOP_MODEL_IMAGES[3],
  "Kanjivaram Wedding Sarees": SAREE_SHOP_MODEL_IMAGES[0],
  "Soft Silk Sarees": SAREE_SHOP_MODEL_IMAGES[0],
  "Banaras Tissue Silk Sarees": SAREE_SHOP_MODEL_IMAGES[0],
  "Traditional Silk Sarees": SAREE_SHOP_MODEL_IMAGES[0],
  "Kubera Pattu Sarees": SAREE_SHOP_MODEL_IMAGES[2],
  "Wedding Collections": SAREE_SHOP_MODEL_IMAGES[2],
  "Cotton Sarees": SAREE_SHOP_MODEL_IMAGES[1],
  "Silk Cotton Sarees": SAREE_SHOP_MODEL_IMAGES[1],
  "Silk Sarees": SAREE_SHOP_MODEL_IMAGES[0],
  "Kanchi Sarees": SAREE_SHOP_MODEL_IMAGES[2],
  "Designer Sarees": SAREE_SHOP_MODEL_IMAGES[3],
  "Fancy Silk Sarees": SAREE_SHOP_MODEL_IMAGES[3],
  "Mysore Silk": SAREE_SHOP_MODEL_IMAGES[0],
  "Space Silk Saree": SAREE_SHOP_MODEL_IMAGES[0],
  "Fancy Sarees": SAREE_SHOP_MODEL_IMAGES[3],
  "Celebrity Inspired Saree": SAREE_SHOP_MODEL_IMAGES[3],
};

export const COLLECTION_PLACEHOLDER_IMAGES = [...SAREE_SHOP_MODEL_IMAGES];

export function collectionPlaceholderImage(index: number): string {
  const list = SAREE_SHOP_MODEL_IMAGES;
  const key = list[index % list.length] ?? list[0];
  return key;
}

/** Category-aware image — real Tamil Nadu saree model / pattu photography */
export function collectionImageForLabel(label: string, index = 0): string {
  return COLLECTION_IMAGE_BY_LABEL[label] ?? collectionPlaceholderImage(index);
}

export const DEFAULT_SAREE_PLACEHOLDER = COLLECTION_PLACEHOLDER_IMAGES[0];

/** Default hero banner images — one real model photo per slide theme */
export const HERO_BANNER_IMAGES = {
  festiveSilk: SAREE_SHOP_MODEL_IMAGES[0],
  summerWeaves: SAREE_SHOP_MODEL_IMAGES[1],
  weddingEdit: SAREE_SHOP_MODEL_IMAGES[2],
  dailyElegance: SAREE_SHOP_MODEL_IMAGES[3],
} as const;

export function heroBannerImage(key: keyof typeof HERO_BANNER_IMAGES): string {
  return HERO_BANNER_IMAGES[key];
}
