import AdminShell from "@/components/admin/AdminShell";
import { AdminTablePageSkeleton } from "@/components/admin/AdminPageSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AdminOrdersSegmentTabs,
  type OrdersSegment,
} from "@/features/orders/components/admin/AdminOrdersSegmentTabs";
import {
  clampAdminOrdersPageSize,
  getAdminOrdersCounts,
  getAdminOrdersList,
  parseAdminOrdersPage,
} from "@/lib/admin/getAdminOrdersList";
import { publicErrorMessage } from "@/lib/api/public-error";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAID_PAGE_PARAM = "paidPage";
const PENDING_PAGE_PARAM = "pendingPage";
const PAGE_SIZE_PARAM = "pageSize";
const STATUS_PARAM = "status";

type AdminOrdersPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

function parseOrdersSegment(
  value: string | string[] | undefined,
): OrdersSegment {
  const raw = String(Array.isArray(value) ? value[0] : value ?? "")
    .trim()
    .toLowerCase();
  return raw === "unpaid" || raw === "pending" ? "unpaid" : "paid";
}

export default function OrdersPage({ searchParams }: AdminOrdersPageProps) {
  return (
    <Suspense fallback={<AdminTablePageSkeleton statCards={2} tableRows={8} />}>
      <OrdersPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersPageContent({ searchParams }: AdminOrdersPageProps) {
  const rawPageSize = searchParams[PAGE_SIZE_PARAM];
  const pageSize = clampAdminOrdersPageSize(
    Number.parseInt(
      String(Array.isArray(rawPageSize) ? rawPageSize[0] : rawPageSize),
      10,
    ) || undefined,
  );
  const segment = parseOrdersSegment(searchParams[STATUS_PARAM]);
  const paidPage = parseAdminOrdersPage(searchParams[PAID_PAGE_PARAM]);
  const pendingPage = parseAdminOrdersPage(searchParams[PENDING_PAGE_PARAM]);

  const emptyList = {
    rows: [] as Awaited<ReturnType<typeof getAdminOrdersList>>["rows"],
    totalCount: 0,
    page: 1,
    pageSize,
  };

  let fetchError: string | null = null;
  let counts = { paid: 0, pending: 0 };
  let paid = emptyList;
  let unpaid = emptyList;

  try {
    const countsPromise = getAdminOrdersCounts();
    if (segment === "paid") {
      const [nextCounts, nextPaid] = await Promise.all([
        countsPromise,
        getAdminOrdersList({ segment: "paid", page: paidPage, pageSize }),
      ]);
      counts = nextCounts;
      paid = nextPaid;
    } else {
      const [nextCounts, nextUnpaid] = await Promise.all([
        countsPromise,
        getAdminOrdersList({
          segment: "pending",
          page: pendingPage,
          pageSize,
        }),
      ]);
      counts = nextCounts;
      unpaid = nextUnpaid;
    }
  } catch (error) {
    console.error("[admin/orders] page load failed:", error);
    fetchError = publicErrorMessage(error, "Failed to load orders.");
  }

  const resetPageParams = [PAID_PAGE_PARAM, PENDING_PAGE_PARAM];

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
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Paid orders
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {counts.paid}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Counted in dashboard revenue and top products
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Unpaid / pending
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {counts.pending}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Follow up — payment not completed
            </p>
          </div>
        </div>

        <AdminOrdersSegmentTabs
          segment={segment}
          counts={counts}
          paid={paid}
          unpaid={unpaid}
          paidPageParam={PAID_PAGE_PARAM}
          unpaidPageParam={PENDING_PAGE_PARAM}
          pageSizeParam={PAGE_SIZE_PARAM}
          resetPageParams={resetPageParams}
        />
      </div>
    </AdminShell>
  );
}
