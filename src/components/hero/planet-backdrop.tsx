import { Parallax } from "@/components/motion/parallax";
import { cn } from "@/lib/utils";

/** Deterministic PRNG so server and client render identical star fields. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIELD_W = 2200;
const FIELD_H = 1100;

function starShadow(count: number, seed: number, tintRatio = 0.25) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const x = Math.round(rand() * FIELD_W);
    const y = Math.round(rand() * FIELD_H);
    const alpha = (0.4 + rand() * 0.6).toFixed(2);
    const tinted = rand() < tintRatio;
    return `${x}px ${y}px 0 0 ${tinted ? `rgb(var(--glow-rgb) / ${alpha})` : `rgb(255 255 255 / ${alpha})`}`;
  }).join(",");
}

const STARS_SMALL = starShadow(170, 7);
const STARS_TWINKLE = starShadow(26, 21, 0.5);

/**
 * Full-bleed hero backdrop: a dark planet whose themed limb glows over a star field.
 * Pure CSS/SVG (no image requests), fully decorative.
 */
export function PlanetBackdrop({
  className,
  rim = "720px",
}: {
  className?: string;
  /** Distance from the top of the section to the bottom of the planet's glowing limb. */
  rim?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ "--rim": rim, "--pw": "clamp(900px, 112vw, 1800px)" } as React.CSSProperties}
    >
      {/* Stars: static field plus one gently twinkling layer (kept small: big layers cost GPU memory) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ width: FIELD_W, height: FIELD_H }}>
        <i className="absolute top-0 left-0 block size-px rounded-full" style={{ boxShadow: STARS_SMALL }} />
        <i
          className="animate-twinkle absolute top-0 left-0 block size-[2px] rounded-full"
          style={{ boxShadow: STARS_TWINKLE }}
        />
      </div>

      {/* Planet */}
      <Parallax speed={0.22} className="absolute inset-0">
      <div className="absolute left-1/2 aspect-square w-(--pw) -translate-x-1/2 top-[calc(var(--rim)-var(--pw))]">
        {/* outer atmospheric halo */}
        <div
          className="absolute inset-0 rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(closest-side, transparent 84%, rgb(var(--to-rgb) / 0.4) 93%, rgb(var(--to-rgb) / 0.12) 98%, transparent 100%)",
          }}
        />
        {/* disc + glowing limb */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, #000 0 80%, rgb(var(--night-rgb)) 86%, rgb(var(--wine-rgb)) 91%, rgb(var(--rose-rgb)) 95.5%, rgb(var(--to-rgb)) 97.5%, rgb(var(--glow-rgb)) 98.6%, rgb(var(--from-rgb) / 0) 100%)",
          }}
        />
        {/* Nebula clouds hugging the limb. A pre-coloured texture (per theme, `--nebula-img`) that turns
            slowly: rotating one plain image is a pure compositor job, unlike the masked + blended
            layer it replaced. See config/themes.ts and public/textures. */}
        <div
          className="animate-drift absolute inset-0 rounded-full opacity-90 [animation-duration:180s]"
          style={{ backgroundImage: "var(--nebula-img)", backgroundSize: "100% 100%" }}
        />
        {/* Rim light with bright and dim stretches (pre-baked per theme, `--limb-img`). It orbits the
            planet a little faster than the clouds, so the glow visibly travels around the circle. */}
        <div
          className="animate-drift absolute inset-0 rounded-full [animation-duration:110s]"
          style={{ backgroundImage: "var(--limb-img)", backgroundSize: "100% 100%" }}
        />
      </div>
      </Parallax>

      {/* Horizontal light flare behind the dashboard */}
      <div
        className="absolute inset-x-0 bottom-[-6%] h-[62%] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 55% 22% at 50% 58%, rgb(var(--glow-rgb) / 0.5), transparent 70%), radial-gradient(ellipse 85% 34% at 50% 62%, rgb(var(--to-rgb) / 0.28), transparent 72%)",
        }}
      />

      {/* Blend into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black" />
    </div>
  );
}
