import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { BRAND_LOGO_PATH } from "@/lib/brand/shop-board";

type AdminSidebarBrandProps = {
  className?: string;
};

export function AdminSidebarBrand({ className }: AdminSidebarBrandProps) {
  return (
    <Link href="/admin/dashboard" prefetch={false} className={className}>
      <Image
        src={BRAND_LOGO_PATH}
        alt={siteConfig.shortName}
        width={120}
        height={36}
        className="h-9 w-auto max-w-[7.5rem] shrink-0 object-contain object-left"
        priority
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {siteConfig.shortName}
        </span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
          Admin
        </span>
      </span>
    </Link>
  );
}
