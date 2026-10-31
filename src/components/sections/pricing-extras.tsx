import { Building2, Check, Rocket, Star, User, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/shared/locale-link";
import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import { visibleTestimonials, showDrafts } from "@/content/testimonials";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Dict = Dictionary["pricing"];

/** Icon per audience, in the same order as `pricing.audience.items`: personal, startups, SMEs. */
const audienceIcons: LucideIcon[] = [User, Rocket, Building2];

/** Who the packages are for: individuals (portfolio / resume), startups and SMEs. */
export function AudienceSection({ dict }: { dict: Dict["audience"] }) {
  return (
    <Section className="py-12 md:py-16">
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
      <ul className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
        {dict.items.map((item, i) => {
          const Icon = audienceIcons[i] ?? User;
          return (
          <Reveal as="li" key={item.title} delay={i * 80}>
            <div className="glass h-full rounded-3xl p-7">
              <span className="bg-brand mb-5 grid size-11 place-items-center rounded-2xl">
                <Icon className="size-5 text-white" />
              </span>
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.description}</p>
            </div>
          </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}

/** Free consultation: exactly what you get, with a booking button. */
export function ConsultationSection({ dict }: { dict: Dict["consultation"] }) {
  return (
    <Section>
      <Reveal>
        <div className="glass relative overflow-hidden rounded-[2rem] p-8 md:p-12">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 -z-10 size-[420px] rounded-full opacity-60"
            style={{ background: "radial-gradient(closest-side, rgb(var(--to-rgb) / 0.45), transparent)" }}
          />
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            <div className="flex flex-col items-start gap-5">
              <span className="text-brand text-xs font-semibold tracking-[0.22em] uppercase">{dict.eyebrow}</span>
              <h2 className="text-fade-brand text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl">{dict.title}</h2>
              <p className="text-muted-foreground text-base leading-relaxed md:text-lg">{dict.description}</p>
              <Button asChild variant="brand" size="pill" className="mt-2 h-12 px-7">
                <LocaleLink href="/contact">{dict.cta}</LocaleLink>
              </Button>
              <p className="text-muted-foreground text-xs leading-relaxed">{dict.note}</p>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-[0.18em] text-white/60 uppercase">{dict.includesTitle}</h3>
              <ul className="flex flex-col gap-3.5">
                {dict.items.map((item) => (
                  <li key={item} className="flex items-start gap-3.5 rounded-xl bg-white/[0.04] p-3.5 text-sm leading-relaxed text-white/90">
                    <span className="bg-brand mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
                      <Check className="size-3.5 text-white" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/**
 * Client testimonials with star ratings. Only APPROVED entries are shown in production; drafts are
 * visible in development with a badge (see content/testimonials.ts). Renders nothing if there is nothing to show.
 */
export function TestimonialsSection({ dict }: { dict: Dict["testimonials"] }) {
  const items = visibleTestimonials();
  if (items.length === 0) return null;

  return (
    <Section>
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
      <ul className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">
        {items.map((t, i) => {
          const copy = dict.items[t.id as keyof typeof dict.items];
          if (!copy) return null;
          return (
            <Reveal as="li" key={t.id} delay={i * 90} variant="scale">
              <figure className="glass flex h-full flex-col gap-5 rounded-3xl p-7">
                <div className="flex items-center justify-between gap-3">
                  <div role="img" aria-label={`${t.rating} / 5`} className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} aria-hidden="true" className={cn("size-5", n <= t.rating ? "fill-brand-from text-brand-from" : "text-white/20")} />
                    ))}
                  </div>
                  {showDrafts && !t.approved && (
                    <span className="rounded-full border border-amber-300/50 bg-amber-300/10 px-2.5 py-1 text-[10px] font-medium text-amber-200">
                      {dict.draft}
                    </span>
                  )}
                </div>
                <blockquote className="flex-1 text-[0.95rem] leading-relaxed text-white/90">“{copy.quote}”</blockquote>
                <figcaption className="flex items-center gap-3 border-t border-white/10 pt-5">
                  <span aria-hidden="true" className="bg-brand grid size-11 place-items-center rounded-full text-sm font-semibold text-white">
                    {copy.role.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{copy.name}</span>
                    <span className="text-muted-foreground block text-xs">{copy.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
