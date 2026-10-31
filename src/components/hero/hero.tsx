import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";
import { Parallax } from "@/components/motion/parallax";
import { LocaleLink } from "@/components/shared/locale-link";
import { WordsRise } from "@/components/shared/words-rise";
import type { Dictionary } from "@/i18n/dictionaries";
import { PlanetBackdrop } from "./planet-backdrop";
import { HeroDashboard } from "./hero-dashboard";

export function Hero({ dict, common }: { dict: Dictionary["home"]["hero"]; common: Dictionary["common"] }) {
  return (
    <section className="relative isolate overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      <PlanetBackdrop className="-z-10" />

      <Parallax speed={0.12} fade className="container-page flex flex-col items-center text-center">
        <span
          className="animate-rise glass mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-white/90"
          style={{ animationDelay: "0ms" }}
        >
          <span className="bg-brand size-1.5 animate-pulse rounded-full shadow-[0_0_10px_2px_rgb(var(--to-rgb)/0.8)]" />
          {dict.badge}
        </span>

        <h1 className="text-5xl leading-[1.02] font-semibold tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-[5.5rem]">
          <span className="block text-white [text-shadow:0_0_60px_rgb(255_255_255/0.25)]">
            <WordsRise text={dict.titleLine1} delay={150} />
          </span>
          <span className="block pb-2">
            <WordsRise text={dict.titleLine2} delay={150 + dict.titleLine1.split(" ").length * 90} className="text-fade-brand" />
          </span>
        </h1>

        <p
          className="animate-rise mt-6 max-w-xl text-base leading-relaxed text-pretty text-white/75 md:text-lg"
          style={{ animationDelay: "650ms" }}
        >
          {dict.subtitle}
        </p>

        <div className="animate-rise mt-9 flex flex-col items-center gap-4 sm:flex-row" style={{ animationDelay: "800ms" }}>
          <Magnetic>
            <Button asChild variant="dark" size="pill-lg" className="shadow-[0_0_50px_-10px_rgb(var(--to-rgb)/0.8)]">
              <LocaleLink href="/contact">
                {common.startFreeNow}
                <span className="bg-brand grid size-10 place-items-center rounded-full transition-transform group-hover/button:translate-x-0.5">
                  <ArrowRight className="size-4" />
                </span>
              </LocaleLink>
            </Button>
          </Magnetic>
          <Button asChild variant="glass" size="pill">
            <LocaleLink href="/showcase">{common.viewShowcase}</LocaleLink>
          </Button>
        </div>
      </Parallax>

      <div className="container-page mt-16 md:mt-24">
        <HeroDashboard cards={dict.cards} />
      </div>
    </section>
  );
}
