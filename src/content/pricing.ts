/**
 * Prices per market. Copy (names, descriptions, features) lives in the message files under
 * `pricing`, keyed by the same ids; only the numbers and currencies live here.
 * Amounts are indicative starting prices, excluding taxes. The final fee is quoted per project.
 */
export const regions = {
  my: { currency: "MYR", symbol: "RM", available: true },
  // Not open yet: shown as "Coming soon" and not selectable. Set `available: true` to launch a market.
  sg: { currency: "SGD", symbol: "S$", available: false },
  hk: { currency: "HKD", symbol: "HK$", available: false },
} as const;

export type RegionId = keyof typeof regions;
export const regionIds = Object.keys(regions) as RegionId[];
export const defaultRegion: RegionId = "my";

type Prices = Record<RegionId, number>;

/** Every project is scoped as a simple, moderate or complex one, whatever the service
 *  (website development, redesign, analytics dashboard). */
export const levelIds = ["simple", "moderate", "complex"] as const;
export type LevelId = (typeof levelIds)[number];

/** The level highlighted as "most popular". */
export const FEATURED_LEVEL: LevelId = "moderate";

/**
 * Indicative starting price per level and market (one-off project, excluding taxes).
 * `null` = no public price: the card says "Custom" and sends visitors to Sales Support.
 */
export const levelPrices: Record<LevelId, Prices | null> = {
  simple: { my: 1288, sg: 1100, hk: 6500 },
  moderate: { my: 4788, sg: 2900, hk: 17500 },
  // Complex projects are quoted individually after a free consultation.
  complex: null,
};

/** Optional extras. The unit ("per page", "per month"...) is translated in the message files. */
export const addonPrices = {
  language: { my: 388, sg: 270, hk: 1600 },
  revamp: { my: 788, sg: 480, hk: 2800 },
  brand: { my: 1188, sg: 720, hk: 4200 },
  cms: { my: 1488, sg: 900, hk: 5250 },
  payments: { my: 988, sg: 600, hk: 3500 },
  seo: { my: 588, sg: 420, hk: 2400 },
} as const satisfies Record<string, Prices>;

export const formatAmount = (n: number) => n.toLocaleString("en-US");
