"use client";

import Image from "next/image";
import { ViewTransitionLink } from "@/components/ui/ViewTransitionLink";
import type { ShopByPriceBucket } from "@/lib/storefront/shop-by-price-buckets";
import { keytoUrl } from "@/lib/utils";
import { HomeSectionHeader } from "./HomeSectionHeader";
import {
  HomeScrollSnapStrip,
  ScrollSnapItem,
  scrollSnapPriceItemClass,
} from "./HomeScrollSnapStrip";
import {
  MotionHoverLift,
  MotionRevealItem,
  MotionSection,
} from "./MotionSection";

type Props = {
  buckets: ShopByPriceBucket[];
};

function PriceCircleCard({ bucket }: { bucket: ShopByPriceBucket }) {
  const imageSrc = bucket.imageKey ? keytoUrl(bucket.imageKey) : null;

  return (
    <ViewTransitionLink
      href={bucket.href}
      className="group flex w-full flex-col items-center gap-2.5 sm:gap-3"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full border-2 border-primary/20 bg-muted shadow-[0_12px_28px_-16px_rgba(107,24,88,0.55)] transition-[border-color,box-shadow,transform] duration-300 group-hover:border-primary/45 group-hover:shadow-[0_18px_36px_-14px_rgba(107,24,88,0.65)] group-active:scale-[0.98]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={bucket.imageAlt}
            fill
            sizes="(max-width: 640px) 28vw, 130px"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-[#C9A227]/25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>
      <p className="max-w-full px-1 text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
        {bucket.label}
      </p>
    </ViewTransitionLink>
  );
}

export function HomePriceCarousel({ buckets }: Props) {
  if (!buckets.length) return null;

  return (
    <MotionSection className="w-full min-w-0 py-4 sm:py-8 md:py-10">
      <HomeSectionHeader
        title="Shop by"
        titleAccent="Price"
        href="/shop"
        showViewMore={false}
      />
      <HomeScrollSnapStrip ariaLabel="Shop by price ranges">
        {buckets.map((bucket, index) => (
          <ScrollSnapItem key={bucket.id} className={scrollSnapPriceItemClass}>
            <MotionRevealItem index={index} instant className="w-full">
              <MotionHoverLift className="w-full">
                <PriceCircleCard bucket={bucket} />
              </MotionHoverLift>
            </MotionRevealItem>
          </ScrollSnapItem>
        ))}
      </HomeScrollSnapStrip>
    </MotionSection>
  );
}
