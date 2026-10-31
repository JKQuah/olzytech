import type { CSSProperties } from "react";

/**
 * Colour themes. A locale picks one in `i18n/config.ts` (`localeMeta[locale].theme`), and the
 * root layout injects it as CSS variables on <html>. Every gradient, glow, ring and the planet
 * read these variables, so a new theme is just a new entry here.
 *
 * Channels are space-separated RGB so CSS can add alpha: `rgb(var(--to-rgb) / 0.5)`.
 */
export type Theme = {
  /** Gradient start (brighter). */
  from: string;
  /** Mid accent: borders, hairlines, focus rings. */
  mid: string;
  /** Gradient end (deeper): primary buttons, glows. */
  to: string;
  /** Soft highlight: planet limb, flares, star tint, headline fade. */
  glow: string;
  /** Palest tint: headline gradient mid-stop, ring start. */
  pale: string;
  /** Deep planet shades, dark to bright. */
  night: string;
  wine: string;
  rose: string;
  /** Tinted dark used under glass and in the hero card. */
  ink: string;
  ember: string;
  /** Pre-baked, coloured nebula texture for the hero planet (see public/textures). */
  nebula: string;
  /** Pre-baked rim-light ring with moving hot spots for the planet limb (see public/textures). */
  limb: string;
  /** Hex values for places that cannot use CSS variables (e.g. the OG image). */
  hex: { to: string; deep: string; glow: string };
};

export const themes = {
  coral: {
    from: "255 138 115",
    mid: "244 118 104",
    to: "240 96 90",
    glow: "255 170 150",
    pale: "255 227 220",
    night: "20 5 10",
    wine: "92 15 29",
    rose: "194 58 75",
    ink: "20 4 6",
    ember: "90 24 34",
    nebula: "/textures/nebula-coral.png",
    limb: "/textures/limb-coral.png",
    hex: { to: "#f0605a", deep: "#7a1424", glow: "#ffa393" },
  },
  // Brand orange: the logo's #FA6E20 is the main accent (borders, buttons, glows).
  orange: {
    from: "255 156 84",
    mid: "250 110 32",
    to: "250 110 32",
    glow: "255 182 118",
    pale: "255 234 216",
    night: "24 10 3",
    wine: "102 38 6",
    rose: "200 84 14",
    ink: "24 9 3",
    ember: "98 36 8",
    nebula: "/textures/nebula-orange.png",
    limb: "/textures/limb-orange.png",
    hex: { to: "#fa6e20", deep: "#7a2e08", glow: "#ffb676" },
  },
  emerald: {
    from: "61 220 151",
    mid: "38 200 130",
    to: "10 150 98",
    glow: "120 240 180",
    pale: "214 255 232",
    night: "3 16 10",
    wine: "6 58 38",
    rose: "14 128 80",
    ink: "2 18 11",
    ember: "8 66 42",
    nebula: "/textures/nebula-emerald.png",
    limb: "/textures/limb-emerald.png",
    hex: { to: "#0a9662", deep: "#064e34", glow: "#78f0b4" },
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;

/** Inline CSS variables for <html>. */
export function themeStyle(name: ThemeName): CSSProperties {
  const t = themes[name];
  return {
    "--from-rgb": t.from,
    "--mid-rgb": t.mid,
    "--to-rgb": t.to,
    "--glow-rgb": t.glow,
    "--pale-rgb": t.pale,
    "--night-rgb": t.night,
    "--wine-rgb": t.wine,
    "--rose-rgb": t.rose,
    "--ink-rgb": t.ink,
    "--ember-rgb": t.ember,
    "--nebula-img": `url(${t.nebula})`,
    "--limb-img": `url(${t.limb})`,
  } as CSSProperties;
}
