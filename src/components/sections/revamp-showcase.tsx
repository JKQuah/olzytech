import { Headset, Languages, MousePointerClick, Palette, type LucideIcon } from "lucide-react";
import { BeforeAfter } from "@/components/motion/before-after";
import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import type { Dictionary } from "@/i18n/dictionaries";

/** One icon per change, in the same order as `home.revamp.changes`: language, UI design, interaction, support. */
const changeIcons: LucideIcon[] = [Languages, Palette, MousePointerClick, Headset];

/** Natural size of the screenshots in /public/images/revamp (same for both). */
const SHOT = { width: 1440, height: 900 };

/** Real client revamp: draggable before/after of the old and new homepage, plus what changed. */
export function RevampShowcase({ dict }: { dict: Dictionary["home"]["revamp"] }) {
  return (
    <Section id="revamp">
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

      <Reveal className="mx-auto mt-14 max-w-5xl" variant="scale">
        <BeforeAfter
          width={SHOT.width}
          height={SHOT.height}
          before={{ src: "/images/revamp/before.webp", alt: dict.beforeAlt }}
          after={{ src: "/images/revamp/after.webp", alt: dict.afterAlt }}
          labels={{ before: dict.before, after: dict.after, hint: dict.hint, slider: dict.slider }}
        />
      </Reveal>

      <div className="mt-14">
        <Reveal>
          <h3 className="text-center text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">{dict.changesTitle}</h3>
        </Reveal>
        {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dict.changes.map((item, i) => {
            const Icon = changeIcons[i] ?? Palette;
            return (
            <Reveal as="li" key={item.title} delay={i * 80}>
              <div className="glass flex h-full gap-4 rounded-2xl p-5 lg:flex-col lg:gap-3.5 lg:p-6">
                <span className="bg-brand mt-0.5 grid size-8 shrink-0 place-items-center rounded-full lg:mt-0">
                  <Icon className="size-4 text-white" />
                </span>
                <div>
                  <h4 className="font-semibold tracking-tight">{item.title}</h4>
                  <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Reveal>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
