"use client";

import type { CheckoutProgressUpdate } from "@/features/checkout/checkout-progress";

type Props = CheckoutProgressUpdate & {
  open: boolean;
};

export function CheckoutProgressOverlay({
  open,
  title,
  message,
  step,
  totalSteps,
}: Props) {
  if (!open) return null;

  const percent = Math.min(
    100,
    Math.round((step / Math.max(totalSteps, 1)) * 100),
  );

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="checkout-progress-title"
      aria-describedby="checkout-progress-message"
    >
      <div className="w-[min(92vw,380px)] rounded-xl border border-[#E8A317]/40 bg-background p-6 shadow-2xl">
        <p
          id="checkout-progress-title"
          className="text-center text-base font-semibold text-foreground"
        >
          {title}
        </p>
        <p
          id="checkout-progress-message"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          {message}
        </p>
        <p className="mt-4 text-center text-3xl font-bold tabular-nums text-[#8A5A00]">
          {percent}%
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Step {step} of {totalSteps}
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#FDECC8]">
          <div
            className="h-full rounded-full bg-[#E8A317] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Please wait — do not press back or close this tab.
        </p>
      </div>
    </div>
  );
}

export default CheckoutProgressOverlay;
