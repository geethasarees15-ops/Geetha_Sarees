export type CheckoutProgressUpdate = {
  step: number;
  totalSteps: number;
  title: string;
  message: string;
};

export const CHECKOUT_TOTAL_STEPS = 4;

export function savingAddressProgress(): CheckoutProgressUpdate {
  return {
    step: 1,
    totalSteps: CHECKOUT_TOTAL_STEPS,
    title: "Processing checkout",
    message: "Saving your delivery details…",
  };
}

export function creatingOrderProgress(): CheckoutProgressUpdate {
  return {
    step: 2,
    totalSteps: CHECKOUT_TOTAL_STEPS,
    title: "Processing checkout",
    message: "Creating your order and confirming prices…",
  };
}

export function preparingPaymentProgress(): CheckoutProgressUpdate {
  return {
    step: 3,
    totalSteps: CHECKOUT_TOTAL_STEPS,
    title: "Processing checkout",
    message: "Loading secure payment. This may take a few seconds…",
  };
}

export function openingPaymentProgress(
  provider?: string,
): CheckoutProgressUpdate {
  const label =
    provider === "cashfree"
      ? "Cashfree"
      : provider === "phonepe"
        ? "PhonePe"
        : provider === "stripe"
          ? "Stripe"
          : "payment gateway";

  return {
    step: 4,
    totalSteps: CHECKOUT_TOTAL_STEPS,
    title: "Almost there",
    message: `Opening ${label}. Please do not close or refresh this page.`,
  };
}
