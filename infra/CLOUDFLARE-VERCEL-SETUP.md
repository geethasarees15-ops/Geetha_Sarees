# Geetha Sarees hosting architecture

## Target stack

| Layer | Service | Role |
|-------|---------|------|
| **DNS + edge CDN + WAF** | Cloudflare (when a custom domain is ready) | Proxy www, cache static assets |
| **App (Next.js)** | Vercel | Storefront, admin, checkout |
| **Database** | This shop’s Supabase project | Postgres via transaction pooler :6543 |
| **Product media** | This shop’s Cloudflare R2 bucket `geetha-sarees-media` | Images |
| **Media worker** | `geetha-sarees-media-proxy` | Optional R2 proxy |
| **Cache** | This shop’s Upstash Redis | Storefront cache |

Do **not** point this shop at SSR Tex, Hub, or Thryco Cloudflare / R2 / Redis / Supabase.

## Vercel

1. Import [geethasarees15-ops/Geetha_Sarees](https://github.com/geethasarees15-ops/Geetha_Sarees).
2. Set env vars from `.env.example` with Geetha Sarees values.
3. Set `NEXT_PUBLIC_SITE_URL` to your live domain (e.g. `https://geethasarees.com`).

## Custom domain (Cloudflare DNS → Vercel)

| Step | Where | What |
|------|--------|------|
| 1 | Vercel → project **geethasarees** → Domains | Add `geethasarees.com` and `www.geethasarees.com` |
| 2 | Cloudflare → zone **geethasarees.com** → DNS | `A` `@` → `76.76.21.21` (proxied); `CNAME` `www` → `cname.vercel-dns.com` (proxied) |
| 3 | Cloudflare → SSL/TLS | **Full** (not Flexible) |
| 4 | Vercel env | `NEXT_PUBLIC_SITE_URL=https://geethasarees.com` then redeploy once |
| 5 | Supabase Auth | Run `node scripts/setup-auth-config.mjs` after `SUPABASE_ACCESS_TOKEN` is set |

Cloudflare on this account is also used for **R2 media** and the media worker — that is separate from the shop domain.

## Health checks

| URL | Use |
|-----|-----|
| `GET /api/health` | Uptime |
| `GET /api/health?deep=1` | DB + Redis |
