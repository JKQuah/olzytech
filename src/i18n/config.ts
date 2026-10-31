import type { ThemeName } from "@/config/themes";

/**
 * Single source of truth for locales.
 *
 * To add a language (e.g. Chinese):
 *  1. add "zh" to `locales`
 *  2. add its entry to `localeMeta` (pick a `theme` from config/themes.ts)
 *  3. create `messages/zh.json` (must match the shape of `messages/en.json`)
 *  4. register the loader in `dictionaries.ts`
 * TypeScript will flag every step you miss.
 */
export const locales = ["en", "ms", "zh"] as const;
export type Locale = (typeof locales)[number];

/** The default locale has no URL prefix (`/about`); others do (`/ms/about`). */
export const defaultLocale: Locale = "en";

export const localeMeta: Record<
  Locale,
  {
    /** Name shown in the language switcher. */
    nativeName: string;
    /** Short label for compact UI. */
    short: string;
    /** BCP-47 tag for `<html lang>` and hreflang. */
    htmlLang: string;
    /** Open Graph locale. */
    ogLocale: string;
    /** Colour theme applied to the whole site in this locale. */
    theme: ThemeName;
  }
> = {
  en: { nativeName: "English", short: "EN", htmlLang: "en", ogLocale: "en_MY", theme: "coral" },
  ms: { nativeName: "Bahasa Melayu", short: "BM", htmlLang: "ms", ogLocale: "ms_MY", theme: "emerald" },
  zh: { nativeName: "中文", short: "中文", htmlLang: "zh-Hans", ogLocale: "zh_CN", theme: "orange" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
