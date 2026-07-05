import AdminShell from "@/components/admin/AdminShell";
import { AdminTablePageSkeleton } from "@/components/admin/AdminPageSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminOrdersList from "@/features/orders/components/admin/AdminOrdersList";
import { getAdminOrdersList } from "@/lib/admin/getAdminOrdersList";
import { publicErrorMessage } from "@/lib/api/public-error";
import {
  isPaidPaymentStatus,
  needsPaymentAttention,
} from "@/lib/orders/paymentStatus";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

export default function OrdersPage({ searchParams }: AdminOrdersPageProps) {
  return (
    <Suspense fallback={<AdminTablePageSkeleton statCards={2} tableRows={8} />}>
      <OrdersPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersPageContent({ searchParams }: AdminOrdersPageProps) {
  void searchParams;

  let fetchError: string | null = null;
  let orders: Awaited<ReturnType<typeof getAdminOrdersList>> = [];

  try {
    orders = await getAdminOrdersList();
  } catch (error) {
    console.error("[admin/orders] page load failed:", error);
    fetchError = publicErrorMessage(error, "Failed to load orders.");
  }

  const paidOrders = orders.filter((order) =>
    isPaidPaymentStatus(order.paymentStatus),
  );
  const pendingOrders = orders.filter((order) =>
    needsPaymentAttention({
      payment_status: order.paymentStatus,
      order_status: order.orderStatus,
    }),
  );

  return (
    <AdminShell heading="Orders">
      <div className="space-y-6">
        {fetchError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not fully load orders</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-300/50 bg-emerald-50/40 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700">
              Paid orders
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {paidOrders.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Counted in dashboard revenue and top products
            </p>
          </div>
          <div className="rounded-lg border border-amber-300/50 bg-amber-50/40 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-700">
              Pending / unpaid
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {pendingOrders.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow up — ask why payment was not completed
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Paid orders</h2>
          <p className="text-sm text-muted-foreground">
            Tap an order to open packing details. Copy address from the list or
            order page.
          </p>
          <AdminOrdersList
            orders={paidOrders}
            emptyMessage="No paid orders yet."
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Pending / unpaid orders</h2>
          <p className="text-sm text-muted-foreground">
            Contact these customers — not included in sales analytics.
          </p>
          <AdminOrdersList
            orders={pendingOrders}
            emptyMessage="No pending or unpaid orders."
          />
        </section>
      </div>
    </AdminShell>
  );
}
