"use client";

import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";

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
            role="tab"
            aria-selected={segment === "paid"}
            className={cn(
              "flex items-start gap-3 rounded-lg border-2 px-4 py-3 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              segment === "paid"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <CircleCheck
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                segment === "paid" ? "text-primary-foreground" : "text-primary",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold tracking-tight">
                  Paid orders
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums",
                    segment === "paid"
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
                  segment === "paid"
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
            role="tab"
            aria-selected={segment === "unpaid"}
            className={cn(
              "flex items-start gap-3 rounded-lg border-2 px-4 py-3 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              segment === "unpaid"
                ? "border-destructive bg-destructive text-destructive-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-destructive/50 hover:bg-muted/40",
            )}
          >
            <CircleAlert
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                segment === "unpaid"
                  ? "text-destructive-foreground"
                  : "text-destructive",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold tracking-tight">
                  Unpaid orders
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums",
                    segment === "unpaid"
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
                  segment === "unpaid"
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

      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {segment === "unpaid" ? "unpaid" : "paid"}
        </span>{" "}
        orders below
        {active.totalCount > 0 ? <> ({active.totalCount} total)</> : null}.
      </p>

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
