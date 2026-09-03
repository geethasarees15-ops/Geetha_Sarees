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
3. Set `NEXT_PUBLIC_SITE_URL` to the Vercel URL (or custom domain later).

## Health checks

| URL | Use |
|-----|-----|
| `GET /api/health` | Uptime |
| `GET /api/health?deep=1` | DB + Redis |
