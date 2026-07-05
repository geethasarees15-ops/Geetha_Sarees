import {
  CASHFREE_SDK_URL,
  cashfreeCheckoutSessionSchema,
  getCashfreeHostedCheckoutUrl,
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

/** Mirrors Cashfree SDK redirect checkout: POST form to hosted checkout URL. */
export function submitCashfreeHostedCheckoutForm(params: {
  paymentSessionId: string;
  returnUrl: string;
  environment: CashfreeEnvironment;
  hostedCheckoutUrl?: string;
  redirectTarget?: "_self" | "_blank" | "_top";
}): void {
  if (typeof document === "undefined") {
    throw new Error("Cashfree hosted checkout is only available in browser");
  }

  const action =
    params.hostedCheckoutUrl?.trim() ||
    getCashfreeHostedCheckoutUrl(params.environment);
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.target = params.redirectTarget ?? "_self";
  form.style.display = "none";

  const fields: Record<string, string> = {
    payment_session_id: params.paymentSessionId,
    return_url: params.returnUrl,
  };

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

async function openCashfreeCheckoutViaSdk(params: {
  session: CashfreeCheckoutSessionPayload;
  returnUrl: string;
  timeoutMs: number;
}): Promise<void> {
  const sdk = await loadCashfreeSdk();
  const cashfree = sdk({
    mode: params.session.environment === "production" ? "production" : "sandbox",
  });

  const result = await withCheckoutTimeout(
    cashfree.checkout({
      paymentSessionId: params.session.paymentSessionId,
      redirectTarget: "_self",
      returnUrl: params.returnUrl,
    }),
    params.timeoutMs,
    "Cashfree SDK checkout timed out",
  );

  if (result?.redirect) {
    return;
  }

  const cashfreeError = readCashfreeCheckoutError(result, {
    whitelistOrigin: params.session.checkoutOrigin,
  });
  if (cashfreeError) {
    throw new Error(cashfreeError);
  }
}

export async function openCashfreeCheckout(params: {
  payload: CashfreeCheckoutSessionPayload;
  timeoutMs?: number;
}): Promise<void> {
  const session = parseCashfreeCheckoutSessionPayload(params.payload);
  if (!validatePaymentSessionId(session.paymentSessionId)) {
    throw new Error("Invalid Cashfree payment session.");
  }

  const returnUrl = session.returnUrl.trim();
  if (!returnUrl) {
    throw new Error("Cashfree return URL missing from checkout session.");
  }

  const timeoutMs = params.timeoutMs ?? 8_000;

  try {
    await openCashfreeCheckoutViaSdk({
      session,
      returnUrl,
      timeoutMs,
    });
    return;
  } catch (error) {
    console.warn("[cashfree] SDK checkout failed, using hosted form fallback:", error);
  }

  submitCashfreeHostedCheckoutForm({
    paymentSessionId: session.paymentSessionId,
    returnUrl,
    environment: session.environment,
    hostedCheckoutUrl: session.hostedCheckoutUrl,
    redirectTarget: "_self",
  });
}

declare global {
  interface Window {
    Cashfree?: unknown;
  }
}
