"use client";

import { useRef } from "react";
import { clamp, useScrollFrame } from "@/hooks/use-scroll-frame";

/**
 * Renders nothing. Writes the parent's scroll progress to `--p` (0..1) and flips `data-active`
 * on each of the parent's `<li>` children as the progress passes them. Style with CSS only,
 * e.g. `transform: scaleX(var(--p))` or `group-data-[active=true]:...`.
 */
export function ScrollProgressTracker() {
  const marker = useRef<HTMLSpanElement>(null);
  const last = useRef(-1);

  useScrollFrame(
    () => {
      const parent = marker.current?.parentElement;
      if (!parent) return null;
      const rect = parent.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) return null;
      const p = Math.round(clamp((vh * 0.8 - rect.top) / (rect.height + vh * 0.45)) * 500) / 500;
      if (p === last.current) return null;
      last.current = p;
      return { parent, p };
    },
    ({ parent, p }) => {
      parent.style.setProperty("--p", String(p));
      const items = parent.querySelectorAll<HTMLElement>(":scope > li");
      items.forEach((li, i) => {
        const active = String(p >= (i + 0.35) / items.length);
        if (li.dataset.active !== active) li.dataset.active = active;
      });
    },
  );

  return <span ref={marker} hidden />;
}
