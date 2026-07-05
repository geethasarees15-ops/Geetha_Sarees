import {
  buildClientCashfreeReturnUrl,
  parseCashfreeCheckoutSessionPayload,
} from "@/lib/payments/cashfree-checkout-client";

describe("cashfree-checkout-client", () => {
  it("builds client return URLs from the current origin", () => {
    expect(
      buildClientCashfreeReturnUrl("https://www.sairaghavendratex.com"),
    ).toBe(
      "https://www.sairaghavendratex.com/api/cashfree/redirect?order_id={order_id}",
    );
  });

  it("parses valid checkout session payloads", () => {
    const parsed = parseCashfreeCheckoutSessionPayload({
      provider: "cashfree",
      orderId: "order_123",
      paymentSessionId: "session_abc123",
      environment: "production",
      returnUrl:
        "https://www.sairaghavendratex.com/api/cashfree/redirect?order_id={order_id}",
      checkoutOrigin: "https://www.sairaghavendratex.com",
    });

    expect(parsed.paymentSessionId).toBe("session_abc123");
  });

  it("rejects malformed checkout session payloads", () => {
    expect(() =>
      parseCashfreeCheckoutSessionPayload({
        provider: "cashfree",
        orderId: "order_123",
        paymentSessionId: "bad",
        environment: "production",
        returnUrl:
          "https://www.sairaghavendratex.com/api/cashfree/redirect?order_id={order_id}",
        checkoutOrigin: "https://www.sairaghavendratex.com",
      }),
    ).toThrow("Invalid Cashfree checkout response");
  });
});
