"use client";

import * as React from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, Loader2 } from "lucide-react";

import AdminOrdersList from "@/features/orders/components/admin/AdminOrdersList";
import type { AdminOrderListView } from "@/lib/admin/getAdminOrdersList";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type OrdersSegment = "paid" | "unpaid";

type OrdersListResult = {
  rows: AdminOrderListView[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type Props = {
  segment: OrdersSegment;
  counts: { paid: number; pending: number };
  paid: OrdersListResult;
  unpaid: OrdersListResult;
  paidPageParam: string;
  unpaidPageParam: string;
  pageSizeParam: string;
  resetPageParams: string[];
};

const ORDERS_PATH = "/admin/orders";
/** If RSC navigation stalls, unlock the UI so the admin can retry. */
const NAV_STALL_TIMEOUT_MS = 12_000;

export function segmentHref(nextSegment: OrdersSegment, pageSize: number) {
  const params = new URLSearchParams();
  params.set("status", nextSegment);
  // Keep shared page size; reset per-segment pages by omitting them.
  if (pageSize > 0) params.set("pageSize", String(pageSize));
  return `${ORDERS_PATH}?${params.toString()}`;
}

function OrdersListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function AdminOrdersSegmentTabs({
  segment,
  counts,
  paid,
  unpaid,
  paidPageParam,
  unpaidPageParam,
  pageSizeParam,
  resetPageParams,
}: Props) {
  const active = segment === "unpaid" ? unpaid : paid;
  const pageSize = active.pageSize;

  // Explicit loading target — do NOT rely on useTransition isPending (can stick
  // true after a few App Router searchParam navigations and freeze the UI).
  const [loadingTo, setLoadingTo] = React.useState<OrdersSegment | null>(null);

  React.useEffect(() => {
    setLoadingTo(null);
  }, [segment]);

  React.useEffect(() => {
    if (loadingTo == null) return;
    const timer = window.setTimeout(() => {
      setLoadingTo(null);
    }, NAV_STALL_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadingTo]);

  const displaySegment = loadingTo ?? segment;
  const isLoading = loadingTo != null;

  const beginNavigate = React.useCallback(
    (next: OrdersSegment) => {
      if (next === segment && loadingTo == null) return;
      setLoadingTo(next);
    },
    [loadingTo, segment],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Choose which orders to view
        </p>
        <div
          className="grid gap-3 sm:grid-cols-2"
          role="tablist"
          aria-label="Order payment status"
        >
          <Link
            href={segmentHref("paid", pageSize)}
            replace
            scroll={false}
            prefetch
            role="tab"
            aria-selected={displaySegment === "paid"}
            aria-busy={isLoading && loadingTo === "paid"}
            onClick={() => beginNavigate("paid")}
            className={cn(
              "flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              displaySegment === "paid"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <CircleCheck
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                displaySegment === "paid"
                  ? "text-primary-foreground"
                  : "text-primary",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold tracking-tight">
                  Paid orders
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums",
                    displaySegment === "paid"
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {counts.paid}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 block text-xs leading-snug",
                  displaySegment === "paid"
                    ? "text-primary-foreground/85"
                    : "text-muted-foreground",
                )}
              >
                Payment completed — ready to pack and ship
              </span>
            </span>
          </Link>

          <Link
            href={segmentHref("unpaid", pageSize)}
            replace
            scroll={false}
            prefetch
            role="tab"
            aria-selected={displaySegment === "unpaid"}
            aria-busy={isLoading && loadingTo === "unpaid"}
            onClick={() => beginNavigate("unpaid")}
            className={cn(
              "flex items-start gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              displaySegment === "unpaid"
                ? "border-destructive bg-destructive text-destructive-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-destructive/50 hover:bg-muted/40",
            )}
          >
            <CircleAlert
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                displaySegment === "unpaid"
                  ? "text-destructive-foreground"
                  : "text-destructive",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold tracking-tight">
                  Unpaid orders
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums",
                    displaySegment === "unpaid"
                      ? "bg-destructive-foreground/20 text-destructive-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {counts.pending}
                </span>
              </span>
              <span
                className={cn(
                  "mt-1 block text-xs leading-snug",
                  displaySegment === "unpaid"
                    ? "text-destructive-foreground/85"
                    : "text-muted-foreground",
                )}
              >
                Payment not completed — follow up if needed
              </span>
            </span>
          </Link>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {isLoading ? (
          <>
            <Loader2
              className="h-3.5 w-3.5 shrink-0 animate-spin"
              aria-hidden
            />
            <span>
              Loading{" "}
              <span className="font-medium text-foreground">
                {displaySegment === "unpaid" ? "unpaid" : "paid"}
              </span>{" "}
              orders…
            </span>
          </>
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {segment === "unpaid" ? "unpaid" : "paid"}
            </span>{" "}
            orders below
            {active.totalCount > 0 ? <> ({active.totalCount} total)</> : null}.
          </>
        )}
      </p>

      {isLoading ? (
        <OrdersListSkeleton />
      ) : (
        <AdminOrdersList
          orders={active.rows}
          totalCount={active.totalCount}
          page={active.page}
          pageSize={active.pageSize}
          pageParam={segment === "unpaid" ? unpaidPageParam : paidPageParam}
          pageSizeParam={pageSizeParam}
          resetPageParams={resetPageParams}
          emptyMessage={
            segment === "unpaid"
              ? "No unpaid orders right now."
              : "No paid orders yet."
          }
        />
      )}
    </div>
  );
}
