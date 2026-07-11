"use client";

import Link from "next/link";

import AdminOrdersList from "@/features/orders/components/admin/AdminOrdersList";
import type { AdminOrderListView } from "@/lib/admin/getAdminOrdersList";
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

function segmentHref(nextSegment: OrdersSegment, pageSize: number) {
  const params = new URLSearchParams();
  params.set("status", nextSegment);
  // Keep shared page size; reset per-segment pages by omitting them.
  if (pageSize > 0) params.set("pageSize", String(pageSize));
  return `${ORDERS_PATH}?${params.toString()}`;
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

  return (
    <div className="space-y-4">
      <div
        className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
        role="tablist"
        aria-label="Order payment status"
      >
        <Link
          href={segmentHref("paid", pageSize)}
          role="tab"
          aria-selected={segment === "paid"}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            segment === "paid"
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground",
          )}
        >
          Paid
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
              segment === "paid"
                ? "bg-muted text-foreground"
                : "bg-background/60 text-muted-foreground",
            )}
          >
            {counts.paid}
          </span>
        </Link>
        <Link
          href={segmentHref("unpaid", pageSize)}
          role="tab"
          aria-selected={segment === "unpaid"}
          className={cn(
            "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            segment === "unpaid"
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground",
          )}
        >
          Unpaid
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
              segment === "unpaid"
                ? "bg-muted text-foreground"
                : "bg-background/60 text-muted-foreground",
            )}
          >
            {counts.pending}
          </span>
        </Link>
      </div>

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
    </div>
  );
}
