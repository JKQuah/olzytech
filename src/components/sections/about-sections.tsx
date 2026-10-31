import { Gauge, Handshake, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";
import { ScrollHighlight } from "@/components/motion/scroll-highlight";
import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import { LogoMark } from "@/components/shared/logo";
import type { Dictionary } from "@/i18n/dictionaries";

type About = Dictionary["about"];

export function StorySection({ dict }: { dict: About["story"] }) {
  return (
    <Section>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="flex flex-col gap-6">
          <span className="text-brand text-xs font-semibold tracking-[0.22em] uppercase">{dict.eyebrow}</span>
          <h2 className="text-fade-brand text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl">
            {dict.title}
          </h2>
          {/* both paragraphs light up as one continuous block */}
          <ScrollHighlight text={dict.paragraphs} className="space-y-6 text-base leading-relaxed text-white md:text-xl" />
        </Reveal>

        <Reveal delay={120} aria-hidden="true">
          <div className="glass relative grid aspect-square place-items-center overflow-hidden rounded-[2rem]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 70% at 50% 110%, rgb(var(--to-rgb) / 0.75), transparent 70%), radial-gradient(40% 40% at 50% 45%, rgb(var(--from-rgb) / 0.25), transparent 70%)",
              }}
            />
            <div className="animate-drift absolute inset-10 rounded-full border border-white/15 [animation-duration:60s]" />
            <div className="animate-drift absolute inset-20 rounded-full border border-dashed border-brand-mid/40 [animation-direction:reverse] [animation-duration:90s]" />
            <LogoMark className="relative size-28 drop-shadow-[0_0_40px_rgb(var(--to-rgb)/0.8)]" />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

const valueIcons: LucideIcon[] = [Sparkles, Lightbulb, Gauge, Handshake];

export function ValuesSection({ dict }: { dict: About["values"] }) {
  return (
    <Section>
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} />
      <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {dict.items.map((item, i) => {
          const Icon = valueIcons[i] ?? Sparkles;
          return (
            <Reveal as="li" key={item.title} delay={i * 80}>
              <article className="glass spotlight h-full rounded-3xl p-7">
                <Icon className="mb-5 size-7 text-brand-from" />
                <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{item.description}</p>
              </article>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
