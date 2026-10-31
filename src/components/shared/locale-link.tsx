import Link from "next/link";
import type { ComponentProps } from "react";
import { localizedPath, type RoutePath } from "@/config/routes";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/dictionaries";

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: RoutePath;
  /** Optional override; defaults to the locale of the current route. */
  locale?: Locale;
};

/**
 * Server-component `next/link` that prefixes the active locale:
 * `<LocaleLink href="/about">` -> `/ms/about` on the Malay site.
 * Client Components should use `Link` + `localizedPath` with a locale passed in as a prop.
 */
export async function LocaleLink({ href, locale, ...props }: LocaleLinkProps) {
  const current = locale ?? (await getLocale());
  return <Link href={localizedPath(current, href)} {...props} />;
}
