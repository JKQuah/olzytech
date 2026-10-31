"use client";

import { useEffect, useRef, useState } from "react";

type Options = { threshold?: number; rootMargin?: string; once?: boolean };

/** Tracks whether an element is in the viewport. `once` (default) latches after the first hit. */
export function useInView<T extends Element>({ threshold = 0.3, rootMargin = "0px", once = true }: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView] as const;
}
