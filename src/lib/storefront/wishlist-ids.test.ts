import {
  orderWishlistProductIds,
  uniqueWishlistProductIds,
} from "./wishlist-ids";

describe("wishlist id helpers", () => {
  it("dedupes and preserves first-seen order for guest fetches", () => {
    expect(uniqueWishlistProductIds(["a", "b", "a", "", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("orders published ids by wishlist preference order", () => {
    expect(orderWishlistProductIds(["c", "a", "b"], ["a", "x", "c"])).toEqual([
      "c",
      "a",
    ]);
  });
});
