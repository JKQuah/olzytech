"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type AnimatedBarProps = {
  /** 0-100 */
  value: number;
  /** Stagger in ms. */
  delay?: number;
  className?: string;
  trackClassName?: string;
};

/** Progress bar that fills from 0 when scrolled into view. Animates transform (no layout). */
export function AnimatedBar({ value, delay = 0, className, trackClassName }: AnimatedBarProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.5 });
  return (
    <div ref={ref} className={cn("h-1.5 overflow-hidden rounded-full bg-white/15", trackClassName)}>
      <div
        className={cn("bg-brand h-full w-full origin-left rounded-full transition-transform duration-[1600ms] ease-out", className)}
        style={{ transform: `scaleX(${inView ? value / 100 : 0})`, transitionDelay: `${delay}ms` }}
      />
    </div>
  );
}
