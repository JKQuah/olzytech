"use client";

import { Fragment, useMemo, useRef } from "react";
import { clamp, useScrollFrame } from "@/hooks/use-scroll-frame";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Token = { text: string; brand: boolean; /** Add a trailing space (never inside Chinese/Japanese text). */ space: boolean };

/** Han characters and CJK punctuation: these scripts have no spaces, so each character is a "word". */
const CJK = /([\u2e80-\u9fff\uff00-\uffef])/;

/** Splits into words; text wrapped in **double asterisks** is rendered with the brand gradient. */
function tokenize(text: string): Token[] {
  return text
    .split("**")
    .flatMap((segment, i) =>
      segment
        .split(/\s+/)
        .filter(Boolean)
        .flatMap((word) => {
          // "Cashflow让" -> ["Cashflow", "让"]; plain Latin words stay whole.
          const parts = word.split(CJK).filter(Boolean);
          return parts.map((text, k) => ({ text, brand: i % 2 === 1, space: k === parts.length - 1 && !CJK.test(text) }));
        }),
    );
}

type ScrollHighlightProps = {
  /** One string, or several paragraphs that are highlighted as a single continuous block. */
  text: string | string[];
  /** Applied to the wrapper: put typography, colour and paragraph spacing (`space-y-*`) here. */
  className?: string;
};

/**
 * Words light up one after another as the text scrolls through the viewport.
 * All paragraphs share ONE progress value measured on the whole block, and the words are
 * numbered across paragraph boundaries, so the second paragraph only starts once the first is lit.
 * All text is in the HTML from the start (SEO); it is only dimmed visually until revealed.
 * Only changed words are written, in 5% opacity steps.
 */
export function ScrollHighlight({ text, className }: ScrollHighlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLElement[]>([]);
  const shown = useRef<number[]>([]);
  const reduced = usePrefersReducedMotion();
  const paragraphs = useMemo(() => (Array.isArray(text) ? text : [text]).map(tokenize), [text]);

  useScrollFrame(
    () => {
      const el = ref.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) return null; // far off-screen
      // 0 when the top of the block reaches 80% of the viewport, 1 when its bottom reaches ~45%.
      return clamp((vh * 0.8 - rect.top) / (rect.height + vh * 0.35));
    },
    (p) => {
      const el = ref.current;
      if (!el) return;
      if (words.current.length === 0) words.current = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
      const n = words.current.length;
      words.current.forEach((w, i) => {
        const local = reduced ? 1 : clamp(p * n * 1.05 - i);
        const opacity = Math.round((0.14 + 0.86 * local) * 20) / 20;
        if (shown.current[i] !== opacity) {
          shown.current[i] = opacity;
          w.style.opacity = String(opacity);
        }
      });
    },
  );

  return (
    <div ref={ref} className={className}>
      {paragraphs.map((tokens, p) => (
        <p key={p}>
          {tokens.map((t, i) => (
            <Fragment key={i}>
              <span data-w className={cn(t.brand && "text-brand font-semibold")}>
                {t.text}
              </span>
              {t.space ? " " : null}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
