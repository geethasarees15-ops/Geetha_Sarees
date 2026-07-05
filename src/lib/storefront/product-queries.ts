import type {
  FeaturedProductsQueryQuery,
  FeaturedProductsQueryQueryVariables,
  SearchQuery,
  SearchQueryVariables,
} from "@/gql/graphql";
import type { StorefrontProductSearchVariables } from "@/lib/storefront/search-params";
import { getClient } from "@/lib/urql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";
import { findMatchingCollections } from "./collection-search";
import {
  NO_COLLECTION_MATCH_ID,
  normalizeStorefrontSearchTerm,
  type StorefrontCollectionMatch,
} from "./search-utils";
import {
  FeaturedProductsQueryDocument,
  SearchInCollectionQueryDocument,
  SearchInCollectionWithPriceQueryDocument,
  SearchQueryDocument,
  SearchWithPriceQueryDocument,
} from "./documents";

function stableKey(parts: Record<string, unknown>) {
  return JSON.stringify(parts);
}

export type StorefrontProductSearchResult = {
  productsCollection: SearchQuery["productsCollection"] | null;
  matchingCollections: StorefrontCollectionMatch[];
};

function pickSearchDocument(variables: StorefrontProductSearchVariables) {
  const hasCollection = Boolean(variables.collections?.length);
  const hasPrice = Boolean(variables.lower && variables.upper);

  if (hasCollection && hasPrice) {
    return SearchInCollectionWithPriceQueryDocument;
  }
  if (hasCollection) {
    return SearchInCollectionQueryDocument;
  }
  if (hasPrice) {
    return SearchWithPriceQueryDocument;
  }
  return SearchQueryDocument;
}

export async function fetchProductSearchCached(
  variables: StorefrontProductSearchVariables,
): Promise<StorefrontProductSearchResult> {
  const searchTerm = normalizeStorefrontSearchTerm(variables.search);
  const matchingCollections = searchTerm
    ? await findMatchingCollections(searchTerm)
    : [];

  const matchedCollectionIds =
    matchingCollections.length > 0
      ? matchingCollections.map((collection) => collection.id)
      : [NO_COLLECTION_MATCH_ID];

  const queryVariables: StorefrontProductSearchVariables = {
    ...variables,
    matchedCollectionIds,
  };

  const cacheKey = `sf:products:search:${stableKey({
    ...queryVariables,
    matchingCollectionIds: matchingCollections.map(
      (collection) => collection.id,
    ),
  })}`;

  const productsCollection = await withStorefrontCache(
    cacheKey,
    async () => {
      const document = pickSearchDocument(queryVariables);
      const { data, error } = await getClient().query<SearchQuery>(
        document,
        queryVariables as SearchQueryVariables,
      );
      if (error) throw error;
      return data?.productsCollection ?? null;
    },
    { tags: [CACHE_TAGS.products] },
  );

  return {
    productsCollection,
    matchingCollections: searchTerm ? matchingCollections : [],
  };
}

export async function fetchFeaturedProductsCached(variables: {
  first: number;
  after?: string | null;
}) {
  const cacheKey = `sf:products:featured:${stableKey(variables)}`;

  return withStorefrontCache(
    cacheKey,
    async () => {
      const { data, error } = await getClient().query<
        FeaturedProductsQueryQuery,
        FeaturedProductsQueryQueryVariables
      >(FeaturedProductsQueryDocument, variables);
      if (error) throw error;
      return data?.productsCollection ?? null;
    },
    { tags: [CACHE_TAGS.products] },
  );
}
