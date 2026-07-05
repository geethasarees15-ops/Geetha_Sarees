export const STOCK_RESERVATION_TTL_MINUTES = 15;

export type StockReservationLine = {
  productId: string;
  quantity: number;
  size?: string;
};

export function shouldReserveStockAtCheckout(
  paymentEnvironment: "sandbox" | "production",
): boolean {
  return paymentEnvironment === "production";
}

export function buildReservationExpiryIso(
  now = Date.now(),
  ttlMinutes = STOCK_RESERVATION_TTL_MINUTES,
): string {
  return new Date(now + ttlMinutes * 60_000).toISOString();
}

export function readReservationLines(
  meta: Record<string, unknown>,
): StockReservationLine[] {
  const raw = meta.stockReservationLines;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = item as Record<string, unknown>;
      const productId = String(row.productId ?? "").trim();
      const quantity = Number(row.quantity ?? 0);
      const size = String(row.size ?? "")
        .trim()
        .toUpperCase();
      if (!productId || quantity <= 0) return null;
      return {
        productId,
        quantity,
        ...(size ? { size } : {}),
      } satisfies StockReservationLine;
    })
    .filter((line): line is StockReservationLine => line !== null);
}

export function isReservationExpired(
  meta: Record<string, unknown>,
  now = Date.now(),
): boolean {
  const expiresAt = String(meta.stockReservationExpiresAt ?? "").trim();
  if (!expiresAt) return false;
  const expiresMs = Date.parse(expiresAt);
  if (!Number.isFinite(expiresMs)) return false;
  return expiresMs <= now;
}

export function hasActiveStockReservation(
  meta: Record<string, unknown>,
): boolean {
  return (
    meta.stockReserved === true &&
    meta.stockReleased !== true &&
    readReservationLines(meta).length > 0
  );
}
