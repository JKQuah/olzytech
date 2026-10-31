import { CtaBanner } from "@/components/sections/cta-banner";
import { FaqList } from "@/components/sections/faq-list";
import { PageHero } from "@/components/sections/page-hero";
import { PricingExplorer } from "@/components/sections/pricing-explorer";
import { AudienceSection, ConsultationSection, TestimonialsSection } from "@/components/sections/pricing-extras";
import { JsonLd } from "@/components/shared/json-ld";
import { Section, SectionHeading } from "@/components/shared/section";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createPageMetadata } from "@/lib/page-metadata";
import { pricingGraph } from "@/lib/structured-data";

export const generateMetadata = createPageMetadata("pricing");

export default async function PricingPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const { pricing } = dict;

  return (
    <>
      <PageHero {...pricing.hero} />
      <AudienceSection dict={pricing.audience} />
      <PricingExplorer
        locale={locale}
        dict={{
          packages: pricing.packages,
          regionLabel: pricing.regionLabel,
          regions: pricing.regions,
          comingSoon: pricing.comingSoon,
          custom: pricing.custom,
          customNote: pricing.customNote,
          contactSales: pricing.contactSales,
          from: pricing.from,
          popular: pricing.popular,
          levels: pricing.levels,
          choose: pricing.choose,
          oneOff: pricing.oneOff,
          addons: pricing.addons,
        }}
      />
      <ConsultationSection dict={pricing.consultation} />
      <TestimonialsSection dict={pricing.testimonials} />

      <Section>
        <SectionHeading title={pricing.faq.title} />
        <div className="mt-12">
          <FaqList items={pricing.faq.items} />
        </div>
      </Section>

      <CtaBanner
        title={pricing.cta.title}
        description={pricing.cta.description}
        primary={{ label: pricing.cta.primary, href: "/contact" }}
      />

      {/* Structured data uses the default market (Malaysia). */}
      <JsonLd data={pricingGraph(locale, dict)} />
    </>
  );
}
