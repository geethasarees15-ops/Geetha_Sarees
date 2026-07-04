import { describe, expect, it } from "vitest";
import {
  buildShopByPriceBuckets,
  formatPriceRangeLabel,
  SHOP_BY_PRICE_BREAKPOINTS,
} from "./shop-by-price-buckets";

describe("buildShopByPriceBuckets", () => {
  it("groups products into catalog buckets and skips empty tiers", () => {
    const buckets = buildShopByPriceBuckets(
      [
        {
          id: "1",
          price: "350",
          mediaKey: "a.jpg",
          mediaAlt: "Budget saree",
        },
        {
          id: "2",
          price: "650",
          mediaKey: "b.jpg",
          mediaAlt: "Mid saree",
        },
        {
          id: "3",
          price: "1200",
          featured: true,
          mediaKey: "c.jpg",
          mediaAlt: "Premium saree",
        },
        {
          id: "4",
          price: "6200",
          mediaKey: "d.jpg",
          mediaAlt: "Luxury saree",
        },
      ],
      SHOP_BY_PRICE_BREAKPOINTS,
    );

    expect(buckets).toHaveLength(4);
    expect(buckets[0]).toMatchObject({
      min: 300,
      max: 499,
      productCount: 1,
      href: "/shop?price_range=300-499&sort=PRICE_LOW_TO_HIGH",
    });
    expect(buckets[1]).toMatchObject({ min: 500, max: 799, productCount: 1 });
    expect(buckets[2]).toMatchObject({ min: 1000, max: 1499, productCount: 1 });
    expect(buckets[3]).toMatchObject({ min: 5000, max: 7000, productCount: 1 });
    expect(buckets[2]?.imageKey).toBe("c.jpg");
  });

  it("uses discounted effective price for bucket placement", () => {
    const buckets = buildShopByPriceBuckets([
      {
        id: "1",
        price: "1000",
        discountEnabled: true,
        discountPercent: 50,
        mediaKey: "sale.jpg",
      },
    ]);

    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toMatchObject({ min: 500, max: 799 });
  });
});

describe("formatPriceRangeLabel", () => {
  it("formats INR ranges without decimals", () => {
    expect(formatPriceRangeLabel(300, 499)).toContain("300");
    expect(formatPriceRangeLabel(300, 499)).toContain("499");
  });
});
