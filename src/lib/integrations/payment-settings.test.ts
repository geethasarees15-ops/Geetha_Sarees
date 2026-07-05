import { describe, expect, it } from "vitest";
import {
  normalizePhonePeIncoming,
  parseEnabledPhonePeValue,
  parseIncomingPhonePeForEnable,
} from "./payment-settings";

describe("payment-settings", () => {
  it("allows saving disabled PhonePe without merchant credentials", () => {
    const normalized = normalizePhonePeIncoming({
      merchantId: "",
      saltKey: "",
      saltIndex: "",
    });

    expect(normalized.merchantId).toBe("");
    expect(parseEnabledPhonePeValue(normalized).success).toBe(false);
  });

  it("requires complete PhonePe credentials when enabling", () => {
    const parsed = parseIncomingPhonePeForEnable({
      merchantId: "PGTEST",
      saltIndex: "1",
      saltKey: "secret",
    });

    expect(parsed.success).toBe(true);
  });
});
