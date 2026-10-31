import { TOOL_KINDS } from "@/components/three/stack-kinds";
import { localizedPath, routes, type RouteKey } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { LEGAL_LAST_UPDATED_ISO, type LegalDocument } from "@/content/legal";
import { addonPrices, levelIds, levelPrices, regions } from "@/content/pricing";
import { projectAssets, type ProjectSlug } from "@/content/projects";
import { defaultLocale, localeMeta, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { absoluteUrl } from "./seo";

/**
 * schema.org JSON-LD builders. Every page emits one `@graph` whose nodes point at each other by `@id`
 * (page -> site -> organization), so search engines and AI answer engines resolve a single connected
 * entity graph instead of a pile of unrelated snippets. The Organization and WebSite nodes live in the
 * root layout; each page adds its own WebPage, breadcrumb and content nodes (see `pageGraph`).
 */
type Node = Record<string, unknown>;

const ref = (id: string) => ({ "@id": id });
const graph = (nodes: Node[]) => ({ "@context": "https://schema.org", "@graph": nodes });

export const ORG_ID = absoluteUrl("/#organization");
const pageUrl = (locale: Locale, path: string) => absoluteUrl(localizedPath(locale, path));
const siteId = (locale: Locale) => `${pageUrl(locale, "/")}#website`;
const pageId = (locale: Locale, path: string) => `${pageUrl(locale, path)}#webpage`;

/** Markets we serve (pricing is live for Malaysia; Singapore and Hong Kong are served remotely). */
const AREA_SERVED = [
  { "@type": "Country", name: "Malaysia" },
  { "@type": "Country", name: "Singapore" },
  { "@type": "AdministrativeArea", name: "Hong Kong" },
];

const LANGUAGE_NAMES = ["English", "Malay", "Chinese"];

/** Organization + WebSite: the entities every other node refers to. */
export function siteGraph(locale: Locale, dict: Dictionary) {
  const { services } = dict.home;
  const logo = absoluteUrl("/icons/icon-512.png");

  const organization: Node = {
    "@type": "Organization",
    "@id": ORG_ID,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    description: dict.meta.defaultDescription,
    slogan: `${dict.home.hero.titleLine1} ${dict.home.hero.titleLine2}`,
    logo: { "@type": "ImageObject", "@id": absoluteUrl("/#logo"), url: logo, width: 512, height: 512, caption: siteConfig.legalName },
    image: logo,
    email: siteConfig.email,
    telephone: siteConfig.phoneE164,
    address: { "@type": "PostalAddress", addressCountry: siteConfig.addressCountry },
    areaServed: AREA_SERVED,
    knowsLanguage: locales.map((l) => localeMeta[l].htmlLang),
    knowsAbout: services.items.map((s) => s.title),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.email,
        telephone: siteConfig.phoneE164,
        availableLanguage: LANGUAGE_NAMES,
        areaServed: ["MY", "SG", "HK"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: services.title,
      itemListElement: services.items.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.description },
      })),
    },
    sameAs: Object.values(siteConfig.socials),
  };

  const website: Node = {
    "@type": "WebSite",
    "@id": siteId(locale),
    url: pageUrl(locale, "/"),
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    description: dict.meta.defaultDescription,
    inLanguage: localeMeta[locale].htmlLang,
    publisher: ref(ORG_ID),
  };

  return graph([organization, website]);
}

function breadcrumbNode(locale: Locale, path: string, homeLabel: string, label: string): Node {
  const url = pageUrl(locale, path);
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: pageUrl(locale, "/") },
      { "@type": "ListItem", position: 2, name: label, item: url },
    ],
  };
}

type PageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

type PageInput = {
  locale: Locale;
  dict: Dictionary;
  page: RouteKey;
  type?: PageType;
  /** Extra properties for the WebPage node (mainEntity, abstract...). */
  props?: Node;
  /** Extra graph nodes: FAQ, lists, offers. */
  nodes?: Node[];
};

