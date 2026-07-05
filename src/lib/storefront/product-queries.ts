import type {
  FeaturedProductsQueryQuery,
  FeaturedProductsQueryQueryVariables,
  SearchQuery,
  SearchQueryVariables,
} from "@/gql/graphql";
import { getEffectiveProductPrice } from "@/lib/products/discount";
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
  SearchQueryDocument,
} from "./documents";

function stableKey(parts: Record<string, unknown>) {
  return JSON.stringify(parts);
}

export type StorefrontProductSearchResult = {
  productsCollection: SearchQuery["productsCollection"] | null;
  matchingCollections: StorefrontCollectionMatch[];
};

type ProductSearchEdge = NonNullable<
  SearchQuery["productsCollection"]
>["edges"][number];

function parsePaginationOffset(after?: string | null): number {
  if (!after) return 0;
  const parsed = Number.parseInt(after, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function filterEdgesByEffectivePrice(
  edges: ProductSearchEdge[],
  lower: number,
  upper: number,
) {
  return edges.filter(({ node }) => {
    const effectivePrice = getEffectiveProductPrice(node);
    return effectivePrice >= lower && effectivePrice <= upper;
  });
}

function paginateEdges(
  edges: ProductSearchEdge[],
  first: number,
  after?: string | null,
): SearchQuery["productsCollection"] {
  const offset = parsePaginationOffset(after);
  const page = edges.slice(offset, offset + first);
  const nextOffset = offset + page.length;

  return {
    edges: page,
    pageInfo: {
      hasNextPage: nextOffset < edges.length,
      endCursor: nextOffset < edges.length ? String(nextOffset) : null,
    },
  };
}

function pickSearchDocument(variables: StorefrontProductSearchVariables) {
  const hasCollection = Boolean(variables.collections?.length);

  if (hasCollection) {
    return SearchInCollectionQueryDocument;
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

  const hasPrice = Boolean(queryVariables.lower && queryVariables.upper);
  const priceLower = Number(queryVariables.lower);
  const priceUpper = Number(queryVariables.upper);

  const productsCollection = await withStorefrontCache(
    cacheKey,
    async () => {
      const document = pickSearchDocument(queryVariables);
      const graphqlVariables = {
        ...(queryVariables as SearchQueryVariables),
        lower: undefined,
        upper: undefined,
        first: hasPrice ? 200 : queryVariables.first,
        after: hasPrice ? undefined : queryVariables.after,
      };

      const { data, error } = await getClient().query<SearchQuery>(
        document,
        graphqlVariables,
      );
      if (error) throw error;

      const collection = data?.productsCollection ?? null;
      if (!collection || !hasPrice) return collection;
      if (!Number.isFinite(priceLower) || !Number.isFinite(priceUpper)) {
        return collection;
      }

      const filtered = filterEdgesByEffectivePrice(
        collection.edges,
        priceLower,
        priceUpper,
      );

      return paginateEdges(
        filtered,
        queryVariables.first,
        queryVariables.after,
      );
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
