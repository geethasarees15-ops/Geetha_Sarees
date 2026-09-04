import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchProductsGridSkeleton } from "@/features/products";
import {
  FilterSelections,
  SearchProductsInifiteScroll,
} from "@/features/search";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import { withFallback } from "@/lib/resilience";
import { getAllCollectionsCached } from "@/lib/storefront/collections-list";
import { getDraftProductIdsSafe } from "@/lib/storefront/draft-product-ids";
import {
  fetchProductSearchCached,
  type StorefrontProductSearchResult,
} from "@/lib/storefront/product-queries";
import {
  buildShopSearchVariables,
  formatShopPriceRangeHeading,
} from "@/lib/storefront/search-params";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Suspense } from "react";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export const metadata = buildPageMetadata({
  title: "Shop All Sarees",
  description:
    "Browse all silk, cotton, wedding and festive sarees at Geetha saree's. Shop online at geethasarees.com with secure checkout and delivery across India.",
  path: "/shop",
});

interface ProductsPageProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

async function ProductsPage({ searchParams }: ProductsPageProps) {
  const variables = buildShopSearchVariables(searchParams);
  const priceHeading = formatShopPriceRangeHeading(searchParams);
  const [searchResult, initialDraftIds, collectionsData] = await Promise.all([
    withFallback<StorefrontProductSearchResult | null>(
      "shop:search",
      () => fetchProductSearchCached(variables),
      null,
    ),
    getDraftProductIdsSafe(),
    withFallback("shop:collections", () => getAllCollectionsCached(), null),
  ]);

  const initialSearchResult = searchResult ?? {
    productsCollection: null,
    matchingCollections: [],
  };

  const collectionsSection =
    collectionsData?.edges?.map(({ node }) => ({
      id: node.id,
      label: node.label,
    })) ?? [];

  return (
    <Shell>
      <Header
        heading={priceHeading ? "Shop by Price" : "Shop Now"}
        description={
          priceHeading
            ? `Sarees priced ${priceHeading}. Use filters below to refine further.`
            : undefined
        }
      />

      <Suspense
        fallback={
          <div>
            <Skeleton className="mb-3 h-8 max-w-xl" />
            <Skeleton className="h-8 max-w-2xl" />
          </div>
        }
      >
        <FilterSelections collectionsSection={collectionsSection} />
      </Suspense>

      <Suspense fallback={<SearchProductsGridSkeleton />}>
        <SearchProductsInifiteScroll
          initialSearchResult={initialSearchResult}
          initialDraftIds={initialDraftIds ?? undefined}
        />
      </Suspense>
    </Shell>
  );
}

export default ProductsPage;
