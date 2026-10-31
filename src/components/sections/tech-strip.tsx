import { Reveal } from "@/components/shared/reveal";
import { TechLabel } from "@/components/shared/tech-label";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * How many times the list repeats inside ONE track. A track must be at least as wide as the
 * widest screen for the loop to be seamless. One list (11 items with icons) is ~1830px wide, so 3 repeats (~5500px)
 * cover everything up to 5K displays.
 */
const REPEATS = 3;

/** Seconds for one list to pass. The track is REPEATS lists long, so its duration scales with it (constant speed). */
const SECONDS_PER_LIST = 83;

/**
 * Infinitely scrolling technology strip with a seamless loop.
 *
 * Two identical tracks sit side by side and each slides left by exactly its own width, so the
 * moment one track has fully left, the other is exactly where it started. Every item is followed
 * by the same gap (`gap-14` + `pr-14` on the track), so the seam is invisible. Repeats and the
 * second track are aria-hidden; the strip pauses on hover.
 */
export function TechStrip({ dict }: { dict: Dictionary["home"]["trust"] }) {
  return (
    <section aria-label={dict.label} className="relative py-10">
      <Reveal className="flex flex-col items-center gap-6">
        <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">{dict.label}</p>
        <div className="marquee-mask group flex w-full overflow-hidden select-none">
          {[0, 1].map((track) => (
            <ul
              key={track}
              aria-hidden={track === 1 ? true : undefined}
              className="animate-marquee flex shrink-0 items-center gap-14 pr-14 text-xl font-medium text-white/45 group-hover:[animation-play-state:paused]"
              style={{ animationDuration: `${SECONDS_PER_LIST * REPEATS}s` }}
            >
              {Array.from({ length: REPEATS }, (_, copy) =>
                dict.items.map((item) => (
                  <li
                    key={`${copy}-${item}`}
                    aria-hidden={track === 1 || copy > 0 ? true : undefined}
                    className="whitespace-nowrap transition-colors hover:text-white"
                  >
                    <TechLabel name={item} />
                  </li>
                )),
              )}
            </ul>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
