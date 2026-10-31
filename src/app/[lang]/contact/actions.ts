"use server";

import { z } from "zod";
import { isLocale } from "@/i18n/config";

export type ContactField = "name" | "email" | "message" | "service";

export type ContactState = {
  status: "idle" | "success" | "error";
  /** Fields that failed validation; the client maps these to localised messages. */
  fieldErrors?: ContactField[];
  /** Echoed back so the form keeps what the user typed after a failed submit. */
  values?: Record<string, string>;
};

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional(),
  service: z.string().trim().min(1).max(40),
  budget: z.string().trim().max(40).optional(),
  message: z.string().trim().max(4000),
  locale: z.string().refine(isLocale),
});

/** Chinese packs far more meaning per character, so it needs a lower minimum. */
const minMessageLength = (locale: string) => (locale === "zh" ? 5 : 10);

/**
 * Validates the enquiry and forwards it to `CONTACT_WEBHOOK_URL` (Slack, Zapier, Make, a CRM, ...).
 * Without the env var it logs on the server so the form is testable in development.
 * Swap the delivery block for Resend/SMTP if you prefer email.
 */
export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;

  // Honeypot: bots fill hidden fields. Pretend success and drop it.
  if (raw.website) return { status: "success" };

  const parsed = schema.safeParse(raw);
  const messageTooShort = Array.from((raw.message ?? "").trim()).length < minMessageLength(raw.locale ?? "");
  if (!parsed.success || messageTooShort) {
    const failed = new Set<string>(parsed.success ? [] : parsed.error.issues.map((i) => String(i.path[0])));
    if (messageTooShort) failed.add("message");
    const fieldErrors = [...failed].filter((f): f is ContactField => ["name", "email", "message", "service"].includes(f));
    return { status: "error", fieldErrors, values: raw };
  }

  try {
    const url = process.env.CONTACT_WEBHOOK_URL;
    if (url) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "olzytech-landing", receivedAt: new Date().toISOString(), ...parsed.data }),
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    } else {
      console.info("[contact] CONTACT_WEBHOOK_URL not set; enquiry:", parsed.data);
    }
    return { status: "success" };
  } catch (error) {
    console.error("[contact] delivery failed", error);
    return { status: "error", values: raw };
  }
}
