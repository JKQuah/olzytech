import { CtaBanner } from "@/components/sections/cta-banner";
import { PageHero } from "@/components/sections/page-hero";
import { StorySection, ValuesSection } from "@/components/sections/about-sections";
import { JsonLd } from "@/components/shared/json-ld";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createPageMetadata } from "@/lib/page-metadata";
import { aboutGraph } from "@/lib/structured-data";

export const generateMetadata = createPageMetadata("about");

export default async function AboutPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const { about } = dict;

  return (
    <>
      <PageHero {...about.hero} />
      <StorySection dict={about.story} />
      <ValuesSection dict={about.values} />
      <CtaBanner
        title={about.cta.title}
        description={about.cta.description}
        primary={{ label: about.cta.primary, href: "/contact" }}
      />
      <JsonLd data={aboutGraph(locale, dict)} />
    </>
  );
}
