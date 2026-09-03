import {
  CombinedError,
  cacheExchange,
  createClient,
  fetchExchange,
} from "@urql/core";
import { env } from "../env.mjs";
import {
  createSupabaseGraphqlFetch,
  resolveSupabaseUrl,
} from "@/lib/supabase/graphql-fetch";
import { registerUrql } from "@urql/next/rsc";

export const makeClient = (access_token?: string) => {
  const supabaseUrl = resolveSupabaseUrl(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  );

  return createClient({
    url: `${supabaseUrl}/graphql/v1`,
    fetch: createSupabaseGraphqlFetch(supabaseUrl, () => {
      const headers: Record<string, string> = {
        apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      };
      if (access_token) {
        headers.Authorization = `Bearer ${access_token}`;
      }
      return headers;
    }),
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => ({
      next: { revalidate: 120 },
    }),
    requestPolicy: "cache-first",
  });
};

export type ExpectedErrorsHandlerType = {
  error?: CombinedError | undefined;
  expectedErrors?: { [key: string]: string };
  unexpectedErrorMessage?: string;
  networkErrorMessage?: string;
};

export function expectedErrorsHandler({
  error,
  expectedErrors = {},
  unexpectedErrorMessage = "An unexpected error occurred.",
  networkErrorMessage = "There was a problem with the network connection.",
}: ExpectedErrorsHandlerType): null | string {
  if (error === undefined) {
    return null;
  } else if (error.networkError) {
    return networkErrorMessage;
  }

  let foundExpectedError = false;

  for (const graphQLError of error.graphQLErrors) {
    for (const [errorKey, errorMessage] of Object.entries(expectedErrors)) {
      if (graphQLError.message.includes(errorKey)) {
        return errorMessage;
      }
    }
    foundExpectedError = true;
  }

  return foundExpectedError ? unexpectedErrorMessage : null;
}

export const createUrqlClient = (access_token?: string) =>
  registerUrql(() => makeClient(access_token)).getClient();

export const { getClient } = registerUrql(makeClient);
