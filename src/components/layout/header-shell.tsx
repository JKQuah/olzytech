"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fixed header wrapper. Adds a frosted backdrop once the page scrolls, slims down,
 * hides while scrolling down and returns on scroll up (or when anything inside has focus).
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      const dy = y - last.current;
      if (Math.abs(dy) > 6) {
        setHidden(dy > 0 && y > 240);
        last.current = y;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      data-hidden={hidden}
      className="group/header fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] focus-within:translate-y-0 data-[hidden=true]:-translate-y-full"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-white/10 bg-black/70 opacity-0 backdrop-blur-md transition-opacity duration-500 group-data-[scrolled=true]/header:opacity-100"
      />
      {children}
    </header>
  );
}
