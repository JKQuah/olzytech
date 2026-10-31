import { ImageResponse } from "next/og";
import { LOGO_GLYPH_PATH } from "@/components/shared/logo-glyph";
import { siteConfig } from "@/config/site";
import { themes } from "@/config/themes";
import { isLocale, localeMeta } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = siteConfig.legalName;

/**
 * Fetches a Noto Sans SC subset containing only `text` (a few KB) so Chinese titles render in the
 * share image. Returns undefined on any failure; the image then falls back to the default font.
 */
async function loadChineseFont(text: string): Promise<ArrayBuffer | undefined> {
  try {
    // No User-Agent: Google then serves plain TTF, which the image renderer supports (it cannot read woff2).
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return undefined;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : undefined;
  } catch {
    return undefined;
  }
}

export default async function OpengraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : "en";
  const dict = await getDictionaryFor(locale);
  const { hex } = themes[localeMeta[locale].theme];
  const { titleLine1, titleLine2 } = dict.home.hero;
  const fontData = locale === "zh" ? await loadChineseFont(`${titleLine1}${titleLine2}${siteConfig.legalName}${siteConfig.legalName.toUpperCase()}`) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          color: "white",
          background:
            `radial-gradient(90% 70% at 50% 120%, ${hex.to} 0%, ${hex.deep} 38%, #000 72%)`,
          fontFamily: locale === "zh" ? '"Noto Sans SC", sans-serif' : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="84" height="84" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FA6E20" />
                <stop offset="1" stopColor="#A62D44" />
              </linearGradient>
            </defs>
            <rect width="200" height="200" rx="19" fill="url(#g)" />
            <path d={LOGO_GLYPH_PATH} fill="#fff" fillRule="evenodd" />
          </svg>
          <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", opacity: 0.85, display: "flex" }}>
            {siteConfig.legalName}
          </div>
        </div>
        <div style={{ fontSize: 104, fontWeight: 700, lineHeight: 1.02, display: "flex", flexDirection: "column", marginTop: 16 }}>
          <span>{titleLine1}</span>
          <span style={{ color: hex.glow }}>{titleLine2}</span>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData ? { fonts: [{ name: "Noto Sans SC", data: fontData, weight: 700 as const, style: "normal" as const }] } : {}),
    },
  );
}
