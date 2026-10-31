"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger in ms. */
  delay?: number;
  as?: ElementType;
  /** "up" fades + lifts; "scale" also grows slightly (good for cards). */
  variant?: "up" | "scale";
};

/**
 * Fades + lifts content in once it scrolls into view.
 * Content is visible by default (SSR / no-JS / reduced motion) and only hidden after hydration
 * if the element starts below the fold, so it never harms SEO or LCP.
 */
export function Reveal({ children, className, delay = 0, as: Tag = "div", variant = "up" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"visible" | "hidden" | "shown">("visible");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: state === "shown" ? `${delay}ms` : undefined }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        state === "hidden" && (variant === "scale" ? "reveal-scale-hidden" : "reveal-hidden"),
        className,
      )}
    >
      {children}
    </Tag>
  );
}
