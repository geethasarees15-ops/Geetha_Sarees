/**
 * Route Urql GraphQL requests through Supabase PostgREST RPC.
 * Works around pg_graphql 1.6 graphql_public empty search_path bug on new projects.
 */
export function createSupabaseGraphqlFetch(
  supabaseUrl: string,
  getHeaders: () => Record<string, string>,
): typeof fetch {
  const rpcUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/storefront_graphql`;

  return async (input, init) => {
    void input;
    const payload = init?.body ? JSON.parse(String(init.body)) : {};
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        ...getHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: payload.query,
        variables: payload.variables ?? {},
      }),
      cache: init?.cache,
      next: init?.next,
      signal: init?.signal,
    });

    if (!res.ok) {
      return res;
    }

    const json = await res.json();
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

export function resolveSupabaseUrl(
  url?: string | null,
  projectRef?: string | null,
): string {
  const fromUrl = url?.trim();
  if (fromUrl) return fromUrl.replace(/\/$/, "");

  const ref = projectRef?.trim();
  if (ref) return `https://${ref}.supabase.co`;

  throw new Error(
    "Missing Supabase URL (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PROJECT_REF).",
  );
}
