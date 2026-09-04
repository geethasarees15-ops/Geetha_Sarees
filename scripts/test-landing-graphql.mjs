import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/storefront_graphql`;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const query = `
  query LandingRouteQuery {
    products: productsCollection(
      filter: { featured: { eq: true } }
      first: 12
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          name
          featured
        }
      }
    }
    collectionScrollCards: collectionsCollection(
      first: 10
      orderBy: [{ order: DescNullsLast }]
    ) {
      edges {
        node {
          id
          label
          slug
        }
      }
    }
    homeTestimonials: testimonialsCollection(
      filter: { is_published: { eq: true } }
      first: 12
      orderBy: [{ order: DescNullsLast }, { created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const started = Date.now();
const res = await fetch(url, {
  method: "POST",
  headers: { apikey: key, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: {} }),
});
const json = await res.json();
console.log("ms", Date.now() - started, "status", res.status);
console.log(JSON.stringify(json, null, 2).slice(0, 3000));
