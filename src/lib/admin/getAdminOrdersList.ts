import { buildShippingAddressCopyText } from "@/lib/orders/shipping-address-text";
import db from "@/lib/supabase/db";
import {
  address,
  medias,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { keytoUrl } from "@/lib/utils";
import { desc, eq, inArray } from "drizzle-orm";

export type AdminOrderLineView = {
  id: string;
  quantity: number;
  productName: string;
  productCode: string | null;
  imageUrl: string;
  imageAlt: string;
};

export type AdminOrderListView = {
  id: string;
  createdAt: string;
  amount: number;
  orderStatus: string | null;
  paymentStatus: string;
  customerName: string | null;
  customerMobile: string | null;
  shippingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  copyAddressText: string;
  lines: AdminOrderLineView[];
};

export async function getAdminOrdersList(): Promise<AdminOrderListView[]> {
  const orderRows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      amount: orders.amount,
      orderStatus: orders.order_status,
      paymentStatus: orders.payment_status,
      customerName: orders.name,
      customerMobile: orders.customer_mobile,
      addressLine1: address.line1,
      addressLine2: address.line2,
      addressCity: address.city,
      addressState: address.state,
      addressPostalCode: address.postal_code,
      addressCountry: address.country,
    })
    .from(orders)
    .leftJoin(address, eq(orders.addressId, address.id))
    .orderBy(desc(orders.createdAt));

  if (orderRows.length === 0) return [];

  const orderIds = orderRows.map((row) => row.id);
  const lineRows = await db
    .select({
      id: orderLines.id,
      orderId: orderLines.orderId,
      quantity: orderLines.quantity,
      productName: products.name,
      productCode: products.productCode,
      imageKey: medias.key,
      imageAlt: medias.alt,
    })
    .from(orderLines)
    .leftJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(medias, eq(products.featuredImageId, medias.id))
    .where(inArray(orderLines.orderId, orderIds));

  const linesByOrderId = new Map<string, AdminOrderLineView[]>();

  for (const row of lineRows) {
    const line: AdminOrderLineView = {
      id: row.id,
      quantity: row.quantity,
      productName: row.productName || "Product",
      productCode: row.productCode ?? null,
      imageUrl: keytoUrl(row.imageKey ?? undefined),
      imageAlt: row.imageAlt || row.productName || "Product image",
    };

    const existing = linesByOrderId.get(row.orderId) ?? [];
    existing.push(line);
    linesByOrderId.set(row.orderId, existing);
  }

  return orderRows.map((row) => {
    const shippingAddress = row.addressLine1
      ? {
          line1: row.addressLine1,
          line2: row.addressLine2,
          city: row.addressCity,
          state: row.addressState,
          postalCode: row.addressPostalCode,
          country: row.addressCountry,
        }
      : null;

    return {
      id: row.id,
      createdAt: new Date(row.createdAt).toISOString(),
      amount: Number(row.amount),
      orderStatus: row.orderStatus,
      paymentStatus: row.paymentStatus,
      customerName: row.customerName,
      customerMobile: row.customerMobile,
      shippingAddress,
      copyAddressText: buildShippingAddressCopyText({
        customerName: row.customerName,
        customerMobile: row.customerMobile,
        shippingAddress,
      }),
      lines: linesByOrderId.get(row.id) ?? [],
    };
  });
}
