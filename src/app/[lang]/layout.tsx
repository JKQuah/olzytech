import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { GlobalEffects } from "@/components/motion/global-effects";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/shared/json-ld";
import { LogoSprite } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import { themeStyle } from "@/config/themes";
import { localeMeta, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { siteGraph } from "@/lib/structured-data";
import "../globals.css";

/** Inter has no Chinese glyphs. Browsers download only the unicode-range slices a page actually uses. */
const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.legalName, template: `%s | ${siteConfig.legalName}` },
  applicationName: siteConfig.legalName,
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  category: "technology",
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Search Console / Bing Webmaster ownership tags; each renders only when its env var is set.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  // Geographic hints (Bing and regional engines): the studio is Malaysia-based and serves MY, SG and HK.
  other: {
    "geo.region": siteConfig.addressCountry,
    "geo.placename": "Malaysia",
  },
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const dict = await getDictionary();

  return (
    <html
      lang={localeMeta[locale].htmlLang}
      data-scroll-behavior="smooth"
      data-theme={localeMeta[locale].theme}
      style={themeStyle(localeMeta[locale].theme)}
      className={`${inter.variable} ${notoSansSC.variable} dark`}
      suppressHydrationWarning
    >
      <body className="relative flex min-h-dvh flex-col overflow-x-clip bg-black text-white">
        <a
          href="#main"
          className="bg-brand sr-only z-[60] rounded-full px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {dict.common.skipToContent}
        </a>
        <LogoSprite />
        <GlobalEffects />
        <SiteHeader locale={locale} dict={dict.common} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict.footer} nav={dict.common.nav} />

        <JsonLd data={siteGraph(locale, dict)} />
      </body>
    </html>
  );
}
