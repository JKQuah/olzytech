import { ScrollProgressTracker } from "@/components/motion/scroll-progress-tracker";
import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import type { Dictionary } from "@/i18n/dictionaries";

export function ProcessSteps({ dict }: { dict: Dictionary["home"]["process"] }) {
  return (
    <Section id="process" className="overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{ background: "radial-gradient(closest-side, rgb(var(--to-rgb) / 0.35), transparent)" }}
      />
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

      {/* ScrollProgressTracker drives --p (0..1) and data-active on each <li> as you scroll past. */}
      <ol className="relative mt-16 grid gap-8 lg:grid-cols-5 lg:gap-6">
        <ScrollProgressTracker />
        {/* desktop: horizontal rail */}
        <div aria-hidden="true" className="absolute top-6 right-[10%] left-[10%] hidden h-px bg-white/15 lg:block">
          <div
            className="bg-brand h-full origin-left shadow-[0_0_12px_1px_rgb(var(--to-rgb)/0.8)]"
            style={{ transform: "scaleX(var(--p, 0))" }}
          />
        </div>
        {/* mobile: vertical rail */}
        <div aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-px bg-white/15 lg:hidden">
          <div
            className="bg-brand h-full w-full origin-top shadow-[0_0_12px_1px_rgb(var(--to-rgb)/0.8)]"
            style={{ transform: "scaleY(var(--p, 0))" }}
          />
        </div>

        {dict.steps.map((step, i) => (
          <Reveal
            as="li"
            key={step.title}
            delay={i * 90}
            className="group relative flex gap-5 lg:flex-col lg:items-center lg:text-center"
          >
            <span className="glass grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold text-white transition-all duration-500 group-data-[active=true]:scale-110 group-data-[active=true]:bg-brand group-data-[active=true]:shadow-[0_0_30px_2px_rgb(var(--to-rgb)/0.7)]">
              <span className="text-brand transition-colors duration-500 group-data-[active=true]:text-white group-data-[active=true]:[-webkit-text-fill-color:#fff]">
                {String(i + 1).padStart(2, "0")}
              </span>
            </span>
            <div className="opacity-50 transition-opacity duration-500 group-data-[active=true]:opacity-100">
              <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
