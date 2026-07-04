import AdminShell from "@/components/admin/AdminShell";
import { StockControlForm } from "@/features/admin/settings/StockControlForm";

export default function AdminStockControlSettingsPage() {
  return (
    <AdminShell
      heading="Stock Control"
      description="Configure low-stock visibility and storefront stock behavior."
    >
      <StockControlForm />
    </AdminShell>
  );
}
