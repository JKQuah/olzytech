/** Brand + contact facts. Replace placeholders before launch. */
export const siteConfig = {
  name: "Olzytech",
  legalName: "Olzytech Solutions",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://olzytech.com").replace(
    /\/$/,
    "",
  ),
  email: "support@olzytech.com",
  /** Shown to visitors (local format). */
  phone: "019-969 2350",
  /** International format for tel: links and structured data. */
  phoneE164: "+60199692350",
  /** WhatsApp click-to-chat link (same number as `phoneE164`, digits only). Not a social profile, so it stays out of `socials`. */
  whatsapp: "https://wa.me/60199692350",
  addressCountry: "MY",
  twitterHandle: "@olzytech",
  socials: {
    github: "https://github.com/olzytech",
    linkedin: "https://www.linkedin.com/company/olzytech",
    instagram: "https://www.instagram.com/olzytech",
  },
} as const;
