import InfoPage from "@/components/layouts/InfoPage";
import Link from "next/link";
import { STOREFRONT_STATIC_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/config/site";

export const revalidate = STOREFRONT_STATIC_REVALIDATE_SECONDS;

export const metadata = buildPageMetadata({
  title: "Our Story",
  description:
    "About Geetha saree's — silk and cotton sarees in Elampillai, Tamil Nadu. Visit our store on Gurunatha Samy Kovil Street.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <InfoPage
      heading="Our Story"
      description="Geetha Sarees — trusted sarees for every occasion, from our family to yours."
    >
      <p>
        Geetha Sarees offers authentic silk and cotton sarees for festivals,
        weddings, and everyday elegance. From Kanjivaram and soft silk to cotton
        and wedding collections, we curate quality pieces for retail and
        wholesale buyers.
      </p>
      <p>
        We combine the warmth of a local textile shop with the convenience of
        online ordering. Visit our showroom in Elampillai or shop from home —
        our team is here to help you find the right saree.
      </p>
      <section className="rounded-lg border border-primary/15 bg-muted/30 p-4 not-prose">
        <h2 className="text-base font-semibold text-foreground">Visit our store</h2>
        <address className="mt-2 space-y-0.5 not-italic text-sm text-muted-foreground">
          {siteConfig.addressLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </address>
        <p className="mt-2 text-sm">
          Phone:{" "}
          <Link href={siteConfig.phoneHref} className="text-primary hover:underline">
            {siteConfig.phone}
          </Link>
        </p>
      </section>
      <p>
        Browse our{" "}
        <Link href="/collections" className="text-primary hover:underline">
          collections
        </Link>
        , explore{" "}
        <Link href="/featured" className="text-primary hover:underline">
          featured sarees
        </Link>
        , or{" "}
        <Link href="/contact" className="text-primary hover:underline">
          get in touch
        </Link>{" "}
        for wedding and bulk orders.
      </p>
    </InfoPage>
  );
}
