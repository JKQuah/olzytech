import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/shared/json-ld";
import { localizedPath } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { LEGAL_LAST_UPDATED, privacyPolicy, termsAndConditions, type LegalBlock, type LegalDocument } from "@/content/legal";
import { defaultLocale } from "@/i18n/config";
import { getDictionaryFor } from "@/i18n/dictionaries";
import { legalPageGraph } from "@/lib/structured-data";
import { LegalToc } from "./legal-toc";

const linkClass = "text-brand-from underline decoration-white/20 underline-offset-4 transition-colors hover:decoration-brand-from";

/** Replaces {{email}} {{phone}} {{privacy}} {{terms}} tokens with links. */
function Inline({ text }: { text: string }): ReactNode {
  return text.split(/(\{\{\w+\}\})/).map((part, i) => {
    const token = part.match(/^\{\{(\w+)\}\}$/)?.[1];
    switch (token) {
      case "email":
        return (
          <a key={i} href={`mailto:${siteConfig.email}`} className={linkClass}>
            {siteConfig.email}
          </a>
        );
      case "phone":
        return (
          <a key={i} href={`tel:${siteConfig.phoneE164}`} className={linkClass}>
            {siteConfig.phone}
          </a>
        );
      case "privacy":
        return (
          <Link key={i} href={localizedPath(defaultLocale, privacyPolicy.path)} className={linkClass}>
            {privacyPolicy.title}
          </Link>
        );
      case "terms":
        return (
          <Link key={i} href={localizedPath(defaultLocale, termsAndConditions.path)} className={linkClass}>
            {termsAndConditions.title}
          </Link>
        );
      default:
        return part;
    }
  });
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "ul") {
    return (
      <ul className="space-y-2.5 pl-5 text-[0.95rem] leading-relaxed text-white/75 marker:text-brand-from [&>li]:list-disc [&>li]:pl-1">
        {block.items.map((item) => (
          <li key={item}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-[0.95rem] leading-relaxed text-white/75">
      <Inline text={block.text} />
    </p>
  );
}

/** Shared layout for the English-only legal pages. */
export async function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  const { common } = await getDictionaryFor(defaultLocale);
  return (
    <>
      <JsonLd data={legalPageGraph(doc, common.nav.home)} />
      <PageHero eyebrow="Legal" title={doc.title} description={`Last updated: ${LEGAL_LAST_UPDATED}`} />

      {/* Content is English only, whatever language the visitor browses in. */}
      <div lang="en" className="container-page pb-24 md:pb-32">
        <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <LegalToc label="On this page" items={doc.sections.map(({ id, title }) => ({ id, title }))} />
          </aside>

          <article className="glass rounded-3xl p-6 md:p-10">
            <p className="text-base leading-relaxed text-white/85 md:text-lg">{doc.intro}</p>

            <div className="mt-10 space-y-12">
              {doc.sections.map((section, i) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2 className="flex gap-3 text-xl font-semibold tracking-tight text-white md:text-2xl">
                    <span className="text-brand tabular-nums">{i + 1}.</span>
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.blocks.map((block, j) => (
                      <Block key={j} block={block} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
