import { brandLogoSizeConfig } from "./shop-board";

/** Matches `AnnouncementBar` — `h-[var(--announcement-bar-height)]` */
const ANNOUNCEMENT_BAR_PX = 36;

/** Matches `MobileNavbar` row height */
const NAV_MOBILE_ROW_PX = 64;

/** Matches desktop nav container `py-1` (4px × 2) */
const NAV_DESKTOP_PADDING_Y_PX = 8;

/** Buffer below fixed header */
const LOGO_CLEARANCE_PX = 4;

function pxToRem(px: number): string {
  return `${px / 16}rem`;
}

export function computeStorefrontHeaderMetrics() {
  const navLockupPx = brandLogoSizeConfig.nav.height;
  const desktopLockupPx = brandLogoSizeConfig.md.height;

  const navMobilePx = Math.max(NAV_MOBILE_ROW_PX, navLockupPx + 12);
  const navDesktopPx = NAV_DESKTOP_PADDING_Y_PX + desktopLockupPx + 8;

  const offsetMobilePx = ANNOUNCEMENT_BAR_PX + navMobilePx + LOGO_CLEARANCE_PX;
  const offsetDesktopPx =
    ANNOUNCEMENT_BAR_PX + navDesktopPx + LOGO_CLEARANCE_PX;

  return {
    announcementBarPx: ANNOUNCEMENT_BAR_PX,
    navLockupMobilePx: navLockupPx,
    navLockupDesktopPx: desktopLockupPx,
    navMobilePx,
    navDesktopPx,
    emblemClearancePx: LOGO_CLEARANCE_PX,
    offsetMobilePx,
    offsetDesktopPx,
  };
}

export function storefrontHeaderCssVarDeclarations(): Record<string, string> {
  const metrics = computeStorefrontHeaderMetrics();

  return {
    "--announcement-bar-height": pxToRem(metrics.announcementBarPx),
    "--store-nav-content-height-mobile": pxToRem(metrics.navLockupMobilePx),
    "--store-nav-content-height-desktop": pxToRem(metrics.navLockupDesktopPx),
    "--store-nav-height-mobile": pxToRem(metrics.navMobilePx),
    "--store-nav-height-desktop": pxToRem(metrics.navDesktopPx),
    "--store-emblem-clearance": pxToRem(metrics.emblemClearancePx),
    "--store-header-offset-mobile": pxToRem(metrics.offsetMobilePx),
    "--store-header-offset-desktop": pxToRem(metrics.offsetDesktopPx),
  };
}

export function storefrontHeaderStyleContent(): string {
  const declarations = Object.entries(storefrontHeaderCssVarDeclarations())
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ");

  return `:root { ${declarations}; }`;
}
