"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileDown, Loader2 } from "lucide-react";

import AdminOrdersList from "@/features/orders/components/admin/AdminOrdersList";
import type { AdminOrderListView } from "@/lib/admin/getAdminOrdersList";
import { clampAdminOrdersPageSize } from "@/lib/admin/admin-orders-pagination";
import {
  describePaidDateFilter,
  formatIsoToDdMmYyyy,
  parseDdMmYyyyToIso,
  type PaidOrdersDateFilter,
} from "@/lib/admin/admin-orders-date-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { adminOrdersToPdfLabels } from "@/lib/pdf/admin-order-pdf-label";
import {
  downloadOrdersPdf,
  PdfAddressTooLongError,
} from "@/lib/pdf/shipping-label-pdf";
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
  paidDateFilter: PaidOrdersDateFilter;
};

const ORDERS_PATH = "/admin/orders";
/** If RSC navigation stalls, unlock the UI so the admin can retry. */
const NAV_STALL_TIMEOUT_MS = 12_000;

export function parseOrdersSegment(
  value: string | null | undefined,
): OrdersSegment {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return raw === "unpaid" || raw === "pending" ? "unpaid" : "paid";
}

export function segmentHref(nextSegment: OrdersSegment, pageSize: number) {
  const params = new URLSearchParams();
  params.set("status", nextSegment);
  // Keep shared page size; reset per-segment pages by omitting them.
  if (pageSize > 0) params.set("pageSize", String(pageSize));
  // Clear paid date filter when leaving paid so re-entry defaults to today.
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
  paidDateFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [downloadingBulkPdf, setDownloadingBulkPdf] = React.useState(false);
  const [loadingTo, setLoadingTo] = React.useState<OrdersSegment | null>(null);
  const [navError, setNavError] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const [draftAll, setDraftAll] = React.useState(paidDateFilter.allOrders);
  const [draftFrom, setDraftFrom] = React.useState(
    paidDateFilter.allOrders
      ? ""
      : formatIsoToDdMmYyyy(paidDateFilter.fromDate),
  );
  const [draftTo, setDraftTo] = React.useState(
    paidDateFilter.allOrders
      ? ""
      : formatIsoToDdMmYyyy(paidDateFilter.toDate),
  );
  const [filterError, setFilterError] = React.useState<string | null>(null);

  const urlSegment = parseOrdersSegment(searchParams?.get("status"));
  const pageSize = clampAdminOrdersPageSize(
    Number.parseInt(String(searchParams?.get(pageSizeParam) ?? ""), 10) ||
      paid.pageSize ||
      unpaid.pageSize ||
      undefined,
  );

  React.useEffect(() => {
    setDraftAll(paidDateFilter.allOrders);
    setDraftFrom(
      paidDateFilter.allOrders
        ? ""
        : formatIsoToDdMmYyyy(paidDateFilter.fromDate),
    );
    setDraftTo(
      paidDateFilter.allOrders
        ? ""
        : formatIsoToDdMmYyyy(paidDateFilter.toDate),
    );
    setFilterError(null);
  }, [paidDateFilter]);

  // Clear selection when the visible paid page set changes.
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [paid.page, paid.pageSize, paidDateFilter, segment]);

  // Props caught up with the URL — navigation succeeded.
  React.useEffect(() => {
    if (segment === urlSegment) {
      setLoadingTo((current) =>
        current == null || current === segment ? null : current,
      );
      setNavError(null);
    }
  }, [segment, urlSegment]);

  // Stall watchdog: never leave the unpaid/paid switch hanging forever.
  React.useEffect(() => {
    if (loadingTo == null && segment === urlSegment) return;
    const waitingFor = loadingTo ?? urlSegment;
    const timer = window.setTimeout(() => {
      if (segment !== waitingFor) {
        setNavError(
          `Could not load ${waitingFor} orders. Check your connection and retry.`,
        );
        setLoadingTo(null);
      }
    }, NAV_STALL_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadingTo, segment, urlSegment]);

  const displaySegment = loadingTo ?? urlSegment;
  const dataReady = segment === urlSegment && loadingTo == null;
  const isLoading = !dataReady;
  const active = segment === "unpaid" ? unpaid : paid;
  const showPaidPacking = dataReady && segment === "paid";
  const dateFilterLabel = describePaidDateFilter(paidDateFilter);
  const selectionActive = selectedIds.size > 0;

  const ordersForPdf = React.useMemo(() => {
    if (!selectionActive) return paid.rows;
    return paid.rows.filter((row) => selectedIds.has(row.id));
  }, [paid.rows, selectedIds, selectionActive]);

  const navigateTo = React.useCallback(
    (next: OrdersSegment) => {
      if (next === segment && next === urlSegment && loadingTo == null) return;
      setNavError(null);
      setLoadingTo(next);
      const href = segmentHref(next, pageSize);
      router.push(href, { scroll: false });
      router.refresh();
    },
    [loadingTo, pageSize, router, segment, urlSegment],
  );

  const applyDateFilter = React.useCallback(() => {
    setFilterError(null);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("status", "paid");
    params.set(pageSizeParam, String(pageSize));
    params.set(paidPageParam, "1");

    if (draftAll) {
      params.set("all", "1");
      params.delete("from");
      params.delete("to");
    } else {
      const fromIso = parseDdMmYyyyToIso(draftFrom);
      const toIso = parseDdMmYyyyToIso(draftTo);
      if (!fromIso || !toIso) {
        setFilterError(
          "Enter From and To as DD-MM-YYYY, or enable All Orders.",
        );
        return;
      }
      params.delete("all");
      params.set("from", fromIso);
      params.set("to", toIso);
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    router.refresh();
  }, [
    draftAll,
    draftFrom,
    draftTo,
    pageSize,
    pageSizeParam,
    paidPageParam,
    pathname,
    router,
    searchParams,
  ]);

  const toggleSelect = React.useCallback((orderId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }, []);

  const selectAllOnPage = React.useCallback(() => {
    setSelectedIds(new Set(paid.rows.map((row) => row.id)));
  }, [paid.rows]);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const downloadBulkPdf = React.useCallback(async () => {
    if (downloadingBulkPdf || ordersForPdf.length === 0) return;
    setDownloadingBulkPdf(true);
    try {
      await downloadOrdersPdf(adminOrdersToPdfLabels(ordersForPdf));
      toast({
        title: "PDF downloaded",
        description: selectionActive
          ? `Shipping labels for ${ordersForPdf.length} selected order${ordersForPdf.length === 1 ? "" : "s"}.`
          : `Shipping labels for ${ordersForPdf.length} paid order${ordersForPdf.length === 1 ? "" : "s"} (${dateFilterLabel}).`,
      });
    } catch (error) {
      const message =
        error instanceof PdfAddressTooLongError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown error";
      toast({
        title: "Failed to generate PDF",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDownloadingBulkPdf(false);
    }
  }, [
    dateFilterLabel,
    downloadingBulkPdf,
    ordersForPdf,
    selectionActive,
    toast,
  ]);

  return (
    <div className={cn("space-y-4", showPaidPacking && "pb-28")}>
      <div
        className="grid gap-4 md:grid-cols-2"
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
          aria-busy={isLoading && displaySegment === "paid"}
          onClick={(event) => {
            event.preventDefault();
            navigateTo("paid");
          }}
          className={cn(
            "rounded-lg border p-4 text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            displaySegment === "paid"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
          )}
        >
          <p
            className={cn(
              "text-xs uppercase tracking-wide",
              displaySegment === "paid"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            Paid orders
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {counts.paid}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Counted in dashboard revenue and top products
          </p>
        </Link>

        <Link
          href={segmentHref("unpaid", pageSize)}
          replace
          scroll={false}
          prefetch
          role="tab"
          aria-selected={displaySegment === "unpaid"}
          aria-busy={isLoading && displaySegment === "unpaid"}
          onClick={(event) => {
            event.preventDefault();
            navigateTo("unpaid");
          }}
          className={cn(
            "rounded-lg border p-4 text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            displaySegment === "unpaid"
              ? "border-destructive bg-destructive/5 shadow-sm"
              : "border-border bg-card hover:border-destructive/40 hover:bg-muted/30",
          )}
        >
          <p
            className={cn(
              "text-xs uppercase tracking-wide",
              displaySegment === "unpaid"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            Unpaid / pending
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {counts.pending}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Follow up — payment not completed
          </p>
        </Link>
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
            orders
            {active.totalCount > 0 ? <> ({active.totalCount})</> : null}
            {segment === "paid" ? (
              <>
                {" "}
                · <span className="text-foreground">{dateFilterLabel}</span>
              </>
            ) : null}
          </>
        )}
      </p>

      {showPaidPacking ? (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="paid-from-date">From (DD-MM-YYYY)</Label>
              <Input
                id="paid-from-date"
                inputMode="numeric"
                placeholder="DD-MM-YYYY"
                value={draftFrom}
                disabled={draftAll}
                onChange={(event) => setDraftFrom(event.target.value)}
                className="w-[140px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid-to-date">To (DD-MM-YYYY)</Label>
              <Input
                id="paid-to-date"
                inputMode="numeric"
                placeholder="DD-MM-YYYY"
                value={draftTo}
                disabled={draftAll}
                onChange={(event) => setDraftTo(event.target.value)}
                className="w-[140px]"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id="paid-all-orders"
                checked={draftAll}
                onCheckedChange={(checked) => {
                  setDraftAll(checked === true);
                  setFilterError(null);
                }}
              />
              <Label htmlFor="paid-all-orders" className="cursor-pointer">
                All Orders
              </Label>
            </div>
            <Button type="button" size="sm" onClick={applyDateFilter}>
              Apply
            </Button>
          </div>
          {filterError ? (
            <p className="text-sm text-destructive">{filterError}</p>
          ) : null}

          {paid.rows.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-sm">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={selectAllOnPage}
              >
                Select page ({paid.rows.length})
              </Button>
              {selectionActive ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                >
                  Clear selection ({selectedIds.size})
                </Button>
              ) : (
                <span className="text-muted-foreground">
                  Select orders for PDF, or leave empty to use this filtered
                  list.
                </span>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {navError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <p className="text-destructive">{navError}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigateTo(urlSegment)}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {isLoading ? (
        <OrdersListSkeleton />
      ) : (
        <AdminOrdersList
          key={segment}
          orders={active.rows}
          totalCount={active.totalCount}
          page={active.page}
          pageSize={active.pageSize}
          pageParam={segment === "unpaid" ? unpaidPageParam : paidPageParam}
          pageSizeParam={pageSizeParam}
          resetPageParams={resetPageParams}
          enableSelection={segment === "paid"}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          emptyMessage={
            segment === "unpaid"
              ? "No unpaid orders right now."
              : paidDateFilter.allOrders
                ? "No paid orders yet."
                : `No paid orders for ${dateFilterLabel}.`
          }
        />
      )}

      {showPaidPacking ? (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-8 md:right-8">
          {selectionActive || !paidDateFilter.allOrders ? (
            <p className="max-w-[220px] rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-medium text-primary-foreground shadow-md">
              {selectionActive
                ? `PDF uses ${selectedIds.size} selected`
                : `PDF uses filtered list (${dateFilterLabel})`}
            </p>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="relative min-h-12 min-w-12 gap-2 rounded-xl px-4 py-3 shadow-lg"
            onClick={() => void downloadBulkPdf()}
            disabled={
              downloadingBulkPdf ||
              ordersForPdf.length === 0 ||
              (selectionActive && ordersForPdf.length === 0)
            }
            title={
              selectionActive
                ? "Download shipping labels for selected orders"
                : "Download shipping labels for filtered paid orders on this page"
            }
          >
            {downloadingBulkPdf ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <FileDown className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">
              {downloadingBulkPdf ? "Generating…" : "PDF"}
            </span>
            {selectionActive ? (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-semibold text-foreground ring-2 ring-primary"
                aria-hidden
              >
                {selectedIds.size}
              </span>
            ) : null}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
