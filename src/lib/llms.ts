import { localizedPath, legalRoutes, routes, navRoutes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { LEGAL_LAST_UPDATED_ISO } from "@/content/legal";
import { addonPrices, formatAmount, levelIds, levelPrices, regions } from "@/content/pricing";
import { projectAssets, type ProjectSlug } from "@/content/projects";
import { defaultLocale, localeMeta, locales } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { absoluteUrl } from "./seo";

/**
 * Plain-text, Markdown-flavoured summaries of the site for AI answer engines (the llms.txt convention,
 * https://llmstxt.org). English is the canonical language; links point at every translation. Everything is
 * generated from the same message files and config as the pages, so it cannot drift from the site.
 */
const en = () => getDictionaryFor(defaultLocale);
const url = (path: string, locale = defaultLocale) => absoluteUrl(localizedPath(locale, path));
const money = (n: number) => `${regions.my.symbol}${formatAmount(n)}`;

async function facts() {
  const d = await en();
  const { info } = d.contact;
  return [
    `- Name: ${siteConfig.legalName} (${siteConfig.name})`,
    `- What we do: ${d.meta.defaultDescription}`,
    `- Based in: ${info.locationValue}`,
    `- Markets: Malaysia, Singapore and Hong Kong`,
    `- Languages: ${locales.map((l) => `${localeMeta[l].nativeName} (${localeMeta[l].htmlLang})`).join(", ")}`,
    `- Email: ${siteConfig.email}`,
    `- Phone / WhatsApp: ${siteConfig.phone} (${siteConfig.phoneE164})`,
    `- ${info.hours}: ${info.hoursValue}`,
    `- Pricing: ${levelIds
      .map((l) => {
        const p = levelPrices[l];
        return `${d.pricing.levels[l].name} ${p ? `from ${money(p.my)}` : "custom quote"}`;
      })
      .join(", ")} (${regions.my.currency}, indicative starting prices, excluding taxes)`,
  ];
}

/** /llms.txt: a short index an AI agent can read first, with links to the detail. */
export async function buildLlmsTxt(): Promise<string> {
  const d = await en();
  const live = d.showcase.projects.filter((p) => projectAssets[p.slug as ProjectSlug].url);

  return [
    `# ${siteConfig.legalName}`,
    "",
    `> ${d.meta.home.description}`,
    "",
    "## Key facts",
    ...(await facts()),
    "",
    "## Pages",
    ...navRoutes.map((key) => `- [${d.meta[key].title}](${url(routes[key])}): ${d.meta[key].description}`),
    "",
    "## Services",
    ...d.home.services.items.map((s) => `- ${s.title}: ${s.description}`),
    "",
    "## Selected work",
    ...live.map((p) => `- [${p.name}](${projectAssets[p.slug as ProjectSlug].url}): ${p.summary}`),
    "",
    "## Translations",
    ...locales.filter((l) => l !== defaultLocale).map((l) => `- [${localeMeta[l].nativeName}](${url("/", l)})`),
    "",
    "## Optional",
    `- [Full site content for LLMs](${absoluteUrl("/llms-full.txt")}): every page's copy, FAQs, pricing and projects in one file`,
    `- [Privacy Policy](${url(legalRoutes.privacy)})`,
    `- [Terms and Conditions](${url(legalRoutes.terms)})`,
    "",
  ].join("\n");
}

/** /llms-full.txt: the substance of every page in one document, for retrieval and citation. */
export async function buildLlmsFullTxt(): Promise<string> {
  const d = await en();
  const { home, about, pricing, showcase, contact } = d;
  const bullets = (items: string[]) => items.map((i) => `- ${i}`);

  return [
    `# ${siteConfig.legalName}: full site content`,
    "",
    `> ${d.meta.home.description}`,
    "",
    "## Key facts",
    ...(await facts()),
    "",
    `## About (${url("/about")})`,
    `### ${about.story.title}`,
    ...about.story.paragraphs.flatMap((p) => [p, ""]),
    `### ${about.values.title}`,
    ...about.values.items.map((v) => `- **${v.title}.** ${v.description}`),
    "",
    `## Services (${url("/")})`,
    home.services.description,
    "",
    ...home.services.items.map((s) => `- **${s.title}.** ${s.description}`),
    "",
    `## ${home.process.title}`,
    home.process.description,
    "",
    ...home.process.steps.map((s, i) => `${i + 1}. **${s.title}.** ${s.description}`),
    "",
    `## Pricing (${url("/pricing")})`,
    pricing.hero.description,
    "",
    ...levelIds.flatMap((l) => {
      const lv = pricing.levels[l];
      const p = levelPrices[l];
      return [
        `### ${lv.name}: ${p ? `from ${money(p.my)}` : pricing.custom}`,
        `${lv.fits}. ${lv.description}`,
        ...bullets(lv.features),
        "",
      ];
    }),
    `### ${pricing.addons.title}`,
    ...pricing.addons.items.map((a) => `- **${a.name}** (${money(addonPrices[a.id as keyof typeof addonPrices].my)}, ${a.unit}): ${a.description}`),
    "",
    `### ${pricing.consultation.title}`,
    pricing.consultation.description,
    ...bullets(pricing.consultation.items),
    "",
    `## Frequently asked questions`,
    ...[...home.faq.items, ...pricing.faq.items].flatMap((f) => [`### ${f.question}`, f.answer, ""]),
    `## Projects (${url("/showcase")})`,
    ...showcase.projects.flatMap((p) => {
      const a = projectAssets[p.slug as ProjectSlug];
      return [
        `### ${p.name}${"comingSoon" in a ? " (coming soon)" : ""}`,
        p.summary,
        `- Result: ${p.result}`,
        `- Tags: ${p.tags.join(", ")}`,
        ...(a.url ? [`- Link: ${a.url}`] : []),
        "",
      ];
    }),
    `## Contact (${url("/contact")})`,
    ...bullets([
      `Email: ${siteConfig.email}`,
      `Phone / WhatsApp: ${siteConfig.phone} (${siteConfig.whatsapp})`,
      `${contact.info.hours}: ${contact.info.hoursValue}`,
      `${contact.info.location}: ${contact.info.locationValue}`,
    ]),
    "",
    `### ${contact.info.responseTitle}`,
    ...contact.info.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    `Legal pages were last updated ${LEGAL_LAST_UPDATED_ISO}: ${url(legalRoutes.privacy)}, ${url(legalRoutes.terms)}.`,
    "",
  ].join("\n");
}
