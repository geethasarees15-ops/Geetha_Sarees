import type { NavItemWithOptionalChildren } from "@/types";
import type { StoreContact } from "@/lib/contact/links";

export type SiteConfig = typeof siteConfig;

/** Geetha Sarees — fill address, GSTIN, and phones in Admin → Settings when ready. */
const ADDRESS_LINES: string[] = [];

const CONTACTS: StoreContact[] = [];

const PHONE = "8825716025";
const PHONE_HREF = "tel:+918825716025";
const EMAIL = "";
const GSTIN = "";

const SOCIAL = {
  instagram: "",
  youtube: "",
  facebook: "",
  whatsapp: "https://wa.me/918825716025",
} as const;

export const siteConfig = {
  /** Display name — matches logo */
  shopBoardName: "Geetha saree's",
  name: "Geetha saree's",
  shortName: "Geetha saree's",
  tagline: "Sarees Wholesale & Retail",
  /** Legacy subline under wordmark (logo includes contact line) */
  location: "8825716025",
  description:
    "Geetha saree's — premium silk and cotton sarees for weddings, festivals, wholesale and retail. Call or WhatsApp 8825716025.",
  searchPlaceholder: "Search silk & cotton sarees, collections…",
  url: "https://geethasarees.com",
  addressLines: ADDRESS_LINES,
  /** Single-line address for compact UI */
  address: ADDRESS_LINES.join(", "),
  phone: PHONE,
  /** `tel:` href (digits only, with country code) */
  phoneHref: PHONE_HREF,
  contacts: CONTACTS,
  email: EMAIL,
  gstin: GSTIN,
  currency: "INR",
  currencySymbol: "₹",
  social: SOCIAL,
  /** Top offer ribbon — rotates on the storefront */
  announcements: [
    {
      text: "Premium silk & cotton sarees — wholesale & retail at Geetha Sarees",
      href: "/shop",
      cta: "Shop now",
    },
    {
      text: "Call or WhatsApp 8825716025 for orders & enquiries",
      href: "https://wa.me/918825716025",
      cta: "Chat now",
    },
    {
      text: "Explore Kanjivaram, wedding & festive collections",
      href: "/collections",
      cta: "View all",
    },
  ],
  mainNav: [
    {
      title: "Collections",
      href: "/collections",
      description: "Browse saree collections.",
      items: [],
    },
    {
      title: "Featured",
      href: "/featured",
      description: "Handpicked sarees.",
      items: [],
    },
    {
      title: "Orders",
      href: "/orders",
      description: "Your orders.",
      items: [],
    },
  ] satisfies NavItemWithOptionalChildren[],

  /** Storefront footer columns */
  footerNav: [
    {
      title: "Shop",
      items: [
        { title: "All sarees", href: "/shop", items: [] },
        { title: "Featured sarees", href: "/featured", items: [] },
        { title: "All categories", href: "/collections", items: [] },
        { title: "Wishlist", href: "/wish-list", items: [] },
        { title: "Cart", href: "/cart", items: [] },
      ],
    },
    {
      title: "Collections",
      items: [
        {
          title: "Kanjivaram Wedding",
          href: "/collections/kanjivaram-wedding-sarees",
          items: [],
        },
        {
          title: "Cotton Sarees",
          href: "/collections/cotton-sarees",
          items: [],
        },
        {
          title: "Soft Silk Sarees",
          href: "/collections/soft-silk-sarees",
          items: [],
        },
        {
          title: "Wedding Collections",
          href: "/collections/wedding-collections",
          items: [],
        },
        {
          title: "Traditional Silk",
          href: "/collections/traditional-silk-sarees",
          items: [],
        },
        { title: "View all categories", href: "/collections", items: [] },
      ],
    },
    {
      title: "Customer Service",
      items: [
        {
          title: "Terms & Conditions",
          href: "/terms-and-conditions",
          items: [],
        },
        { title: "Terms of Use", href: "/terms-of-use", items: [] },
        { title: "Privacy Policy", href: "/privacy-policy", items: [] },
        { title: "Shipping & Returns", href: "/shipping-returns", items: [] },
        { title: "Payment Methods", href: "/payment-methods", items: [] },
        { title: "FAQ", href: "/faq", items: [] },
        { title: "My orders", href: "/orders", items: [] },
      ],
    },
    {
      title: "About Geetha Sarees",
      items: [
        { title: "Our Story", href: "/about", items: [] },
        { title: "Our Collections", href: "/collections", items: [] },
        { title: "Visit our store", href: "/contact#store", items: [] },
        { title: "Contact", href: "/contact", items: [] },
      ],
    },
  ] satisfies NavItemWithOptionalChildren[],
};
