import {
  expandCountryInToIndia,
  extractIndianMobile,
  formatMobNoLine,
  formatPdfFromAddress,
  formatPdfToAddress,
  prepareValidatedPdfAddresses,
  stripRegisteredMarks,
  validatePdfLabelAddresses,
} from "./pdf-label-text";

describe("stripRegisteredMarks", () => {
  it("removes ® and (R)", () => {
    expect(stripRegisteredMarks("Geetha Sarees®")).toBe(
      "Geetha Sarees",
    );
    expect(stripRegisteredMarks("Brand (R) Name")).toBe("Brand Name");
  });
});

describe("formatPdfFromAddress", () => {
  it("strips brand mark and GSTIN line", () => {
    const from = formatPdfFromAddress(
      [
        "Geetha Sarees",
        "Chettiyar Street",
        "City, State – 000 000",
        "Ph: +91 98765 43210",
        "GSTIN: 33AAAAA0000A1Z5",
      ].join("\n"),
    );
    expect(from).toBe(
      [
        "Geetha Sarees",
        "Chettiyar Street",
        "City, State – 000 000",
        "Ph: +91 98765 43210",
      ].join("\n"),
    );
    expect(from).not.toMatch(/GSTIN/i);
    expect(from).not.toMatch(/®/);
  });
});

describe("formatPdfToAddress", () => {
  it("removes email, expands IN, and puts Mob No last", () => {
    const to = formatPdfToAddress(
      [
        "Rajesh Kumar",
        "12 MG Road",
        "Chennai, TN",
        "IN",
        "600028",
        "rajesh@example.com",
        "9876543210",
      ].join("\n"),
    );
    expect(to).toBe(
      [
        "Rajesh Kumar",
        "12 MG Road",
        "Chennai, TN",
        "India",
        "600028",
        "(Mob No : 9876543210)",
      ].join("\n"),
    );
  });

  it("formats +91 mobile and drops inline email", () => {
    const to = formatPdfToAddress(
      "Asha\nFlat 2, Main Road\nSalem, TN, IN\nasha@mail.com +91 80127 15132",
    );
    expect(to.split("\n").at(-1)).toBe("(Mob No : 8012715132)");
    expect(to).toContain("India");
    expect(to).not.toMatch(/@/);
  });
});

describe("expandCountryInToIndia / extractIndianMobile", () => {
  it("expands trailing IN", () => {
    expect(expandCountryInToIndia("Salem, IN")).toBe("Salem, India");
    expect(expandCountryInToIndia("IN")).toBe("India");
  });

  it("extracts Indian mobiles", () => {
    expect(extractIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(extractIndianMobile(formatMobNoLine("9876543210"))).toBe(
      "9876543210",
    );
  });
});

describe("quality bar validatePdfLabelAddresses", () => {
  it("passes formatted FROM/TO", () => {
    const prepared = prepareValidatedPdfAddresses({
      from: "Geetha Sarees®\nStreet\nGSTIN: 33AAAAA0000A1Z5",
      to: "Name\nAddr\nIN\nuser@x.com\n9876543210",
    });
    expect(validatePdfLabelAddresses(prepared)).toEqual([]);
    expect(prepared.from).not.toMatch(/®|GSTIN/i);
    expect(prepared.to.endsWith("(Mob No : 9876543210)")).toBe(true);
  });

  it("flags unformatted phone / email / GSTIN", () => {
    const issues = validatePdfLabelAddresses({
      from: "BRAND®\nGSTIN: X",
      to: "Name\nuser@x.com\n9876543210",
    });
    expect(issues.map((i) => i.code).sort()).toEqual(
      [
        "brand_registered_mark",
        "from_gstin",
        "to_email",
        "to_phone_format",
      ].sort(),
    );
  });
});
