import { Hero } from "@/components/hero/hero";
import { ScrollHighlight } from "@/components/motion/scroll-highlight";
import { JsonLd } from "@/components/shared/json-ld";
import { LocaleLink } from "@/components/shared/locale-link";
import { Section, SectionHeading } from "@/components/shared/section";
import { CtaBanner } from "@/components/sections/cta-banner";
import { FaqList } from "@/components/sections/faq-list";
import { ProcessSteps } from "@/components/sections/process-steps";
import { RevampShowcase } from "@/components/sections/revamp-showcase";
import { ServicesGrid } from "@/components/sections/services-grid";
import { ShowcaseGrid } from "@/components/sections/showcase-grid";
import { StatsStrip } from "@/components/sections/stats-strip";
import { TechStrip } from "@/components/sections/tech-strip";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createPageMetadata } from "@/lib/page-metadata";
import { homeGraph } from "@/lib/structured-data";

export const generateMetadata = createPageMetadata("home");

export default async function HomePage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const { home } = dict;

  return (
    <>
      <Hero dict={home.hero} common={dict.common} />
      <TechStrip dict={home.trust} />
      <ServicesGrid dict={home.services} />
      <Section className="py-24 md:py-36">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-brand text-xs font-semibold tracking-[0.22em] uppercase">{home.manifesto.eyebrow}</span>
          <ScrollHighlight
            text={home.manifesto.text}
            className="mt-8 text-2xl leading-[1.35] font-medium tracking-tight text-white text-balance md:text-4xl lg:text-[2.75rem]"
          />
        </div>
      </Section>
      <ProcessSteps dict={home.process} />
      <StatsStrip dict={home.stats} />

      <RevampShowcase dict={home.revamp} />

      <Section>
        <SectionHeading eyebrow={home.showcase.eyebrow} title={home.showcase.title} description={home.showcase.description} />
        <div className="mt-14">
          <ShowcaseGrid dict={dict.showcase} limit={3} group="websites" />
        </div>
        <div className="mt-12 flex justify-center">
          <Button asChild variant="glass" size="pill">
            <LocaleLink href="/showcase">{dict.common.viewAllWork}</LocaleLink>
          </Button>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow={home.faq.eyebrow} title={home.faq.title} />
        <div className="mt-12">
          <FaqList items={home.faq.items} />
        </div>
      </Section>

      <CtaBanner
        title={home.cta.title}
        description={home.cta.description}
        primary={{ label: home.cta.primary, href: "/contact" }}
        secondary={{ label: home.cta.secondary, href: "/pricing" }}
      />

      <JsonLd data={homeGraph(locale, dict)} />
    </>
  );
}
