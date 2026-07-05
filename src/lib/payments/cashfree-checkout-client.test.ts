import { readCashfreeCheckoutError } from "@/lib/payments/cashfree-checkout-client";

describe("readCashfreeCheckoutError", () => {
  it("returns null when Cashfree checkout succeeds", () => {
    expect(readCashfreeCheckoutError({ redirect: true })).toBeNull();
  });

  it("returns the Cashfree error message", () => {
    expect(
      readCashfreeCheckoutError({
        error: { message: "Invalid payment session" },
      }),
    ).toBe("Invalid payment session");
  });

  it("adds whitelisting guidance for domain errors", () => {
    const message = readCashfreeCheckoutError({
      error: { message: "Domain is not whitelisted" },
    });

    expect(message).toContain("Domain is not whitelisted");
    expect(message).toContain("Whitelisting");
  });
});
