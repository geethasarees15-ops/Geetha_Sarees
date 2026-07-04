import AdminShell from "@/components/admin/AdminShell";
import { ShopContactForm } from "@/features/admin/settings/ShopContactForm";

export default function AdminShopContactSettingsPage() {
  return (
    <AdminShell
      heading="Shop Contact"
      description="Edit store address, GSTIN, email, and phone numbers shown on the storefront."
    >
      <ShopContactForm />
    </AdminShell>
  );
}
