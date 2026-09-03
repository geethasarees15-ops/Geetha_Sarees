import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { siteConfig } from "@/config/site";
import { brandSans, heroSerif } from "@/lib/fonts";
import { getURL } from "@/lib/utils";
import CustomProvider from "../providers/CustomProvider";

const inter = Inter({ subsets: ["latin"] });
const siteUrl = getURL();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Geetha Sarees | Silk & Cotton Sarees",
    template: "%s | Geetha Sarees",
  },
  description: siteConfig.description,
  keywords: [
    "Geetha Sarees",
    "silk sarees",
    "cotton sarees",
    "Kanjivaram sarees",
    "wedding sarees",
    "wholesale sarees",
  ],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: siteConfig.name,
    title: "Geetha Sarees | Silk & Cotton Sarees",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Geetha Sarees | Silk & Cotton Sarees",
    description: siteConfig.description,
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
    canonical: siteUrl,
  },
  icons: {
    icon: [{ url: "/images/geetha-sarees-emblem.svg", type: "image/svg+xml" }],
    shortcut: ["/images/geetha-sarees-emblem.svg"],
    apple: [{ url: "/images/geetha-sarees-emblem.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <CustomProvider>
        <body
          className={`${inter.className} ${brandSans.variable} ${heroSerif.variable}`}
        >
          {children}
          <Toaster />
        </body>
      </CustomProvider>
    </html>
  );
}
