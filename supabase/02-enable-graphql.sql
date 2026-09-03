CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA graphql TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;

-- After this file, run supabase/12-fix-graphql-search-path.sql in the SQL Editor
-- (Supabase-managed graphql_public wrapper needs search_path public, graphql).

CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_collections" ON collections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_medias" ON medias FOR SELECT TO anon, authenticated USING (true);
