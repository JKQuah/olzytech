import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import type en from "./messages/en.json";

/** Shape of every translation file, derived from the English source. */
export type Dictionary = typeof en;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./messages/en.json").then((m) => m.default),
  ms: () => import("./messages/ms.json").then((m) => m.default),
  zh: () => import("./messages/zh.json").then((m) => m.default),
};

export const getDictionaryFor = (locale: Locale) => loaders[locale]();

/** Resolve the current locale from the `[lang]` root param. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Dictionary for the current request locale. */
export async function getDictionary(): Promise<Dictionary> {
  return getDictionaryFor(await getLocale());
}
