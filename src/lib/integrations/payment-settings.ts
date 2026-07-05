import { z } from "zod";

export const cashfreePayloadSchema = z.object({
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  apiVersion: z.string().trim().min(1),
  environment: z.enum(["sandbox", "production"]),
});

export const phonepePayloadSchema = z.object({
  merchantId: z.string().trim().min(1),
  saltKey: z.string().trim().min(1),
  saltIndex: z.string().trim().min(1),
  baseUrl: z.string().trim().url(),
  merchantUserIdPrefix: z.string().trim().max(16).optional(),
});

export const whatsappPayloadSchema = z.object({
  accessToken: z.string().trim().min(1),
  phoneNumberId: z.string().trim().min(1),
  templateName: z.string().trim().optional(),
  templateLanguage: z.string().trim().min(2).default("en"),
  notifySeller: z.boolean().default(false),
  sellerMobiles: z.string().trim().default(""),
});

export function normalizeCashfreeIncoming(incoming: Record<string, unknown>) {
  return {
    clientId: String(incoming.clientId ?? "").trim(),
    clientSecret: String(incoming.clientSecret ?? "").trim(),
    baseUrl:
      String(incoming.baseUrl ?? "").trim() ||
      "https://sandbox.cashfree.com/pg",
    apiVersion: String(incoming.apiVersion ?? "").trim() || "2025-01-01",
    environment:
      String(incoming.environment ?? "sandbox")
        .trim()
        .toLowerCase() === "production"
        ? ("production" as const)
        : ("sandbox" as const),
  };
}

export function normalizePhonePeIncoming(incoming: Record<string, unknown>) {
  return {
    merchantId: String(incoming.merchantId ?? "").trim(),
    saltKey: String(incoming.saltKey ?? "").trim(),
    saltIndex: String(incoming.saltIndex ?? "").trim(),
    baseUrl:
      String(incoming.baseUrl ?? "").trim() ||
      "https://api.phonepe.com/apis/hermes",
    merchantUserIdPrefix:
      String(incoming.merchantUserIdPrefix ?? "").trim() || "USR",
  };
}

export function normalizeWhatsAppIncoming(incoming: Record<string, unknown>) {
  return {
    accessToken: String(incoming.accessToken ?? "").trim(),
    phoneNumberId: String(incoming.phoneNumberId ?? "").trim(),
    templateName: String(incoming.templateName ?? "").trim(),
    templateLanguage:
      String(incoming.templateLanguage ?? "")
        .trim()
        .toLowerCase() || "en",
    notifySeller: Boolean(incoming.notifySeller ?? false),
    sellerMobiles: String(incoming.sellerMobiles ?? "").trim(),
  };
}

export function parseEnabledCashfreeValue(
  mergedValue: Record<string, unknown>,
) {
  return cashfreePayloadSchema.safeParse(mergedValue);
}

export function parseEnabledPhonePeValue(mergedValue: Record<string, unknown>) {
  return phonepePayloadSchema.safeParse(mergedValue);
}

export function parseEnabledWhatsAppValue(
  mergedValue: Record<string, unknown>,
) {
  return whatsappPayloadSchema.safeParse(mergedValue);
}

/** Strict shape check only when a gateway is being enabled. */
export function parseIncomingCashfreeForEnable(
  incoming: Record<string, unknown>,
) {
  return cashfreePayloadSchema
    .partial({ clientSecret: true })
    .safeParse(normalizeCashfreeIncoming(incoming));
}

export function parseIncomingPhonePeForEnable(
  incoming: Record<string, unknown>,
) {
  return phonepePayloadSchema
    .partial({ saltKey: true })
    .safeParse(normalizePhonePeIncoming(incoming));
}

export function parseIncomingWhatsAppForEnable(
  incoming: Record<string, unknown>,
) {
  return whatsappPayloadSchema
    .partial({ accessToken: true })
    .safeParse(normalizeWhatsAppIncoming(incoming));
}
