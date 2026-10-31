import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import type { Dictionary } from "@/i18n/dictionaries";

export function StatsStrip({ dict }: { dict: Dictionary["home"]["stats"] }) {
  return (
    <Section className="py-12 md:py-16">
      <Reveal>
        <dl className="glass grid grid-cols-2 gap-y-8 rounded-3xl px-6 py-10 md:grid-cols-4 md:px-10">
          {dict.items.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 text-center md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-white/20">
              <dd className="text-brand order-1 text-4xl font-semibold tracking-tight md:text-5xl">
                <CountUp value={item.value} duration={2000} />
              </dd>
              <dt className="text-muted-foreground order-2 max-w-[14rem] text-xs leading-snug md:text-sm">{item.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
