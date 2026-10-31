# Olzytech Solutions: landing site (developer notes)

Next.js 16 (App Router, Cache Components) · Tailwind CSS v4 · shadcn/ui (Radix) · TypeScript · pnpm

```bash
pnpm install
cp .env.example .env.local
pnpm dev      # http://localhost:3000  (English)   ·   http://localhost:3000/ms  (Malay)
pnpm build && pnpm start
```

## Structure

```
src/
  app/
    [lang]/                 root layout + pages: / about showcase pricing contact (+ OG image)
    sitemap.ts robots.ts manifest.ts
  proxy.ts                  locale routing: default locale unprefixed, /en/* -> 308 to /*
  config/                   site.ts (brand facts), routes.ts (routes + localizedPath), themes.ts (colour themes)
  i18n/
    config.ts               locales, metadata per locale  <- add languages here
    dictionaries.ts         typed loaders, getDictionary() / getLocale() via next/root-params
    messages/{en,ms,zh}.json   all copy; ms.json and zh.json are type-checked against en.json
  components/
    ui/                     shadcn primitives (button has extra brand/glass/dark variants)
    layout/                 header, footer, nav, language switcher, mobile nav
    hero/                   planet backdrop + dashboard widgets
    sections/               reusable page sections (services, pricing, FAQ, CTA, forms...)
    shared/                 Section, Reveal, GlassCard, ProgressRing, JsonLd, Logo, LocaleLink
  lib/                      seo.ts (metadata + hreflang), page-metadata.ts, utils
```

## URLs

The default locale (English) has no prefix; other locales do:

| Page | English | Malay |
| --- | --- | --- |
| Home | `/` | `/ms` |
| About | `/about` | `/ms/about` |

`/en/...` permanently redirects to the unprefixed URL. Pages are always served in the language of
their URL (no Accept-Language redirect), with canonical and hreflang tags linking the variants.
Use `localizedPath(locale, "/about")` and `<LocaleLink>` instead of hard-coding paths.

### English-only pages

`/privacy` and `/terms` are intentionally English only. Their copy lives in `src/content/legal.ts`
(not in the message files) and they exist at one unprefixed URL: `/ms/privacy` redirects to
`/privacy`, the language switcher sends Malay to the Malay home page, and they are in the sitemap
once with no hreflang. Update `LEGAL_LAST_UPDATED` whenever the text changes.

## Languages

English (default, no prefix), Bahasa Melayu (`/ms`) and Chinese (`/zh`, Simplified). Each has its own colour theme:
coral, emerald and **orange**, where the orange accent is the logo's `#FA6E20` (see `config/themes.ts`).
Chinese uses Noto Sans SC (loaded in slices, only when Chinese glyphs are on the page); the scroll-highlight splits
Chinese text per character; the contact form accepts shorter messages in Chinese; the share image loads a tiny
Chinese font subset. The Privacy Policy and Terms stay English only.

## Per-language colour theme

Each locale picks a theme in `localeMeta` (`en` -> `coral` red, `ms` -> `emerald` green, `zh` -> `orange`). The root
layout injects that theme's palette as CSS variables on `<html>`; every gradient, glow, ring, the
planet and generated project art read them. Define a new palette in `src/config/themes.ts` to add one.
Use `text-brand-from`, `bg-brand`, `rgb(var(--to-rgb) / .5)` etc. in components, never raw hex.

Switching language plays a circular reveal from the click point (View Transitions API, see
`components/layout/theme-transition.ts`). Browsers without it, and reduced-motion users, switch instantly.

## Pricing

Three levels (Simple, Moderate, Complex) in three markets (Malaysia MYR, Singapore SGD, Hong Kong HKD).
Website development, redesigns and analytics dashboards are all scoped by these levels; what each level covers is
listed in its feature list. Numbers live in `src/content/pricing.ts`; names, descriptions and features are in the
message files under `pricing.levels.<level>`. Add-ons and the free-consultation checklist (`pricing.consultation`)
are in the same place. To add a market, add it to `regions` and every price table (TypeScript flags what is
missing) plus a label/note under `pricing.regions` in every message file.

### Testimonials: only approved ones go live

`src/content/testimonials.ts` holds the star ratings and an `approved` flag; the wording is in
`pricing.testimonials.items.<project>` in the message files. The current text is a **draft** written from what
each project delivered, to send to the client for approval. Drafts show only in development (with a "Draft"
badge) and are hidden in production (also kept out of the page source). To publish one: get the client's OK,
edit the wording and rating to what they actually said, and set `approved: true`. Do not publish reviews the
client has not given.

## Brand assets

The logo is vector artwork: `public/brand/logo.svg` (source of truth), the knot path in
`src/components/shared/logo-glyph.ts`, drawn by `<LogoMark />` through one shared sprite
(`<LogoSprite />` in the root layout). The logo keeps its orange to crimson colours in every locale theme.
Icons rendered from it: `src/app/icon.svg`, `favicon.ico` (16-64px), `apple-icon.png`, and
`public/icons/icon-{192,512}.png` + `icon-maskable-512.png` (web manifest). If the logo changes, re-render these.

## Showcase

