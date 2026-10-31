import { Code2, Cloud, ClipboardList, LifeBuoy, Palette, Search, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import type { Dictionary } from "@/i18n/dictionaries";

/** Icon per service, in the same order as `home.services.items`. */
const icons: LucideIcon[] = [Palette, Code2, ClipboardList, Cloud, Search, LifeBuoy];

export function ServicesGrid({ dict }: { dict: Dictionary["home"]["services"] }) {
  return (
    <Section id="services">
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
      <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {dict.items.map((item, i) => {
          const Icon = icons[i] ?? Code2;
          return (
            <Reveal as="li" key={item.title} delay={i * 70} variant="scale">
              <article className="glass spotlight group h-full rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1">
                <span className="bg-brand mb-6 grid size-12 place-items-center rounded-2xl shadow-[0_10px_30px_-8px_rgb(var(--to-rgb)/0.7)]">
                  <Icon className="size-5 text-white" />
                </span>
                <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{item.description}</p>
              </article>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
