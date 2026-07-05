import type { CartItems } from "@/features/carts";
import type { SavedShippingAddress } from "@/features/addresses/validations/addressFormSchema";
import type { CheckoutProgressUpdate } from "@/features/checkout/checkout-progress";
import {
  creatingOrderProgress,
  openingPaymentProgress,
  preparingPaymentProgress,
} from "@/features/checkout/checkout-progress";
import { fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import {
  readCashfreeCheckoutError,
  withCheckoutTimeout,
} from "@/lib/payments/cashfree-checkout-client";
import { getStripe } from "@/lib/stripe/stripeClient";

type StartCheckoutParams = {
  order: CartItems;
  guest: boolean;
  shipping: SavedShippingAddress;
  promoCode?: string | null;
  onProgress?: (update: CheckoutProgressUpdate) => void;
};

type CashfreeCheckoutPayload = {
  provider: "cashfree";
  orderId: string;
  paymentSessionId: string;
  environment: "sandbox" | "production";
};

const CHECKOUT_SESSION_TIMEOUT_MS = 45_000;
const CASHFREE_OPEN_TIMEOUT_MS = 30_000;

type CashfreeCheckout = (params: {
  paymentSessionId: string;
  redirectTarget?: "_self" | "_blank" | "_top" | "_modal" | string;
  returnUrl?: string;
}) => Promise<{
  error?: { message?: string; type?: string };
  redirect?: boolean;
}>;

type CashfreeInit = (params: { mode: "sandbox" | "production" }) => {
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
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
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

export async function startCheckout({
  order,
  guest,
  shipping,
  promoCode,
  onProgress,
}: StartCheckoutParams) {
  onProgress?.(creatingOrderProgress());

  const res = await fetchWithTimeout("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderProducts: order,
      guest,
      shipping: {
        addressId: shipping.addressId,
        fullName: shipping.fullName,
        email: shipping.email,
        mobile: shipping.mobile,
        state: shipping.state,
      },
      promoCode: promoCode ?? null,
    }),
    timeoutMs: CHECKOUT_SESSION_TIMEOUT_MS,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    const message = payload?.message || "Checkout failed";
    throw new Error(message);
  }

  const payload = (await res.json()) as
    | CashfreeCheckoutPayload
    | { provider: "phonepe"; redirectUrl: string }
    | { provider: "stripe"; sessionId: string };

  if (payload.provider === "cashfree") {
    onProgress?.(preparingPaymentProgress());
    const sdk = await loadCashfreeSdk();
    onProgress?.(openingPaymentProgress("cashfree"));
    const cashfree = sdk({
      mode: payload.environment === "production" ? "production" : "sandbox",
    });

    const returnUrl = `${window.location.origin}/api/cashfree/redirect?order_id={order_id}`;
    const result = await withCheckoutTimeout(
      cashfree.checkout({
        paymentSessionId: payload.paymentSessionId,
        redirectTarget: "_top",
        returnUrl,
      }),
      CASHFREE_OPEN_TIMEOUT_MS,
      "Cashfree checkout timed out. If this keeps happening, whitelist https://www.sairaghavendratex.com in Cashfree Dashboard → Developers → Whitelisting.",
    );

    const cashfreeError = readCashfreeCheckoutError(result);
    if (cashfreeError) {
      throw new Error(cashfreeError);
    }

    return;
  }

  if (payload.provider === "phonepe") {
    onProgress?.(openingPaymentProgress("phonepe"));
    window.location.assign(payload.redirectUrl);
    return;
  }

  onProgress?.(preparingPaymentProgress());
  const { sessionId } = payload;
  onProgress?.(openingPaymentProgress("stripe"));
  const stripe = await getStripe();
  const result = await stripe?.redirectToCheckout({ sessionId });

  if (result?.error) {
    throw new Error("Could not open payment checkout. Please try again.");
  }
}

declare global {
  interface Window {
    Cashfree?: unknown;
  }
}
