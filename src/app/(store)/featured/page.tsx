import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { SearchProductsGridSkeleton } from "@/features/products";
import { FeaturedProductsScroll } from "@/features/search";
import { Suspense } from "react";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import { withFallback } from "@/lib/resilience";
import { getDraftProductIdsSafe } from "@/lib/storefront/draft-product-ids";
import { fetchFeaturedProductsCached } from "@/lib/storefront/product-queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export const metadata = buildPageMetadata({
  title: "Featured Sarees",
  description:
    "Discover handpicked featured sarees at Geetha saree's — premium styles for weddings, festivals and special occasions.",
  path: "/featured",
});

const FEATURED_PAGE_SIZE = 12;

async function FeaturedProductsPage() {
  const variables = { first: FEATURED_PAGE_SIZE, after: undefined };
  const [productsCollection, initialDraftIds] = await Promise.all([
    withFallback(
      "featured:products",
      () => fetchFeaturedProductsCached(variables),
      null,
    ),
    getDraftProductIdsSafe(),
  ]);

  return (
    <Shell>
      <Header
        heading="Featured Products"
        description="Our handpicked sarees — premium styles for festivals and weddings"
      />

      <Suspense fallback={<SearchProductsGridSkeleton />}>
        <FeaturedProductsScroll
          initialData={{ productsCollection }}
          initialDraftIds={initialDraftIds ?? undefined}
        />
      </Suspense>
    </Shell>
  );
}

export default FeaturedProductsPage;
