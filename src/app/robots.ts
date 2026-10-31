import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Search and AI crawlers are welcome: being cited by answer engines is part of the plan (see /llms.txt).
 * They are listed explicitly so the intent is on record; to opt a bot out, move it to a `disallow: "/"` rule.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
