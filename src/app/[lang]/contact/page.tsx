import { JsonLd } from "@/components/shared/json-ld";
import { Section } from "@/components/shared/section";
import { Reveal } from "@/components/shared/reveal";
import { ContactForm } from "@/components/sections/contact-form";
import { ContactInfo } from "@/components/sections/contact-info";
import { PageHero } from "@/components/sections/page-hero";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { createPageMetadata } from "@/lib/page-metadata";
import { contactGraph } from "@/lib/structured-data";

export const generateMetadata = createPageMetadata("contact");

export default async function ContactPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const { contact } = dict;

  return (
    <>
      <PageHero {...contact.hero} />
      <Section className="pt-4">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <ContactForm locale={locale} dict={contact.form} />
          </Reveal>
          <ContactInfo dict={contact.info} />
        </div>
      </Section>
      <JsonLd data={contactGraph(locale, dict)} />
    </>
  );
}
