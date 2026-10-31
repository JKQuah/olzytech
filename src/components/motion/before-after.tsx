"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { MoveHorizontal } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Shot = { src: string; alt: string };

type BeforeAfterProps = {
  before: Shot;
  after: Shot;
  labels: { before: string; after: string; hint: string; slider: string };
  /** Intrinsic size of both images (they must share an aspect ratio). */
  width: number;
  height: number;
  className?: string;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Draggable before/after comparison. The "before" image is revealed from the left up to the handle.
 *
 * Accessibility: a real full-size <input type="range"> sits on top (invisible), so mouse, touch and
 * keyboard (arrow keys, Home/End) all work natively and are announced by screen readers.
 * Once scrolled into view it plays a short demo sweep to hint that it is interactive; any user
 * input cancels it. The position is written to a CSS variable, so dragging never re-renders React.
 */
export function BeforeAfter({ before, after, labels, width, height, className }: BeforeAfterProps) {
  const frame = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const interacted = useRef(false);
  const reduced = usePrefersReducedMotion();
  const [viewRef, inView] = useInView<HTMLDivElement>({ threshold: 0.55 });

  const setPos = (value: number) => {
    frame.current?.style.setProperty("--pos", `${value}%`);
    if (input.current) {
      input.current.value = String(Math.round(value));
      input.current.setAttribute("aria-valuetext", `${labels.before} ${Math.round(value)}%, ${labels.after} ${Math.round(100 - value)}%`);
    }
  };

  // Demo sweep 50 -> 18 -> 82 -> 50 the first time the comparison is in view.
  useEffect(() => {
    if (!inView || reduced || interacted.current) return;
    let raf = 0;
    const duration = 3200;
    const keys = [50, 18, 82, 50];
    const start = performance.now();
    const tick = (now: number) => {
      if (interacted.current) return;
      const t = Math.min(1, (now - start) / duration);
      const seg = Math.min(keys.length - 2, Math.floor(t * (keys.length - 1)));
      const local = t * (keys.length - 1) - seg;
      setPos(keys[seg] + (keys[seg + 1] - keys[seg]) * easeInOut(local));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // setPos only touches refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced]);

  return (
    <div ref={viewRef} className={className}>
      <div
        ref={frame}
        style={{ "--pos": "50%", aspectRatio: `${width} / ${height}` } as React.CSSProperties}
        className="glass group relative w-full overflow-hidden rounded-3xl p-0 select-none focus-within:ring-2 focus-within:ring-brand-mid/70"
      >
        {/* "after" is the base layer */}
        <Image src={after.src} alt={after.alt} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover object-top" draggable={false} />

        {/* "before" sits on top and is clipped to the area left of the handle */}
        <div className="absolute inset-0" style={{ clipPath: "inset(0 calc(100% - var(--pos)) 0 0)" }}>
          <Image src={before.src} alt={before.alt} fill sizes="(min-width: 1024px) 960px, 100vw" className="object-cover object-top" draggable={false} />
        </div>

        {/* labels */}
        <span className="absolute top-4 left-4 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
          {labels.before}
        </span>
        <span className="bg-brand absolute top-4 right-4 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
          {labels.after}
        </span>

        {/* divider + grip */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_20px_2px_rgb(var(--to-rgb)/0.7)]" style={{ left: "var(--pos)" }}>
          <span className="bg-brand absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-white shadow-[0_8px_30px_rgb(0_0_0/0.45)] transition-transform group-active:scale-90">
            <MoveHorizontal className="size-5" />
          </span>
        </div>

        {/* hint */}
        <span className={cn("pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-xs text-white/90")}>
          {labels.hint}
        </span>

        <input
          ref={input}
          type="range"
          min={0}
          max={100}
          step={1}
          defaultValue={50}
          aria-label={labels.slider}
          onPointerDown={() => (interacted.current = true)}
          onKeyDown={() => (interacted.current = true)}
          onInput={(e) => {
            interacted.current = true;
            setPos(Number(e.currentTarget.value));
          }}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0 [touch-action:pan-y]"
        />
      </div>
    </div>
  );
}
