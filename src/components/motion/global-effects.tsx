"use client";

import { useEffect } from "react";
import { ScrollProgress } from "./scroll-progress";

/**
 * Mounted once in the root layout:
 *  - scroll progress bar
 *  - cursor-following spotlight: sets --mx/--my on whichever `.spotlight` element is hovered
 */
export function GlobalEffects() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(".spotlight");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return <ScrollProgress />;
}