/** One connected graph for a page: WebPage (+ breadcrumb) plus whatever content nodes the page adds. */
export function pageGraph({ locale, dict, page, type = "WebPage", props = {}, nodes = [] }: PageInput) {
  const path = routes[page];
  const { title, description } = dict.meta[page];
  const url = pageUrl(locale, path);
  const crumb = page === "home" ? null : breadcrumbNode(locale, path, dict.common.nav.home, dict.common.nav[page]);

  const webPage: Node = {
    "@type": type,
    "@id": pageId(locale, path),
    url,
    name: page === "home" ? `${siteConfig.legalName} | ${title}` : title,
    description,
    inLanguage: localeMeta[locale].htmlLang,
    isPartOf: ref(siteId(locale)),
    about: ref(ORG_ID),
    publisher: ref(ORG_ID),
    ...(crumb ? { breadcrumb: ref(crumb["@id"] as string) } : {}),
    potentialAction: { "@type": "ReadAction", target: [url] },
    ...props,
  };

  return graph([webPage, ...(crumb ? [crumb] : []), ...nodes]);
}

/** Privacy / Terms: English-only pages with a known last-modified date. */
export function legalPageGraph(doc: LegalDocument, homeLabel: string) {
  const locale = defaultLocale;
  const url = pageUrl(locale, doc.path);
  const crumb = breadcrumbNode(locale, doc.path, homeLabel, doc.title);

  return graph([
    {
      "@type": "WebPage",
      "@id": pageId(locale, doc.path),
      url,
      name: doc.title,
      description: doc.description,
      inLanguage: localeMeta[locale].htmlLang,
      dateModified: LEGAL_LAST_UPDATED_ISO,
      isPartOf: ref(siteId(locale)),
      publisher: ref(ORG_ID),
      breadcrumb: ref(crumb["@id"] as string),
    },
    crumb,
  ]);
}

/** FAQPage node, attached to its WebPage. Answers are plain text so answer engines can quote them. */
export function faqNode(locale: Locale, page: RouteKey, items: { question: string; answer: string }[]): Node {
  const path = routes[page];
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl(locale, path)}#faq`,
    url: pageUrl(locale, path),
    inLanguage: localeMeta[locale].htmlLang,
    isPartOf: ref(pageId(locale, path)),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function howToNode(locale: Locale, page: RouteKey, anchor: string, name: string, description: string, steps: { name: string; text: string }[]): Node {
  const path = routes[page];
  return {
    "@type": "HowTo",
    "@id": `${pageUrl(locale, path)}#${anchor}`,
    name,
    description,
    inLanguage: localeMeta[locale].htmlLang,
    isPartOf: ref(pageId(locale, path)),
    step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
  };
}

/* ------------------------------ page-specific nodes ------------------------------ */

export function homeGraph(locale: Locale, dict: Dictionary) {
  const { services, process, faq } = dict.home;
  const listId = `${pageUrl(locale, "/")}#services`;

  return pageGraph({
    locale,
    dict,
    page: "home",
    props: { mainEntity: ref(listId) },
    nodes: [
      {
        "@type": "ItemList",
        "@id": listId,
        name: services.title,
        description: services.description,
        itemListElement: services.items.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Service",
            name: s.title,
            serviceType: s.title,
            description: s.description,
            provider: ref(ORG_ID),
            areaServed: AREA_SERVED,
          },
        })),
      },
      howToNode(
        locale,
        "home",
        "process",
        process.title,
        process.description,
        process.steps.map((s) => ({ name: s.title, text: s.description })),
      ),
      faqNode(locale, "home", faq.items),
    ],
  });
}

export function aboutGraph(locale: Locale, dict: Dictionary) {
  return pageGraph({
    locale,
    dict,
    page: "about",
    type: "AboutPage",
    props: { mainEntity: ref(ORG_ID), abstract: dict.about.story.paragraphs[0] },
  });
}

