import {
  sanitizeUploadFileName,
  toMediaAltText,
  truncateUnicode,
} from "./safeUploadFileName";

describe("safeUploadFileName", () => {
  it("strips emoji and odd punctuation from file names", () => {
    const input = "WhatsApp Image 2024-01-01 at 12.30.45 🏆🏆.png";
    const safe = sanitizeUploadFileName(input);
    expect(safe).toMatch(/\.png$/);
    expect(safe).not.toMatch(/🏆/);
    expect(safe.length).toBeLessThanOrEqual(100);
  });

  it("truncates long alt text to 255 code points", () => {
    const long = `${"a".repeat(300)}.jpg`;
    const alt = toMediaAltText(long);
    expect(Array.from(alt).length).toBeLessThanOrEqual(255);
  });

  it("falls back when the base is empty after sanitize", () => {
    expect(sanitizeUploadFileName("🏆🏆.png")).toBe("image.png");
    expect(toMediaAltText("")).toBe("image");
  });

  it("truncateUnicode respects code points", () => {
    expect(truncateUnicode("ab🏆cd", 3)).toBe("ab…");
  });
});
