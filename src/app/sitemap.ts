import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { legalRoutes, localizedPath, routes, type RoutePath } from "@/config/routes";
import { languageAlternates } from "@/lib/seo";
import { defaultLocale, locales } from "@/i18n/config";

const priorities: Record<RoutePath, number> = {
  "/": 1,
  "/showcase": 0.8,
  "/pricing": 0.8,
  "/about": 0.6,
  "/contact": 0.7,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const legal = Object.values(legalRoutes).map((path) => ({
    url: `${siteConfig.url}${localizedPath(defaultLocale, path)}`,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [...Object.values(routes).flatMap((path) =>
    locales.map((locale) => ({
      url: `${siteConfig.url}${localizedPath(locale, path)}`,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: priorities[path],
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(path)).map(([k, v]) => [k, `${siteConfig.url}${v}`]),
        ),
      },
    })),
  ), ...legal];
}
