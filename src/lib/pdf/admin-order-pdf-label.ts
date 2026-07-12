import { siteConfig } from "@/config/site";
import type { AdminOrderListView } from "@/lib/admin/getAdminOrdersList";
import {
  formatPdfFromAddress,
  formatPdfToAddress,
  prepareValidatedPdfAddresses,
  stripRegisteredMarks,
} from "@/lib/pdf/pdf-label-text";
import type { PdfLabelOrder } from "@/lib/pdf/shipping-label-pdf";

/** Shop FROM block for parcel labels — PDF rules: no ®, no GSTIN. */
export function buildAdminPdfSenderDetails(): string {
  const lines = [
    stripRegisteredMarks(siteConfig.name),
    ...siteConfig.addressLines,
    siteConfig.phone ? `Ph: ${siteConfig.phone}` : null,
  ].filter((line): line is string => Boolean(line && line.trim()));

  return formatPdfFromAddress(lines.join("\n"));
}

export function adminOrderToPdfLabel(
  order: Pick<AdminOrderListView, "id" | "copyAddressText">,
  senderDetails = buildAdminPdfSenderDetails(),
): PdfLabelOrder {
  const { from, to } = prepareValidatedPdfAddresses({
    from: senderDetails,
    to: order.copyAddressText || "Address not available",
  });

  return {
    id: order.id,
    sender_details: from,
    recipient_details: to || formatPdfToAddress("Address not available"),
  };
}

export function adminOrdersToPdfLabels(
  orders: Pick<AdminOrderListView, "id" | "copyAddressText">[],
): PdfLabelOrder[] {
  const sender = buildAdminPdfSenderDetails();
  return orders.map((order) => adminOrderToPdfLabel(order, sender));
}
