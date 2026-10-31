"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Parsed = { prefix: string; target: number; decimals: number; grouped: boolean; suffix: string };

/** "99.98%" -> { target: 99.98, decimals: 2, suffix: "%" }, "3,500" -> grouped 3500, "95+" -> 95 + "+". */
function parse(text: string): Parsed | null {
  const m = text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  return { prefix, target: Number.parseFloat(num.replace(/,/g, "")), decimals, grouped: num.includes(","), suffix };
}

function format(p: Parsed, n: number) {
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
    useGrouping: p.grouped,
  });
  return `${p.prefix}${body}${p.suffix}`;
}

const easeOutExpo = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

type CountUpProps = {
  /** Display string with the final value, e.g. "99.98%". Non-numeric strings render as-is. */
  value: string;
  duration?: number;
  className?: string;
};

/**
 * Counts from 0 to the number inside `value` when it scrolls into view.
 * Server HTML and no-JS/reduced-motion users get the final value; screen readers always read it.
 */
export function CountUp({ value, duration = 1800, className }: CountUpProps) {
  const parsed = useMemo(() => parse(value), [value]);
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const [text, setText] = useState(value);
  const animate = parsed !== null && !reduced;

  // Reset to zero before first paint so the final value never flashes.
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional pre-paint reset
    if (animate) setText(format(parsed, 0));
  }, [animate, parsed]);

  useEffect(() => {
    if (!animate || !inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration)); // rAF time can precede `start` on the first frame
      setText(format(parsed, parsed.target * easeOutExpo(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, inView, parsed, duration]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
