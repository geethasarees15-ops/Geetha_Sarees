-- Fix GraphQL HTTP API on pg_graphql 1.6 (graphql_public uses search_path '').
-- Expose a public RPC wrapper so the app can query via PostgREST /rest/v1/rpc/storefront_graphql.

CREATE OR REPLACE FUNCTION public.storefront_graphql(
  query text,
  variables jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public, graphql
AS $$
  SELECT graphql.resolve(
    query := query,
    variables := COALESCE(variables, '{}'::jsonb)
  );
$$;

GRANT EXECUTE ON FUNCTION public.storefront_graphql(text, jsonb) TO anon, authenticated, service_role;

COMMENT ON SCHEMA public IS E'@graphql({"inflect_names": false, "introspection": true})';
