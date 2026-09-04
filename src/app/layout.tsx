import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { brandSans, heroSerif } from "@/lib/fonts";
import { buildRootMetadata } from "@/lib/seo/metadata";
import CustomProvider from "../providers/CustomProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = buildRootMetadata();

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
