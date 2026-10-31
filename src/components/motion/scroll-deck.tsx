"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { clamp, useScrollFrame } from "@/hooks/use-scroll-frame";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/** Server renders the "stacked" state; the layout effect below replaces it with the real value before paint. */
const INITIAL_STYLE = { "--d": 0 } as CSSProperties;

/** How far down the viewport the deck starts opening, and how much scroll it takes to fully open. */
const START = 0.92;
const SPAN = 0.62;

type ScrollDeckProps = { children: ReactNode; className?: string };

/**
 * Drives `--d` (0 = cards stacked behind, 1 = fully spread) on its root from scroll position.
 * Children opt in with the `fly` utility (globals.css) and set their own `--s` delay, `--tx`/`--ty`
 * offsets and `--tz` depth.
 *
 * The scroll value is eased (exponential smoothing in its own rAF loop) so the cards glide even when
 * the wheel jumps. Only transform/opacity are affected, so it stays on the compositor.
 */
export function ScrollDeck({ children, className }: ScrollDeckProps) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const current = useRef(0);
  const raf = useRef(0);
  const lastTime = useRef(0);
  const reduced = usePrefersReducedMotion();

  const progress = () => {
    const el = ref.current;
    if (!el) return 0;
    const vh = window.innerHeight;
    return clamp((vh * START - el.getBoundingClientRect().top) / (vh * SPAN));
  };

  const apply = (value: number) => ref.current?.style.setProperty("--d", value.toFixed(4));

  // Start from the true scroll position before the first paint (also covers reloads mid-page).
  useLayoutEffect(() => {
    const start = reduced ? 1 : progress();
    target.current = current.current = start;
    apply(start);
  }, [reduced]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - lastTime.current) / 1000);
    lastTime.current = now;
    const k = 1 - Math.exp(-dt * 6.5); // ~0.15s time constant, frame-rate independent
    current.current += (target.current - current.current) * k;
    const done = Math.abs(target.current - current.current) < 0.0004;
    if (done) current.current = target.current;
    apply(current.current);
    if (done) {
      raf.current = 0;
      if (ref.current) ref.current.dataset.flying = "false";
    } else {
      raf.current = requestAnimationFrame(tick);
    }
  };

  useScrollFrame(
    progress,
    (value) => {
      target.current = value;
      if (!raf.current && Math.abs(value - current.current) > 0.0004) {
        lastTime.current = performance.now();
        if (ref.current) ref.current.dataset.flying = "true";
        raf.current = requestAnimationFrame(tick);
      }
    },
    !reduced,
  );

  return (
    <div ref={ref} aria-hidden="true" data-flying="false" style={INITIAL_STYLE} className={`deck ${className ?? ""}`}>
      {children}
      {/* Without JS nothing would ever open the deck: show the final layout. */}
      <noscript>
        <style>{".deck{--d:1 !important}"}</style>
      </noscript>
    </div>
  );
}
