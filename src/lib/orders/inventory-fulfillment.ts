import { invalidateStorefrontCache } from "@/lib/cache/invalidate-storefront";
import {
  getIntegrationSetting,
  INTEGRATION_KEYS,
} from "@/lib/integrations/settings";
import { mergePaymentMeta, readPaymentMeta } from "@/lib/orders/payment-meta";
import { shouldDeductStockForPaidOrder } from "@/lib/orders/payment-fulfillment";
import {
  confirmStockReservation,
  hasActiveStockReservation,
  releaseStockReservation,
} from "@/lib/orders/stock-reservation";
import {
  getProductSizeConfigKey,
  normalizeProductSizeConfig,
  type ProductSizeConfig,
} from "@/lib/products/sizeConfig";
import db from "@/lib/supabase/db";
import {
  apiSettings,
  orderLines,
  orders,
  products,
  type SelectOrders,
} from "@/lib/supabase/schema";
import { eq, inArray, sql } from "drizzle-orm";

type FulfillmentResult = {
  fulfilled: boolean;
  skippedReason?: string;
};

function readSelectedSizes(meta: Record<string, unknown>) {
  const raw = meta.sizes;
  if (!raw || typeof raw !== "object") return {} as Record<string, string>;

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([productId, size]) => [
      productId,
      String(size ?? "")
        .trim()
        .toUpperCase(),
    ]),
  );
}

async function loadSizeConfigs(productIds: string[]) {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return new Map<string, ProductSizeConfig>();

  const keys = unique.map(getProductSizeConfigKey);
  const rows = await db
    .select({ key: apiSettings.key, value: apiSettings.value })
    .from(apiSettings)
    .where(inArray(apiSettings.key, keys));

  const map = new Map<string, ProductSizeConfig>();
  rows.forEach((row) => {
    const productId = row.key.replace(/^product_size_/, "");
    map.set(productId, normalizeProductSizeConfig(row.value));
  });
  return map;
}

export async function fulfillPaidOrderInventory(
  orderId: string,
): Promise<FulfillmentResult> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { fulfilled: false, skippedReason: "order_not_found" };
  }

  if (order.payment_status !== "paid") {
    return { fulfilled: false, skippedReason: "not_paid" };
  }

  const meta = readPaymentMeta(order.payment_meta);
  if (meta.inventoryFulfilled === true) {
    return { fulfilled: true, skippedReason: "already_fulfilled" };
  }

  const shouldDeduct = await shouldDeductStockForPaidOrder({
    paymentProvider: order.payment_provider,
    paymentMeta: meta,
  });

  if (!shouldDeduct) {
    if (hasActiveStockReservation(meta)) {
      await releaseStockReservation(orderId, "non_production_payment");
    }

    await db
      .update(orders)
      .set({
        payment_meta: mergePaymentMeta(meta, {
          inventoryFulfilled: false,
          inventorySkippedReason: "test_or_non_production_payment",
        }),
      })
      .where(eq(orders.id, order.id));

    return {
      fulfilled: false,
      skippedReason: "test_or_non_production_payment",
    };
  }

  const stockControlSetting = await getIntegrationSetting(
    INTEGRATION_KEYS.stockControl,
  );
  if (!stockControlSetting?.isEnabled) {
    return { fulfilled: false, skippedReason: "stock_control_disabled" };
  }

  if (hasActiveStockReservation(meta)) {
    const confirmed = await confirmStockReservation(orderId);
    return {
      fulfilled: confirmed.confirmed,
      skippedReason: confirmed.skippedReason,
    };
  }

  const lines = await db
    .select({
      productId: orderLines.productId,
      quantity: orderLines.quantity,
    })
    .from(orderLines)
    .where(eq(orderLines.orderId, order.id));

  if (lines.length === 0) {
    return { fulfilled: false, skippedReason: "no_lines" };
  }

  const selectedSizes = readSelectedSizes(meta);
  const sizeConfigs = await loadSizeConfigs(
    lines.map((line) => line.productId),
  );

  await db.transaction(async (tx) => {
    for (const line of lines) {
      await tx
        .update(products)
        .set({
          stock: sql`GREATEST(${products.stock} - ${line.quantity}, 0)`,
        })
        .where(eq(products.id, line.productId));

      const selectedSize = selectedSizes[line.productId];
      const sizeConfig = sizeConfigs.get(line.productId);
      if (
        !selectedSize ||
        !sizeConfig?.enabled ||
        sizeConfig.options.length === 0
      ) {
        continue;
      }

      const nextOptions = sizeConfig.options.map((option) => {
        const optionSize = String(option.size ?? "")
          .trim()
          .toUpperCase();
        if (optionSize !== selectedSize) return option;
        return {
          ...option,
          qty: Math.max(0, Number(option.qty ?? 0) - line.quantity),
        };
      });

      const normalized = normalizeProductSizeConfig({
        enabled: sizeConfig.enabled,
        options: nextOptions,
      });
      const key = getProductSizeConfigKey(line.productId);

      await tx
        .insert(apiSettings)
        .values({
          key,
          value: normalized,
          isEnabled: normalized.enabled,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: apiSettings.key,
          set: {
            value: normalized,
            isEnabled: normalized.enabled,
            updatedAt: new Date().toISOString(),
          },
        });
    }

    await tx
      .update(orders)
      .set({
        payment_meta: mergePaymentMeta(meta, {
          inventoryFulfilled: true,
          inventoryFulfilledAt: new Date().toISOString(),
        }),
      })
      .where(eq(orders.id, order.id));
  });

  await invalidateStorefrontCache();

  return { fulfilled: true };
}
