import { PlanetBackdrop } from "@/components/hero/planet-backdrop";
import { Reveal } from "@/components/shared/reveal";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

/** Compact hero for inner pages: same planet backdrop, smaller type. */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden pt-40 pb-28 md:pt-52 md:pb-56">
      <PlanetBackdrop className="-z-10" rim="620px" />
      <Reveal className="container-page flex max-w-4xl flex-col items-center gap-5 text-center">
        <span className="glass rounded-full px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-white/90 uppercase">
          {eyebrow}
        </span>
        <h1 className="text-fade-brand text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-pretty text-white/75 md:text-lg">{description}</p>
      </Reveal>
    </section>
  );
}
