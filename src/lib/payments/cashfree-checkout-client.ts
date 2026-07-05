import {
  CASHFREE_SDK_URL,
  cashfreeCheckoutSessionSchema,
  readCashfreeCheckoutError,
  validatePaymentSessionId,
  type CashfreeCheckoutSessionPayload,
  type CashfreeEnvironment,
} from "@/lib/payments/cashfree-standards";

export {
  cashfreeCheckoutSessionSchema,
  readCashfreeCheckoutError,
  validatePaymentSessionId,
  type CashfreeCheckoutSessionPayload,
  type CashfreeEnvironment,
};

export type CashfreeCheckoutResult = {
  error?: { message?: string; type?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
};

export function parseCashfreeCheckoutSessionPayload(
  payload: unknown,
): CashfreeCheckoutSessionPayload {
  const parsed = cashfreeCheckoutSessionSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Invalid Cashfree checkout response from server.");
  }
  return parsed.data;
}

export function buildClientCashfreeReturnUrl(origin: string): string {
  const normalized = origin.trim().replace(/\/$/, "");
  if (!normalized) {
    throw new Error("Cashfree return URL could not be built for this site.");
  }
  return `${normalized}/api/cashfree/redirect?order_id={order_id}`;
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

type CashfreeCheckout = (params: {
  paymentSessionId: string;
  redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | string;
  returnUrl?: string;
}) => Promise<CashfreeCheckoutResult>;

type CashfreeInit = (params: { mode: CashfreeEnvironment }) => {
  checkout: CashfreeCheckout;
};

let cashfreeLoaderPromise: Promise<CashfreeInit> | null = null;

async function loadCashfreeSdk(): Promise<CashfreeInit> {
  if (typeof window === "undefined") {
    throw new Error("Cashfree checkout is only available in browser");
  }

  if (window.Cashfree) {
    return window.Cashfree as CashfreeInit;
  }

  if (!cashfreeLoaderPromise) {
    cashfreeLoaderPromise = new Promise<CashfreeInit>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CASHFREE_SDK_URL;
      script.async = true;
      script.onload = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree as CashfreeInit);
        } else {
          reject(new Error("Cashfree SDK loaded but was unavailable"));
        }
      };
      script.onerror = () =>
        reject(new Error("Failed to load Cashfree checkout SDK"));
      document.head.appendChild(script);
    });
  }

  return cashfreeLoaderPromise;
}

export async function openCashfreeCheckout(params: {
  payload: CashfreeCheckoutSessionPayload;
  origin: string;
  timeoutMs?: number;
}): Promise<void> {
  const session = parseCashfreeCheckoutSessionPayload(params.payload);
  if (!validatePaymentSessionId(session.paymentSessionId)) {
    throw new Error("Invalid Cashfree payment session.");
  }

  const sdk = await loadCashfreeSdk();
  const cashfree = sdk({
    mode: session.environment === "production" ? "production" : "sandbox",
  });

  const returnUrl = buildClientCashfreeReturnUrl(params.origin);
  const timeoutMs = params.timeoutMs ?? 30_000;
  const result = await withCheckoutTimeout(
    cashfree.checkout({
      paymentSessionId: session.paymentSessionId,
      redirectTarget: "_top",
      returnUrl,
    }),
    timeoutMs,
    `Cashfree checkout timed out. Whitelist ${params.origin} in Cashfree Dashboard → Developers → Whitelisting.`,
  );

  const cashfreeError = readCashfreeCheckoutError(result, {
    whitelistOrigin: params.origin,
  });
  if (cashfreeError) {
    throw new Error(cashfreeError);
  }
}

declare global {
  interface Window {
    Cashfree?: unknown;
  }
}
