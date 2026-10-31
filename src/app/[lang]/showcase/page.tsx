import { CtaBanner } from "@/components/sections/cta-banner";
import { PageHero } from "@/components/sections/page-hero";
import { ShowcaseGrid } from "@/components/sections/showcase-grid";
import { StackSection } from "@/components/sections/stack-section";
import { JsonLd } from "@/components/shared/json-ld";
import { Section, SectionHeading } from "@/components/shared/section";
import { type ProjectGroup } from "@/content/projects";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createPageMetadata } from "@/lib/page-metadata";
import { showcaseGraph } from "@/lib/structured-data";

export const generateMetadata = createPageMetadata("showcase");

/** Showcase sections, in display order. Copy is under `showcase.sections` in the message files. */
const sections: ProjectGroup[] = ["websites", "dashboards"];

export default async function ShowcasePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const { showcase, home } = dict;

  return (
    <>
      <PageHero {...showcase.hero} />

      {sections.map((group, i) => (
        <Section key={group} className={i === 0 ? "pt-4" : undefined}>
          <SectionHeading
            eyebrow={showcase.sections[group].eyebrow}
            title={showcase.sections[group].title}
            description={showcase.sections[group].description}
          />
          <div className="mt-14">
            <ShowcaseGrid dict={showcase} group={group} />
          </div>
        </Section>
      ))}

      <StackSection dict={showcase.stack} />

      <JsonLd data={showcaseGraph(locale, dict)} />

      <CtaBanner
        title={home.cta.title}
        description={home.cta.description}
        primary={{ label: home.cta.primary, href: "/contact" }}
        secondary={{ label: home.cta.secondary, href: "/pricing" }}
      />
    </>
  );
}
