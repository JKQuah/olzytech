"use client";

import { useRef, type ReactNode } from "react";
import { clamp, useScrollFrame } from "@/hooks/use-scroll-frame";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

type ParallaxProps = {
  children: ReactNode;
  /** px moved per px scrolled: 0.2 lags behind the page, negative moves ahead of it. */
  speed?: number;
  /** Fade out over the first ~70% of a viewport of scrolling. */
  fade?: boolean;
  className?: string;
};

/** Scroll-linked translate (and optional fade) for hero layers. Transform/opacity only: no layout. */
export function Parallax({ children, speed = 0.2, fade = false, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const lastY = useRef(-1);

  useScrollFrame(
    () => {
      const y = window.scrollY;
      // Past the hero there is nothing to move; skip, and skip repeated identical frames.
      if (y > window.innerHeight * 1.4 && lastY.current > window.innerHeight * 1.4) return null;
      if (y === lastY.current) return null;
      lastY.current = y;
      return { y, vh: window.innerHeight };
    },
    ({ y, vh }) => {
      const el = ref.current;
      if (!el) return;
      el.style.transform = `translate3d(0, ${(Math.min(y, vh * 1.4) * speed).toFixed(1)}px, 0)`;
      if (fade) el.style.opacity = String(clamp(1 - y / (vh * 0.7)));
    },
    !reduced,
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
