import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { localizedPath, type RoutePath } from "@/config/routes";
import { defaultLocale, localeMeta, locales, type Locale } from "@/i18n/config";

/**
 * Share-image entries for a locale. Pages that set their own `openGraph`/`twitter` replace the ones the
 * `opengraph-image` file convention would add, so every page names the image explicitly.
 */
const shareImage = (locale: Locale, kind: "opengraph" | "twitter") => ({
  url: `/${locale}/${kind}-image`,
  width: 1200,
  height: 630,
  alt: siteConfig.legalName,
});

/** hreflang alternates for a route, including `x-default`. */
export function languageAlternates(path: RoutePath): Record<string, string> {
  const entries = locales.map((l) => [localeMeta[l].htmlLang, localizedPath(l, path)] as const);
  return {
    ...Object.fromEntries(entries),
    "x-default": localizedPath(defaultLocale, path),
  };
}

type BuildMetadataInput = {
  locale: Locale;
  path: RoutePath;
  title: string;
  description: string;
  /** Use the title as-is (no template), e.g. for the home page. */
  absoluteTitle?: boolean;
};

/**
 * Canonical + hreflang + Open Graph + Twitter metadata for a localised page.
 * Relative URLs resolve against `metadataBase` set in the root layout.
 */
export function buildMetadata({ locale, path, title, description, absoluteTitle }: BuildMetadataInput): Metadata {
  const url = localizedPath(locale, path);
  const fullTitle = absoluteTitle ? title : `${title} | ${siteConfig.legalName}`;

  return {
    title: absoluteTitle ? { absolute: `${siteConfig.legalName} | ${title}` } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: siteConfig.legalName,
      title: fullTitle,
      description,
      url,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
      images: [shareImage(locale, "opengraph")],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      site: siteConfig.twitterHandle,
      images: [shareImage(locale, "twitter")],
    },
  };
}

export const absoluteUrl = (path: string) => `${siteConfig.url}${path}`;

/**
 * Metadata for English-only pages: one canonical URL, no hreflang alternates
 * (there is nothing to alternate to).
 */
export function buildEnglishOnlyMetadata({ path, title, description }: { path: RoutePath | "/privacy" | "/terms"; title: string; description: string }): Metadata {
  const url = localizedPath(defaultLocale, path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: siteConfig.legalName,
      title: `${title} | ${siteConfig.legalName}`,
      description,
      url,
      locale: localeMeta[defaultLocale].ogLocale,
      images: [shareImage(defaultLocale, "opengraph")],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.legalName}`,
      description,
      site: siteConfig.twitterHandle,
      images: [shareImage(defaultLocale, "twitter")],
    },
  };
}
