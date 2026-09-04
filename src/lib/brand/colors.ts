/** Geetha saree's brand palette — cream + gold (matches shop logo). */
export const brandColors = {
  black: "#000000",
  blackElevated: "#0a0a0a",
  blackSoft: "#141414",
  gold: "#E8C872",
  goldBright: "#FFD700",
  goldDark: "#C9A227",
  goldDeep: "#A67C00",
  goldBorder: "#C5A059",
  goldText: "#F0D78C",
  cream: "#FFF8F0",
  creamMuted: "#F5EDE0",
  creamElevated: "#FFFCF8",
  ink: "#1A1A1A",
  inkMuted: "#5C5348",
  silver: "#D4D4D4",
  whatsapp: "#25D366",
} as const;

/** Semantic header tokens derived from brand palette */
export const storeHeaderColors = {
  bg: brandColors.cream,
  bgElevated: brandColors.creamElevated,
  announcementBg: brandColors.creamMuted,
  fg: brandColors.ink,
  fgMuted: brandColors.inkMuted,
  border: brandColors.goldBorder,
} as const;

/** RGB tuple for rgba() in shadows and glows */
export const brandRgb = {
  gold: "232, 200, 114",
  black: "0, 0, 0",
} as const;
