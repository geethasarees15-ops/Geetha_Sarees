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
    default: "Geetha saree's | Silk & Cotton Sarees",
    template: "%s | Geetha saree's",
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
  icons: {
    icon: [{ url: "/images/geetha-sarees-logo.png", type: "image/png" }],
    shortcut: ["/images/geetha-sarees-logo.png"],
    apple: [{ url: "/images/geetha-sarees-logo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: siteConfig.name,
    title: "Geetha saree's | Silk & Cotton Sarees",
    description: siteConfig.description,
    images: [
      {
        url: "/images/geetha-sarees-logo.png",
        width: 800,
        height: 340,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Geetha saree's | Silk & Cotton Sarees",
    description: siteConfig.description,
    images: ["/images/geetha-sarees-logo.png"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} ${brandSans.variable} ${heroSerif.variable}`}
      >
        <CustomProvider>
          {children}
          <Toaster />
        </CustomProvider>
      </body>
    </html>
  );
}
