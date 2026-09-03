/**
 * One-time bootstrap: download saree catalog photos into Geetha R2 and fix medias keys.
 * Run: node scripts/seed-geetha-catalog-images.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
config({ path: resolve(root, ".env.local") });

const proxyUrl = process.env.R2_MEDIA_PROXY_URL?.replace(/\/$/, "");
const proxySecret = process.env.R2_MEDIA_PROXY_SECRET?.trim();
const cdnBase = process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "");
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!proxyUrl || !proxySecret || !cdnBase || !databaseUrl) {
  console.error(
    "Missing R2_MEDIA_PROXY_URL, R2_MEDIA_PROXY_SECRET, NEXT_PUBLIC_CDN_URL, or DATABASE_URL in .env.local",
  );
  process.exit(1);
}

/** Free-to-use saree model photos (bootstrap only — stored on Geetha R2 after upload). */
const CATALOG = [
  {
    mediaId: "m1",
    key: "catalog/silk-sarees.webp",
    alt: "Silk Sarees",
    source:
      "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    mediaId: "m2",
    key: "catalog/cotton-sarees.webp",
    alt: "Cotton Sarees",
    source:
      "https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    mediaId: "m3",
    key: "catalog/kanchi-sarees.webp",
    alt: "Kanchi Sarees",
    source:
      "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    mediaId: "m4",
    key: "catalog/designer-sarees.webp",
    alt: "Designer Sarees",
    source:
      "https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

async function putToR2(key, buffer, contentType) {
  const url = `${proxyUrl}/object?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${proxySecret}`,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`R2 PUT ${key} failed: ${res.status} ${await res.text()}`);
  }
}

async function verifyPublic(key) {
  const res = await fetch(`${cdnBase}/${key}`, { method: "HEAD" });
  if (!res.ok) {
    throw new Error(`CDN HEAD ${key} failed: ${res.status}`);
  }
}

async function main() {
  for (const item of CATALOG) {
    console.log(`Downloading ${item.mediaId}…`);
    const imgRes = await fetch(item.source);
    if (!imgRes.ok) {
      throw new Error(`Download failed for ${item.source}: ${imgRes.status}`);
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType =
      imgRes.headers.get("content-type")?.split(";")[0]?.trim() ||
      "image/jpeg";
    console.log(`Uploading ${item.key} (${buffer.length} bytes)…`);
    await putToR2(item.key, buffer, contentType);
    await verifyPublic(item.key);
    console.log(`OK ${cdnBase}/${item.key}`);
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1 });
  try {
    for (const item of CATALOG) {
      await sql`
        UPDATE medias
        SET key = ${item.key}, alt = ${item.alt}
        WHERE id = ${item.mediaId}
      `;
    }
    await sql`
      UPDATE products
      SET images = '[]'::jsonb
      WHERE images::text LIKE '%placehold.co%'
    `;
    console.log("Database medias updated.");
  } finally {
    await sql.end({ timeout: 2 });
  }

  console.log("\nDone. Hard-refresh the storefront to see catalog images.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
