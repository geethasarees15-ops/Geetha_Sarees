-- Logged-in shoppers mutate carts/wishlist via Supabase GraphQL (pg_graphql).
-- RLS policies exist (carts_all_own, wishlist_all_own) but table-level GRANTs were
-- missing — only SELECT was granted in 02-enable-graphql.sql.

GRANT SELECT, INSERT, UPDATE, DELETE ON carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wishlist TO authenticated;
