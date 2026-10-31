"use client";

import { useRef } from "react";
import { clamp, useScrollFrame } from "@/hooks/use-scroll-frame";

/** Thin brand-gradient bar at the top of the viewport showing page scroll progress. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useScrollFrame(
    () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? clamp(window.scrollY / max) : 0;
    },
    (progress) => {
      if (ref.current) ref.current.style.transform = `scaleX(${progress.toFixed(4)})`;
    },
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        ref={ref}
        className="bg-brand h-full origin-left shadow-[0_0_14px_2px_rgb(var(--to-rgb)/0.7)]"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
