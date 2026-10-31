/**
 * Non-translatable facts about each showcased project, keyed by the `slug` used in
 * `showcase.projects` in the message files. Cover images live in /public/images/showcase
 * (1440x900 WebP screenshots of the live homepage).
 */
/** Which showcase section a project belongs to. */
export type ProjectGroup = "websites" | "dashboards";

export const projectAssets = {
  cashflow: { url: "https://cashflow.olzytech.com/", image: "/images/showcase/cashflow.webp", completed: "2026-06", group: "websites" },
  sgmathwizard: { url: "https://www.sgmathwizard.com/", image: "/images/showcase/sgmathwizard.webp", completed: "2026-09", group: "websites" },
  juststayliving: { url: "https://www.juststayliving.com/", image: "/images/showcase/juststayliving.webp", completed: "2025-10", group: "websites" },
  // No completion date yet: the card simply shows none.
  "wind-turbine-inspection": {
    url: "https://wind-turbine-inspection.vercel.app/",
    image: "/images/showcase/wind-turbine-inspection.webp",
    completed: undefined,
    group: "websites",
  },
  exbiz: { url: "https://exbiz.vercel.app/", image: "/images/showcase/exbiz.webp", completed: undefined, group: "websites" },
  // The dashboard is behind a login, so its cover is a screenshot of the app (dark theme).
  "sgmathwizard-dashboard": {
    url: "https://app.sgmathwizard.com/",
    image: "/images/showcase/sgmathwizard-dashboard-overview.webp",
    completed: undefined,
    group: "dashboards",
  },
  // Not launched yet: no live site or screenshot, so the card shows a "coming soon" cover and does not link out.
  ripples: { url: undefined, image: undefined, completed: undefined, group: "dashboards", comingSoon: true },
  zonnetix: { url: undefined, image: undefined, completed: undefined, group: "dashboards", comingSoon: true },
} as const satisfies Record<
  string,
  { url?: string; image?: string; completed?: `${number}-${number}`; group: ProjectGroup; comingSoon?: boolean }
>;

export type ProjectSlug = keyof typeof projectAssets;

/** "2026-06" -> "Jun 2026" (English) / "Jun 2026", "Okt 2025" (Malay): localised month + year. */
export function formatCompleted(month: string, htmlLang: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(htmlLang, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export const projectImageSize = { width: 1440, height: 900 } as const;
