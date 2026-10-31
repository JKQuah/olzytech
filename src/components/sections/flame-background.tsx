import type { CSSProperties } from "react";
import { FlameField } from "@/components/motion/flame-field";

/**
 * One flame tongue. x = centre (% of banner width), w/h = size (% of banner), d = loop seconds,
 * l = start offset (negative = already mid-flicker on load), v = sway variant, o = peak opacity,
 * tip = where the point sits horizontally (% of the tongue) so no two look identical,
 * mobile = keep on small screens (the rest are hidden to stay calm and light).
 */
const PLUMES = [
  { x: 6, w: 22, h: 60, d: 3.4, l: -0.6, v: "b", o: 0.55, tip: 46, mobile: false },
  { x: 19, w: 26, h: 76, d: 4.1, l: -2.1, v: "a", o: 0.72, tip: 56, mobile: true },
  { x: 33, w: 28, h: 88, d: 3.7, l: -1.4, v: "b", o: 0.85, tip: 44, mobile: false },
  { x: 50, w: 34, h: 96, d: 4.6, l: -3.2, v: "a", o: 1, tip: 52, mobile: true },
  { x: 67, w: 28, h: 90, d: 3.9, l: -0.9, v: "b", o: 0.85, tip: 57, mobile: false },
  { x: 81, w: 26, h: 74, d: 4.3, l: -2.7, v: "a", o: 0.72, tip: 45, mobile: true },
  { x: 94, w: 22, h: 58, d: 3.5, l: -1.8, v: "b", o: 0.55, tip: 54, mobile: false },
] as const;

/** x = start (% of width), dx = sideways drift (px), s = size (px), d/l = loop/offset seconds. */
const EMBERS = [
  { x: 14, dx: -30, s: 4, d: 4.2, l: -0.4 },
  { x: 27, dx: 22, s: 3, d: 5.1, l: -2.3 },
  { x: 41, dx: -18, s: 5, d: 4.7, l: -3.6 },
  { x: 52, dx: 34, s: 3, d: 3.9, l: -1.1 },
  { x: 61, dx: -26, s: 4, d: 5.4, l: -4.4 },
  { x: 73, dx: 20, s: 3, d: 4.4, l: -2.9 },
  { x: 86, dx: -22, s: 5, d: 5, l: -0.9 },
  { x: 47, dx: 10, s: 3, d: 6, l: -5 },
] as const;

/**
 * Smooth flame silhouette as a clip-path polygon: wide at the base, tapering to a leaning tip with a
 * gentle S-curve. `tip` (44-57) sets the lean and `phase` varies the wobble so no two look alike.
 * The fill fades to transparent before the edge, so the clip never shows as a hard line.
 */
function flamePath(tip: number, phase: number) {
  const lean = ((tip - 50) / 50) * 0.16;
  const steps = 22;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const half = 0.49 * Math.pow(1 - t, 0.85) * (1 + 0.16 * Math.sin(t * Math.PI * 2.4 + phase));
    const centre = 0.5 + lean * t * t + 0.03 * Math.sin(t * Math.PI * 1.6 + phase);
    const y = ((1 - t) * 100).toFixed(1);
    left.push(`${((centre - half) * 100).toFixed(1)}% ${y}%`);
    right.unshift(`${((centre + half) * 100).toFixed(1)}% ${y}%`);
  }
  return `polygon(${[...left, ...right].join(", ")})`;
}

const FLAME_FILL =
  "radial-gradient(ellipse 50% 66% at 50% 88%, rgb(var(--pale-rgb) / 0.8) 0%, rgb(var(--glow-rgb) / 0.82) 15%, rgb(var(--from-rgb) / 0.66) 36%, rgb(var(--to-rgb) / 0.4) 58%, rgb(var(--to-rgb) / 0.12) 82%, transparent 100%)";

/**
 * Decorative, infinitely moving fire for the bottom of a banner. Place it as the first child of a
 * `relative overflow-hidden` container. Pure CSS (no JS loop), themed, aria-hidden, and paused
 * while off-screen or when the user prefers reduced motion (then a static glow remains).
 */
export function FlameBackground() {
  return (
    // container-type makes `1cqw` = 1% of the banner width, used to lean flames towards the cursor
    <FlameField aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [container-type:inline-size]">
      {/* steady heat haze under everything */}
      <div
        className="flame-glow absolute inset-x-0 bottom-0 h-full"
        style={{
          background:
            "radial-gradient(70% 70% at 50% 118%, rgb(var(--to-rgb) / 0.75), transparent 70%), radial-gradient(42% 46% at 50% 104%, rgb(var(--glow-rgb) / 0.5), transparent 72%)",
        }}
      />

      {PLUMES.map((p, i) => (
        <div
          key={i}
          className={`flame-plume absolute bottom-[-9%] ${p.mobile ? "" : "max-md:hidden"}`}
          style={
            {
              left: `${p.x}%`,
              marginLeft: `calc(${p.w} * var(--ws, 1) * -0.5%)`,
              "--px": p.x,
              "--w": p.w,
              "--h": p.h,
              "--fd": `${p.d}s`,
              "--fl": `${p.l}s`,
              "--fa": p.v === "a" ? "flame-a" : "flame-b",
              "--op": p.o,
              clipPath: flamePath(p.tip, i * 1.7),
              background: FLAME_FILL,
            } as CSSProperties
          }
        />
      ))}

      {/* a flame that rises under the mouse pointer while hovering the banner */}
      <div
        className="flame-cursor absolute bottom-[-9%] max-md:hidden"
        style={
          {
            "--fd": "3.2s",
            clipPath: flamePath(50, 0.6),
            background: FLAME_FILL,
          } as CSSProperties
        }
      />

      {EMBERS.map((e, i) => (
        <span
          key={i}
          className={`ember absolute bottom-[6%] rounded-full ${i > 4 ? "max-md:hidden" : ""}`}
          style={
            {
              left: `${e.x}%`,
              width: e.s,
              height: e.s,
              "--ex": `${e.dx}px`,
              "--ed": `${e.d}s`,
              "--el": `${e.l}s`,
              background: "rgb(var(--pale-rgb))",
              boxShadow: "0 0 8px 2px rgb(var(--from-rgb) / 0.85)",
            } as CSSProperties
          }
        />
      ))}

      {/* keeps the headline legible over the brightest flames */}
      <div className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-black/60 via-black/25 to-transparent" />
    </FlameField>
  );
}