export function contactGraph(locale: Locale, dict: Dictionary) {
  return pageGraph({ locale, dict, page: "contact", type: "ContactPage", props: { mainEntity: ref(ORG_ID) } });
}

/** Rough schema.org application category per showcase category. */
const APPLICATION_CATEGORY: Record<string, string> = {
  analytics: "BusinessApplication",
  donation: "BusinessApplication",
  academy: "EducationalApplication",
};

export function showcaseGraph(locale: Locale, dict: Dictionary) {
  const { showcase } = dict;
  const listId = `${pageUrl(locale, "/showcase")}#projects`;

  const items = showcase.projects.map((p, i) => {
    const asset = projectAssets[p.slug as ProjectSlug];
    const common = {
      name: p.name,
      description: `${p.summary} ${p.result}.`,
      keywords: p.tags.join(", "),
      creator: ref(ORG_ID),
      ...(asset.url ? { url: asset.url } : {}),
      ...(asset.image ? { image: absoluteUrl(asset.image) } : {}),
      ...(asset.completed ? { dateCreated: asset.completed } : {}),
    };
    const item: Node =
      asset.group === "dashboards"
        ? {
            "@type": "WebApplication",
            ...common,
            applicationCategory: APPLICATION_CATEGORY[p.category] ?? "BusinessApplication",
            operatingSystem: "Web",
            ...("comingSoon" in asset ? { creativeWorkStatus: "Upcoming" } : {}),
          }
        : { "@type": "WebSite", ...common };
    return { "@type": "ListItem", position: i + 1, item };
  });

  const { stack } = showcase;
  return pageGraph({
    locale,
    dict,
    page: "showcase",
    type: "CollectionPage",
    props: { mainEntity: ref(listId) },
    nodes: [
      { "@type": "ItemList", "@id": listId, name: showcase.hero.title, numberOfItems: items.length, itemListElement: items },
      howToNode(
        locale,
        "showcase",
        "how-we-build",
        stack.title,
        stack.description,
        TOOL_KINDS.map((k) => ({ name: stack.demo.tools[k].label, text: stack.demo.tools[k].hint })),
      ),
    ],
  });
}

export function pricingGraph(locale: Locale, dict: Dictionary) {
  const { pricing } = dict;
  const base = pageUrl(locale, "/pricing");
  const market = regions.my;
  const eligibleRegion = AREA_SERVED[0];

  // Indicative starting prices for the default market (Malaysia), excluding taxes.
  const priceSpec = (min: number) => ({ "@type": "PriceSpecification", minPrice: min, priceCurrency: market.currency, valueAddedTaxIncluded: false });

  const packages = levelIds.map((level) => {
    const l = pricing.levels[level];
    const prices = levelPrices[level];
    return {
      "@type": "Offer",
      name: l.name,
      description: `${l.fits}. ${l.description}${prices ? "" : ` ${pricing.customNote}.`}`,
      seller: ref(ORG_ID),
      eligibleRegion,
      ...(prices ? { priceSpecification: priceSpec(prices.my), priceCurrency: market.currency } : {}),
      itemOffered: { "@type": "Service", name: l.name, description: l.features.join("; "), provider: ref(ORG_ID) },
    };
  });

  const addons = pricing.addons.items.map((a) => ({
    "@type": "Offer",
    name: a.name,
    description: `${a.description} (${a.unit})`,
    seller: ref(ORG_ID),
    eligibleRegion,
    priceSpecification: priceSpec(addonPrices[a.id as keyof typeof addonPrices].my),
    priceCurrency: market.currency,
  }));

  return pageGraph({
    locale,
    dict,
    page: "pricing",
    props: { mainEntity: ref(`${base}#packages`) },
    nodes: [
      { "@type": "OfferCatalog", "@id": `${base}#packages`, name: pricing.hero.title, itemListElement: packages },
      { "@type": "OfferCatalog", "@id": `${base}#addons`, name: pricing.addons.title, itemListElement: addons },
      faqNode(locale, "pricing", pricing.faq.items),
    ],
  });
}
