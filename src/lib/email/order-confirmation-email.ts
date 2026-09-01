import type { SelectOrders } from "@/lib/supabase/schema";

export type OrderConfirmationEmailResult = {
  sent: boolean;
  skipped?:
    | "not_configured"
    | "not_paid"
    | "already_notified"
    | "no_email"
    | "error";
  error?: string;
};

/** Stub until Resend order confirmation email is ported from Hub. */
export async function notifyOrderConfirmationEmail(
  _order: SelectOrders,
): Promise<OrderConfirmationEmailResult> {
  return { sent: false, skipped: "not_configured" };
}
