import db from "@/lib/supabase/db";
import { medias, products } from "@/lib/supabase/schema";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";
import { eq } from "drizzle-orm";
import {
  buildShopByPriceBuckets,
  type ShopByPriceBucket,
} from "./shop-by-price-buckets";

async function loadShopByPriceBuckets(): Promise<ShopByPriceBucket[]> {
  const rows = await db
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
    .leftJoin(medias, eq(products.featuredImageId, medias.id))
    .where(eq(products.isDraft, false));

  return buildShopByPriceBuckets(rows);
}

export async function getShopByPriceBucketsCached(): Promise<
  ShopByPriceBucket[]
> {
  return withStorefrontCache("sf:shop-by-price", loadShopByPriceBuckets, {
    revalidate: 300,
    tags: [CACHE_TAGS.products],
  });
}
