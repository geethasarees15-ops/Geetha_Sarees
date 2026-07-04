import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { cn } from "@/lib/utils";

const SETTINGS_LINKS = [
  {
    title: "Stock Control",
    href: "/admin/settings/stock-control",
    description: "Low-stock visibility and storefront stock behavior.",
  },
  {
    title: "Bulk Order",
    href: "/admin/settings/bulk-order",
    description: "Bulk quantity confirmation popup for cart and checkout.",
  },
  {
    title: "Offer Codes",
    href: "/admin/settings/offer-codes",
    description: "Promo codes and percentage discounts at checkout.",
  },
  {
    title: "Courier & GST",
    href: "/admin/settings/courier",
    description: "Courier charges and GST configuration.",
  },
  {
    title: "API Settings",
    href: "/admin/settings/apis",
    description: "Payment and integration API keys.",
  },
  {
    title: "Social URLs",
    href: "/admin/settings/social",
    description: "Instagram, WhatsApp, and other social links.",
  },
  {
    title: "Announcement Bar",
    href: "/admin/settings/announcement-bar",
    description: "Top ribbon offers and messages on the storefront.",
  },
  {
    title: "Home Banner",
    href: "/admin/settings/home-banner",
    description: "Homepage hero banner slides and links.",
  },
  {
    title: "Velo",
    href: "/admin/settings/velo",
    description: "Velo API keys and product sync.",
  },
] as const;

export default function AdminSettingsPage() {
  return (
    <AdminShell
      heading="Settings"
      description="Configure stock, bulk orders, integrations, and storefront content."
    >
      <section className="max-w-3xl space-y-3">
        <h2 className="text-lg font-semibold">Store settings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SETTINGS_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                "hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
