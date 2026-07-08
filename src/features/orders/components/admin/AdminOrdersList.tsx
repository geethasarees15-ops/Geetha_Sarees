"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { AdminOrderListView } from "@/lib/admin/getAdminOrdersList";
import { cn, formatDate, formatPrice } from "@/lib/utils";

type Props = {
  orders: AdminOrderListView[];
  emptyMessage?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
};

async function copyTextToClipboard(text: string) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  textArea.remove();
}

function paymentBadgeClass(paymentStatus: string) {
  const normalized = paymentStatus.trim().toLowerCase();
  return normalized === "paid" ||
    normalized === "success" ||
    normalized === "captured"
    ? "border-emerald-500 text-emerald-700"
    : "border-amber-500 text-amber-700";
}

function AdminOrderRow({ order }: { order: AdminOrderListView }) {
  const { toast } = useToast();

  const copyAddress = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await copyTextToClipboard(order.copyAddressText);
      toast({
        title: "Address copied",
        description: "Ready to paste in courier / WhatsApp.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy address",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    }
  };

  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="group block rounded-lg border bg-card transition-colors hover:border-primary/30 hover:bg-muted/20"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">#{order.id}</p>
            <Badge variant="outline" className="capitalize">
              {order.orderStatus ?? "pending"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                paymentBadgeClass(order.paymentStatus),
              )}
            >
              {order.paymentStatus}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </span>
          </div>

          <div className="space-y-2">
            {order.lines.length > 0 ? (
              order.lines.map((line) => (
                <div key={line.id} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={line.imageUrl}
                      alt={line.imageAlt}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="line-clamp-1 font-medium">
                      {line.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code: {line.productCode ?? "—"} • Qty: {line.quantity}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No line items</p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {order.customerName ?? "Guest customer"}
            {order.customerMobile ? ` • ${order.customerMobile}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <p className="text-sm font-semibold sm:text-right">
            {formatPrice(order.amount)}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={(event) => void copyAddress(event)}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Address
          </Button>
        </div>
      </div>
    </Link>
  );
}

export function AdminOrdersList({
  orders,
  emptyMessage = "No orders in this section.",
  pageSizeOptions = [10, 20, 30, 50],
  defaultPageSize = 20,
}: Props) {
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);

  const totalCount = orders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Clamp the current page whenever the data or page size changes so we never
  // land on an empty page after refresh / status changes.
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  React.useEffect(() => {
    if (safePageIndex !== pageIndex) setPageIndex(safePageIndex);
  }, [safePageIndex, pageIndex]);

  const start = safePageIndex * pageSize;
  const visibleOrders = orders.slice(start, start + pageSize);

  if (totalCount === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  const rangeStart = start + 1;
  const rangeEnd = Math.min(start + pageSize, totalCount);

  return (
    <div className="space-y-3">
      {visibleOrders.map((order) => (
        <AdminOrderRow key={order.id} order={order} />
      ))}

      <div className="flex flex-col gap-3 px-1 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {rangeStart}–{rangeEnd} of {totalCount}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue placeholder={String(pageSize)} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 px-2"
              disabled={safePageIndex <= 0}
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            >
              Prev
            </Button>
            <span className="text-sm font-medium">
              Page {safePageIndex + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              className="h-8 px-2"
              disabled={safePageIndex >= totalPages - 1}
              onClick={() =>
                setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrdersList;
