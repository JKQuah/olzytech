import { legalRoutes, localizedPath } from "@/config/routes";
import { defaultLocale, isLocale, type Locale } from "./config";

/** Remove a leading locale segment: `/ms/about` -> `/about`, `/en` -> `/`. */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  const tail = first && isLocale(first) ? rest : [first, ...rest];
  const path = `/${tail.filter(Boolean).join("/")}`;
  return path;
}

const englishOnly: readonly string[] = Object.values(legalRoutes);

/**
 * Same page in another locale: `/about` + `ms` -> `/ms/about`, `/ms/about` + `en` -> `/about`.
 * English-only pages (privacy, terms) have no translation, so another locale lands on its home page.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  const path = stripLocale(pathname);
  return localizedPath(target, target !== defaultLocale && englishOnly.includes(path) ? "/" : path);
}
