import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECERT_KEY: z.string(),
    DATABASE_SERVICE_ROLE: z.string(),
    S3_ACCESS_KEY_ID: z.string(),
    S3_SECRET_ACCESS_KEY: z.string(),
    S3_ENDPOINT: z.string().url(),
    /** Optional Worker R2 proxy so browser/Vercel bytes skip S3 API keys. */
    R2_MEDIA_PROXY_URL: z.string().url().optional(),
    R2_MEDIA_PROXY_SECRET: z.string().min(16).optional(),
  },

  client: {
    NEXT_PUBLIC_SITE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_PROJECT_REF: z.string(),
    NEXT_PUBLIC_S3_BUCKET: z.string(),
    NEXT_PUBLIC_S3_REGION: z.string(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_CDN_URL: z.string().url(),
  },

  runtimeEnv: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    DATABASE_SERVICE_ROLE: process.env.DATABASE_SERVICE_ROLE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_PROJECT_REF:
      process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET,
    NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECERT_KEY: process.env.STRIPE_WEBHOOK_SECERT_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    R2_MEDIA_PROXY_URL: process.env.R2_MEDIA_PROXY_URL,
    R2_MEDIA_PROXY_SECRET: process.env.R2_MEDIA_PROXY_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
