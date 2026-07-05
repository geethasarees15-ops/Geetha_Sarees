import { getEffectiveProductPrice } from "@/lib/products/discount";

describe("shop by price alignment", () => {
  it("matches homepage bucket bounds for mid-tier sarees", () => {
    const products = [
      { price: "899.00", discountEnabled: false, discountPercent: null },
      { price: "999.00", discountEnabled: false, discountPercent: null },
      { price: "750.00", discountEnabled: false, discountPercent: null },
    ];

    const in800to999 = products.filter((product) => {
      const effective = getEffectiveProductPrice(product);
      return effective >= 800 && effective <= 999;
    });

    expect(in800to999).toHaveLength(2);
  });

  it("uses discounted sale price for bucket placement", () => {
    const product = {
      price: "1200.00",
      discountEnabled: true,
      discountPercent: 40,
    };

    expect(getEffectiveProductPrice(product)).toBe(720);
    expect(getEffectiveProductPrice(product)).toBeGreaterThanOrEqual(500);
    expect(getEffectiveProductPrice(product)).toBeLessThanOrEqual(799);
  });
});
