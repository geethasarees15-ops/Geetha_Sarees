import {
  MAX_PRODUCT_IMAGES,
  normalizeProductImageMediaIds,
} from "./product-gallery-shared";

describe("normalizeProductImageMediaIds", () => {
  it("dedupes, trims, and preserves order", () => {
    expect(
      normalizeProductImageMediaIds([" a ", "b", "a", "", "  ", "c", "b"]),
    ).toEqual(["a", "b", "c"]);
  });

  it("caps at MAX_PRODUCT_IMAGES", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `id-${i}`);
    const normalized = normalizeProductImageMediaIds(ids);
    expect(normalized).toHaveLength(MAX_PRODUCT_IMAGES);
    expect(normalized[0]).toBe("id-0");
    expect(normalized[MAX_PRODUCT_IMAGES - 1]).toBe(
      `id-${MAX_PRODUCT_IMAGES - 1}`,
    );
  });

  it("returns empty for empty input", () => {
    expect(normalizeProductImageMediaIds([])).toEqual([]);
  });
});
