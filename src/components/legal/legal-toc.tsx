"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TocItem = { id: string; title: string };

/**
 * "On this page" navigation with scroll-spy. A sticky sidebar on desktop and a collapsible
 * panel on mobile. Links are plain anchors, so it works without JavaScript too.
 */
export function LegalToc({ items, label }: { items: TocItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const targets = items.map((i) => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el);
    // The section crossing the upper part of the viewport is "current".
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [items]);

  const list = (
    <ol className="space-y-1">
      {items.map((item, i) => (
        <li key={item.id}>
          <a
            href={`#${item.id}`}
            aria-current={active === item.id ? "location" : undefined}
            className={cn(
              "flex gap-3 rounded-lg px-3 py-1.5 text-sm text-white/55 transition-colors hover:text-white",
              active === item.id && "bg-white/[0.07] text-white",
            )}
          >
            <span className={cn("w-5 shrink-0 tabular-nums", active === item.id ? "text-brand-from" : "text-white/30")}>{i + 1}</span>
            <span>{item.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <nav aria-label={label}>
      {/* mobile */}
      <details className="glass group rounded-2xl lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
          {label}
          <ChevronDown className="size-4 text-white/60 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-2 pb-3">{list}</div>
      </details>

      {/* desktop */}
      <div className="hidden lg:block">
        <p className="text-brand mb-3 px-3 text-xs font-semibold tracking-[0.2em] uppercase">{label}</p>
        {list}
      </div>
    </nav>
  );
}
