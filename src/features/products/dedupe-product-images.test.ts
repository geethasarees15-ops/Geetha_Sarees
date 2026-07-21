import { dedupeProductShowcaseImages } from "./dedupe-product-images";

describe("dedupeProductShowcaseImages", () => {
  it("keeps featured once when gallery repeats it", () => {
    const featured = { id: "m1", key: "a.jpg", alt: "A" };
    const result = dedupeProductShowcaseImages(featured, [
      featured,
      { id: "m2", key: "b.jpg", alt: "B" },
    ]);
    expect(result.map((image) => image.id)).toEqual(["m1", "m2"]);
  });

  it("drops nullish entries", () => {
    expect(
      dedupeProductShowcaseImages(null, [
        undefined,
        { id: "m3", key: "c.jpg" },
      ]),
    ).toEqual([{ id: "m3", key: "c.jpg" }]);
  });
});