Real client projects: copy per language in `showcase.projects` (message files), live URLs and cover
screenshots in `src/content/projects.ts` + `public/images/showcase/` (1440x900 WebP). To add one, drop
the screenshot in, add an entry in `projectAssets`, and add the same `slug` to every message file.
Each project has a `group` in `projectAssets`: `websites` (landing pages and business websites) or `dashboards`
(complex builds); the showcase page renders one section per group, with copy under `showcase.sections`.
The dashboard card uses a screenshot of the app in its dark theme (`sgmathwizard-dashboard-overview.webp`, 1440x900).
Projects that have not launched (Ripples, Zonnetix) set `comingSoon: true` with no `url`/`image`; when one goes
live, set its link and cover image and remove `comingSoon`.
The "How we build" Three.js demo (`components/sections/stack-demo.tsx`, `components/three/`) sits below the
showcase sections. The home-page "before & after" uses `public/images/revamp/`.

## Motion

All in `src/components/motion/` and `src/hooks/`: `CountUp` (running figures), `ScrollHighlight`
(words light up as you scroll; mark brand words with `**double asterisks**` in the translation),
`Parallax`, `ScrollProgress`, `ScrollProgressTracker` (process rail), `Tilt`, `Magnetic`,
`AnimatedBar`, `ScrollDeck` (hero cards fly from behind the main card as you scroll; opt a card in with the `fly` utility and `--s/--tx/--ty/--tz`), plus `Reveal` and `WordsRise` in `shared/`. Everything respects `prefers-reduced-motion`
and ships its final content in the server HTML.

`FlameBackground` (CTA banner): themed flame tongues and rising embers, pure CSS (transform/opacity only,
no blur filters). `FlameField` pauses all of it while off-screen; with reduced motion a static glow remains.
On desktop hover the flames swell, those near the pointer lean towards it, and an extra flame rises under the cursor
(`FlameField` eases `--cx`/`--hv`; mouse only, off for reduced motion).
To tune it, edit the `PLUMES`/`EMBERS` tables in `src/components/sections/flame-background.tsx`.

### Performance rules (keep the page smooth)

- Scroll-linked code goes through `useScrollFrame(read, write)`: one shared listener, all layout reads
  before all style writes each frame. Never call `getBoundingClientRect` and set styles in the same callback.
- Animate `transform` / `opacity` only (bars use `scaleX`, not `width`).
- No `backdrop-filter` on cards: `.glass` is a tinted fill + gradient hairline. `glass-blur` (real blur)
  is for the fixed header pill only. Avoid `filter: blur`, `mix-blend-mode` and big `will-change` layers.
- The planet nebula is a pre-baked, pre-coloured texture per theme (`public/textures/nebula-<theme>.png`,
  set through `--nebula-img` from `config/themes.ts`) that simply rotates: no runtime SVG filter, mask or blend mode.
  A new theme needs its own texture (tint `nebula-limb.png`, the greyscale source mask, with the theme's
  from/to/glow gradient).
  The rim light is the same idea (`limb-<theme>.png` via `--limb-img`): a ring with bright and dim stretches
  that orbits at its own speed, so the glow travels around the planet.
- Test scroll feel on `pnpm build && pnpm start`, not `pnpm dev` (dev builds are much slower).

## Adding a language

1. `src/i18n/config.ts`: add the code to `locales` and an entry in `localeMeta` (including its `theme`).
2. Copy `messages/en.json` to `messages/<code>.json` and translate.
3. Register the loader in `src/i18n/dictionaries.ts`.

`tsc` fails until every step is done. The switcher, proxy, sitemap, hreflang and static params
all derive from `locales`.

## Design tokens

Defined in `src/app/globals.css`: black canvas, white text, coral gradient `#FF8A73 → #F0605A`,
`glass` (frosted surface with coral hairline), `text-brand`, `text-fade-coral`, `bg-brand`,
`container-page`. Font: Inter (via `next/font`).

## SEO and GEO (AI answer engines)

- **Metadata:** per-page translated title/description, canonical + hreflang (incl. `x-default`), Open Graph and Twitter
  cards with an explicit localised share image on every page (`buildMetadata` in `lib/seo.ts`), `geo.region` /
  `geo.placename` tags, optional Google/Bing verification (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`).
- **JSON-LD:** every page emits one connected `@graph` (builders in `lib/structured-data.ts`). The root layout adds
  `Organization` (services catalogue, area served, languages, opening hours, contact point) and a per-locale `WebSite`;
  each page adds a `WebPage` (`AboutPage`, `ContactPage`, `CollectionPage`) with a `BreadcrumbList`, linked to them by `@id`.
  Home: service `ItemList`, `HowTo` (process), `FAQPage`. Showcase: project `ItemList` (`WebSite` / `WebApplication`,
  coming-soon apps marked `Upcoming`) and the "How we build" `HowTo`. Pricing: package and add-on `OfferCatalog`s
  (Malaysia prices) and `FAQPage`. Privacy/Terms: `WebPage` with `dateModified`. Testimonials are drafts, so no `Review` data is emitted.
- **GEO files:** `/llms.txt` (index) and `/llms-full.txt` (all page copy, FAQs, pricing, projects) are generated from the
  message files and config in `lib/llms.ts`, so they stay in sync. `robots.ts` names the main AI crawlers explicitly.
- `sitemap.xml` with language alternates, web manifest, semantic landmarks, skip link.
- Check structured data with the Rich Results Test and validator.schema.org.

## Before launch

- Replace placeholder content: contact details in `src/config/site.ts`, pricing, showcase projects, stats.
- Set `NEXT_PUBLIC_SITE_URL` and `CONTACT_WEBHOOK_URL`.
- Add a favicon / app icons (`src/app/icon.png`, `apple-icon.png`).
