/**
 * PDF shipping-label text rules only (FROM / TO / brand).
 * Clipboard / UI address copy is unchanged.
 */

const EMAIL_RE =
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi;

export type PdfLabelQualityIssue = {
  code:
    | "brand_registered_mark"
    | "from_gstin"
    | "to_email"
    | "to_phone_format"
    | "to_country_in"
    | "empty_address";
  message: string;
  field: "brand" | "from" | "to";
};

function splitNonEmptyLines(text: string): string[] {
  return String(text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line.length > 0);
}

function hasRegisteredMark(text: string): boolean {
  return /®|\(R\)|Ⓡ/i.test(text);
}

function hasGstin(text: string): boolean {
  return /^\s*GSTIN\s*:/im.test(text) || /\bGSTIN\b/i.test(text);
}

function hasEmail(text: string): boolean {
  return new RegExp(EMAIL_RE.source, "i").test(text);
}

/** Remove ® / (R) / Ⓡ from brand (and any other PDF text). */
export function stripRegisteredMarks(text: string): string {
  return String(text ?? "")
    .replace(/®|\(R\)|Ⓡ/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function formatMobNoLine(digits10: string): string {
  return `(Mob No : ${digits10})`;
}

/** Extract first Indian 10-digit mobile from free text. */
export function extractIndianMobile(text: string): string | null {
  // Allow spaces/dashes inside the number (e.g. "+91 80127 15132").
  const compact = String(text ?? "").replace(/(\d)[\s-]+(?=\d)/g, "$1");
  const match = compact.match(/(?:\+?91)?0?([6-9]\d{9})\b/);
  return match?.[1] ?? null;
}

function lineIsPhoneOnly(line: string): boolean {
  if (/\bMob\s*No\b/i.test(line)) return true;
  if (/^(ph|phone|mobile|mob|tel)\b/i.test(line)) return true;
  const digits = extractIndianMobile(line);
  if (!digits) return false;
  const onlyDigits = line.replace(/\D/g, "");
  return (
    onlyDigits === digits ||
    onlyDigits === `91${digits}` ||
    onlyDigits === `0${digits}`
  );
}

function stripEmailsFromLine(line: string): string {
  return line
    .replace(new RegExp(EMAIL_RE.source, "gi"), "")
    .replace(/\s{2,}/g, " ")
    .replace(/[,\s;]+$/g, "")
    .replace(/^[,\s;]+/g, "")
    .trim();
}

/** Replace standalone country code IN with India (line or trailing token). */
export function expandCountryInToIndia(line: string): string {
  let next = line.trim();
  if (/^IN$/i.test(next)) return "India";
  next = next.replace(/([,\s\-–—])IN$/i, "$1India");
  next = next.replace(/^IN([,\s\-–—])/i, "India$1");
  return next;
}

/**
 * FROM block for PDF: no GSTIN, brand without registered marks.
 */
export function formatPdfFromAddress(text: string): string {
  const lines = splitNonEmptyLines(text)
    .filter((line) => !/^\s*GSTIN\s*:/i.test(line))
    .map((line, index) => (index === 0 ? stripRegisteredMarks(line) : line));
  return lines.join("\n");
}

/**
 * TO block for PDF:
 * - drop emails
 * - IN → India
 * - phone always last as `(Mob No : xxxxxxxxxx)`
 */
export function formatPdfToAddress(text: string): string {
  const rawLines = splitNonEmptyLines(text);
  if (!rawLines.length) return "";

  const phoneDigits = extractIndianMobile(rawLines.join("\n"));

  const body: string[] = [];
  for (const line of rawLines) {
    if (lineIsPhoneOnly(line)) continue;
    let cleaned = stripEmailsFromLine(line);
    if (!cleaned || hasEmail(cleaned)) continue;
    cleaned = expandCountryInToIndia(cleaned);
    if (!cleaned) continue;
    body.push(cleaned);
  }

  const deduped: string[] = [];
  for (const line of body) {
    if (
      deduped.length &&
      deduped[deduped.length - 1].toLowerCase() === line.toLowerCase()
    ) {
      continue;
    }
    deduped.push(line);
  }

  if (phoneDigits) {
    deduped.push(formatMobNoLine(phoneDigits));
  }

  return deduped.join("\n");
}

/**
 * Quality bar: validate PDF FROM/TO after formatting.
 * Returns issues (empty = pass).
 */
export function validatePdfLabelAddresses(input: {
  from: string;
  to: string;
}): PdfLabelQualityIssue[] {
  const issues: PdfLabelQualityIssue[] = [];
  const from = String(input.from ?? "");
  const to = String(input.to ?? "");

  if (!from.trim()) {
    issues.push({
      code: "empty_address",
      field: "from",
      message: "FROM address is empty.",
    });
  }
  if (!to.trim()) {
    issues.push({
      code: "empty_address",
      field: "to",
      message: "TO address is empty.",
    });
  }

  if (hasRegisteredMark(from)) {
    issues.push({
      code: "brand_registered_mark",
      field: "brand",
      message: "Brand still contains a registered mark (® / (R)).",
    });
  }

  if (hasGstin(from)) {
    issues.push({
      code: "from_gstin",
      field: "from",
      message: "FROM address must not include GSTIN on the PDF label.",
    });
  }

  if (hasEmail(to)) {
    issues.push({
      code: "to_email",
      field: "to",
      message: "TO address must not include an email on the PDF label.",
    });
  }

  const toLines = splitNonEmptyLines(to);
  const phoneOnBody = toLines
    .slice(0, -1)
    .some((line) => extractIndianMobile(line) != null);
  if (phoneOnBody) {
    issues.push({
      code: "to_phone_format",
      field: "to",
      message:
        "Phone must appear only on the last TO line as (Mob No : xxxxxxxxxx).",
    });
  }

  const last = toLines[toLines.length - 1] ?? "";
  const hasAnyMobile = extractIndianMobile(to) != null;
  if (hasAnyMobile) {
    const expectedDigits = extractIndianMobile(to);
    const expected = expectedDigits ? formatMobNoLine(expectedDigits) : "";
    if (last !== expected) {
      issues.push({
        code: "to_phone_format",
        field: "to",
        message: `Last TO line must be exactly "${expected || "(Mob No : xxxxxxxxxx)"}".`,
      });
    }
  }

  for (const line of toLines) {
    if (/^IN$/i.test(line)) {
      issues.push({
        code: "to_country_in",
        field: "to",
        message: 'Country code "IN" must be written as "India".',
      });
      break;
    }
  }

  return issues;
}

/** Format then validate; throws if quality bar fails after formatting. */
export function prepareValidatedPdfAddresses(input: {
  from: string;
  to: string;
}): { from: string; to: string } {
  const from = formatPdfFromAddress(input.from);
  const to = formatPdfToAddress(input.to);
  const issues = validatePdfLabelAddresses({ from, to });
  if (issues.length > 0) {
    throw new Error(
      `PDF label quality check failed: ${issues
        .map((issue) => issue.message)
        .join(" ")}`,
    );
  }
  return { from, to };
}
