import {
  normalizeProductFormPayload,
  productStorefrontVisibilitySummary,
} from "./normalize-product-form-payload";

describe("normalizeProductFormPayload", () => {
  it("normalizes featured and draft flags", () => {
    const payload = normalizeProductFormPayload({
      name: " Silk Saree ",
      slug: "silk-saree",
      description: "",
      rating: "4",
      price: "999",
      stock: 2,
      isDraft: 0 as unknown as boolean,
      featured: 1 as unknown as boolean,
      badge: "best_sale",
      tags: [],
      collectionId: null,
      featuredImageId: "img-1",
    });

    expect(payload.name).toBe("Silk Saree");
    expect(payload.isDraft).toBe(false);
    expect(payload.featured).toBe(true);
    expect(payload.badge).toBe("best_sale");
  });

  it("defaults empty price and rating to safe numeric strings", () => {
    const payload = normalizeProductFormPayload({
      name: "Test",
      slug: "test",
      description: "",
      rating: "",
      price: "",
      stock: 1,
      tags: [],
      collectionId: null,
      featuredImageId: "img-1",
    });

    expect(payload.price).toBe("0");
    expect(payload.rating).toBe("4");
  });

  it("clears invalid badge values", () => {
    const payload = normalizeProductFormPayload({
      name: "Test",
      slug: "test",
      description: "",
      rating: "4",
      price: "100",
      stock: 1,
      badge: "invalid" as never,
      tags: [],
      collectionId: null,
      featuredImageId: "img-1",
    });

    expect(payload.badge).toBeNull();
  });
});

describe("productStorefrontVisibilitySummary", () => {
  it("describes featured live products", () => {
    expect(
      productStorefrontVisibilitySummary({ featured: true, isDraft: false }),
    ).toContain("Featured");
  });

  it("describes draft products", () => {
    expect(
      productStorefrontVisibilitySummary({ featured: true, isDraft: true }),
    ).toContain("draft");
  });
});
