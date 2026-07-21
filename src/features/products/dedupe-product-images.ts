export type ProductShowcaseImage = {
  id: string;
  key: string;
  alt?: string | null;
};

/** Featured + gallery without repeating the same media id. */
export function dedupeProductShowcaseImages(
  featured: ProductShowcaseImage | null | undefined,
  gallery: Array<ProductShowcaseImage | null | undefined>,
): ProductShowcaseImage[] {
  const raw = [featured, ...gallery].filter(
    (image): image is ProductShowcaseImage => Boolean(image?.id && image?.key),
  );
  const seen = new Set<string>();
  const unique: ProductShowcaseImage[] = [];
  for (const image of raw) {
    if (seen.has(image.id)) continue;
    seen.add(image.id);
    unique.push(image);
  }
  return unique;
}
