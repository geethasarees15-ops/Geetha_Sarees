import Image from "next/image";
import { siteConfig } from "@/config/site";
import {
  BRAND_LOGO_ASPECT,
  BRAND_LOGO_PATH,
  brandLogoSizeConfig,
  type ShopBoardBrandSize,
} from "@/lib/brand/shop-board";
import { cn } from "@/lib/utils";

export type BrandWordmarkSize = ShopBoardBrandSize;

type Props = {
  className?: string;
  size?: BrandWordmarkSize;
  align?: "left" | "center";
};

/** Official Geetha saree's logo — horizontal lockup with name, divider, and contact. */
export function BrandWordmark({
  className,
  size = "md",
  align = "left",
}: Props) {
  const config = brandLogoSizeConfig[size];
  const width = Math.round(config.height * BRAND_LOGO_ASPECT);

  return (
    <span
      className={cn(
        "brand-logo-lockup inline-flex max-w-full items-center",
        align === "center" && "mx-auto justify-center",
        className,
      )}
    >
      <Image
        src={BRAND_LOGO_PATH}
        alt={siteConfig.name}
        width={width}
        height={config.height}
        className="brand-logo-image h-auto w-auto object-contain object-left"
        style={{
          height: config.height,
          maxWidth: config.maxWidth,
          width: "auto",
        }}
        priority={size === "nav"}
      />
    </span>
  );
}

export default BrandWordmark;
