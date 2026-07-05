export type CashfreeCheckoutResult = {
  error?: { message?: string; type?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

export function readCashfreeCheckoutError(
  result: CashfreeCheckoutResult | null | undefined,
): string | null {
  const message = String(result?.error?.message ?? "").trim();
  if (!message) return null;

  const normalized = message.toLowerCase();
  if (
    normalized.includes("whitelist") ||
    normalized.includes("domain") ||
    normalized.includes("not allowed")
  ) {
    return `${message} Add https://www.sairaghavendratex.com under Cashfree Dashboard → Developers → Whitelisting.`;
  }

  return message;
}

export async function withCheckoutTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
