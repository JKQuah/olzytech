import { NextResponse, type NextRequest } from "next/server";
import { legalRoutes } from "@/config/routes";
import { defaultLocale, isLocale } from "@/i18n/config";

/**
 * Locale routing with an unprefixed default locale:
 *   /about      -> served by the `en` route internally (URL unchanged)
 *   /en/about   -> 308 to /about (one canonical URL for SEO)
 *   /ms/about   -> served as-is
 * No Accept-Language redirect on purpose: a URL always returns the same language, which keeps
 * crawling and caching predictable. Visitors switch language with the header switcher.
 */
const METADATA_IMAGE = /\/(opengraph|twitter)-image/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === defaultLocale && !METADATA_IMAGE.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (isLocale(first)) {
    // English-only pages have a single URL: /ms/privacy -> /privacy
    const rest = pathname.slice(first.length + 1).replace(/\/$/, "") || "/";
    if ((Object.values(legalRoutes) as string[]).includes(rest)) {
      const url = request.nextUrl.clone();
      url.pathname = rest;
      return NextResponse.redirect(url, 308);
    }
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, metadata routes and any path with a file extension.
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\..*).*)"],
};
