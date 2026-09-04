import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { getURL } from "@/lib/utils";

const siteUrl = getURL();
const siteOrigin = siteUrl.replace(/\/$/, "");

/** Shared storefront title for Google / Open Graph. */
export const SEO_DEFAULT_TITLE =
  "Geetha saree's | Premium Silk & Cotton Sarees Online";

export const SEO_DEFAULT_DESCRIPTION = siteConfig.description;

const ogImage = {
  url: "/images/geetha-sarees-logo.png",
  width: 800,
  height: 340,
  alt: siteConfig.name,
} as const;

/** Root metadata for layout.tsx — favicons use app/icon.svg + app/apple-icon.svg. */
export function buildRootMetadata(): Metadata {
  const verification: Metadata["verification"] = {};
  const googleVerification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  if (googleVerification) {
    verification.google = googleVerification;
  }

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: SEO_DEFAULT_TITLE,
      template: `%s | ${siteConfig.name}`,
    },
    description: SEO_DEFAULT_DESCRIPTION,
    keywords: [
      "Geetha Sarees",
      "Geetha saree's",
      "silk sarees",
      "cotton sarees",
      "Kanjivaram sarees",
      "wedding sarees",
      "wholesale sarees",
      "sarees online India",
      "geethasarees.com",
    ],
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name, url: siteOrigin }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    category: "shopping",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml", sizes: "32x32" },
        {
          url: "/images/geetha-sarees-logo.png",
          type: "image/png",
          sizes: "512x512",
        },
      ],
      shortcut: ["/icon.svg"],
      apple: [
        { url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" },
      ],
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteOrigin,
      siteName: siteConfig.name,
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: SEO_DEFAULT_TITLE,
      description: SEO_DEFAULT_DESCRIPTION,
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: siteOrigin,
      languages: {
        "en-IN": siteOrigin,
      },
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}

/** Page-level metadata helper — keeps canonical + OG aligned with geethasarees.com. */
export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const canonicalPath = input.path.startsWith("/")
    ? input.path
    : `/${input.path}`;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalPath,
      siteName: siteConfig.name,
      locale: "en_IN",
      type: "website",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [ogImage.url],
    },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
