"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));

/**
 * Wrapper for the CTA flames. It does two things:
 *  1. Pauses every CSS animation inside it (`data-paused`) while scrolled out of view.
 *  2. Makes the fire react to the mouse over its PARENT (the whole banner): it writes two eased
 *     CSS variables on itself, `--cx` (cursor x, 0-100 % of the banner) and `--hv` (hover amount,
 *     0-1), and the flames grow, lean towards the cursor and a flame follows it (see globals.css).
 *
 * The variables are smoothed in a small rAF loop that stops as soon as they settle. Mouse only,
 * and skipped for reduced motion. Without JS the flames simply play their normal loop.
 */
export function FlameField(props: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const root = ref.current;
    const host = root?.parentElement;
    if (!root || !host) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 50;
    let x = 50;
    let targetHover = 0;
    let hover = 0;
    let raf = 0;
    let last = 0;

    const apply = () => {
      root.style.setProperty("--cx", x.toFixed(2));
      root.style.setProperty("--hv", hover.toFixed(3));
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += (targetX - x) * (1 - Math.exp(-dt * 9)); // follows the cursor with a short lag
      hover += (targetHover - hover) * (1 - Math.exp(-dt * 5)); // swells and fades more slowly
      const settled = Math.abs(targetX - x) < 0.05 && Math.abs(targetHover - hover) < 0.002;
      if (settled) {
        x = targetX;
        hover = targetHover;
      }
      apply();
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = host.getBoundingClientRect();
      targetX = clamp(((e.clientX - r.left) / r.width) * 100);
      targetHover = 1;
      start();
    };
    const leave = () => {
      targetHover = 0;
      start();
    };

    host.addEventListener("pointerenter", move);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    return () => {
      host.removeEventListener("pointerenter", move);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} data-paused={paused} {...props} />;
}
