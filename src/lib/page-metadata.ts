import type { Metadata } from "next";
import { routes, type RouteKey } from "@/config/routes";
import { isLocale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { buildMetadata } from "./seo";

type Page = Exclude<RouteKey, never>;

/**
 * Factory for `generateMetadata`: pulls title/description from `meta.<page>` in the dictionary.
 * Usage: `export const generateMetadata = createPageMetadata("about");`
 */
export function createPageMetadata(page: Page) {
  return async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    if (!isLocale(lang)) return {};
    const dict = await getDictionaryFor(lang);
    const { title, description } = dict.meta[page];
    return buildMetadata({
      locale: lang,
      path: routes[page],
      title,
      description,
      absoluteTitle: page === "home",
    });
  };
}
