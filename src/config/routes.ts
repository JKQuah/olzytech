import { defaultLocale, type Locale } from "@/i18n/config";

/** Every public page. Keys double as translation keys under `common.nav`. */
export const routes = {
  home: "/",
  about: "/about",
  showcase: "/showcase",
  pricing: "/pricing",
  contact: "/contact",
} as const;

export type RouteKey = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteKey];

/**
 * English-only pages (no translations). They live at one unprefixed URL; the proxy redirects
 * their prefixed variants (e.g. /ms/privacy) there.
 */
export const legalRoutes = { privacy: "/privacy", terms: "/terms" } as const;

export const navRoutes: RouteKey[] = ["home", "about", "showcase", "pricing", "contact"];

/**
 * Public URL for a route in a locale. The default locale is unprefixed:
 * `en` + `/about` -> `/about`, `ms` + `/about` -> `/ms/about`, `ms` + `/` -> `/ms`.
 */
export function localizedPath(locale: Locale, path: RoutePath | (string & {}) = "/"): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return path === "/" ? prefix || "/" : `${prefix}${path}`;
}
