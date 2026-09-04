/** Geetha saree's logo lockup sizes (horizontal PNG with name + contact). */
export type ShopBoardBrandSize = "nav" | "md" | "footer";

type LogoSizeConfig = {
  /** Render height in px */
  height: number;
  /** Max width so nav does not overflow on small screens */
  maxWidth: number;
};

export const BRAND_LOGO_PATH = "/images/geetha-sarees-logo.png";

/** Natural aspect ratio of geetha-sarees-logo.png (~2.35:1) */
export const BRAND_LOGO_ASPECT = 2.35;

export const brandLogoSizeConfig: Record<ShopBoardBrandSize, LogoSizeConfig> = {
  nav: { height: 38, maxWidth: 168 },
  md: { height: 46, maxWidth: 210 },
  footer: { height: 64, maxWidth: 280 },
};

/** @deprecated Legacy export — use brandLogoSizeConfig */
export const shopBoardSizeConfig = brandLogoSizeConfig;
