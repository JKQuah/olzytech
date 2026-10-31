"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Check, ChevronDown, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { transitionLocale } from "./theme-transition";
import { switchLocalePath } from "@/i18n/routing";

/** Dropdown language picker. Adding a locale in `i18n/config.ts` adds it here automatically. */
export function LanguageSwitcher({
  locale,
  label,
  onSwitch,
}: {
  locale: Locale;
  label: string;
  /** Called right before navigating, e.g. to close the mobile sheet. */
  onSwitch?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="pill"
          className="h-10 gap-1.5 border-brand-mid/40 px-3 text-white/80 hover:border-brand-mid/80 hover:text-white focus-visible:border-brand-mid focus-visible:ring-1 focus-visible:ring-brand-mid/60 aria-expanded:border-brand-mid aria-expanded:text-white"
          aria-label={label}
        >
          <Languages className="size-4" />
          <span>{localeMeta[locale].short}</span>
          <ChevronDown className="size-3 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // The header is 64-80px tall: open clear below it so the menu never covers the nav bar.
        sideOffset={16}
        collisionPadding={16}
        className="min-w-44 overflow-hidden rounded-2xl! border border-brand-mid/50 bg-popover p-2.5 shadow-[0_24px_60px_-18px_rgb(var(--to-rgb)/0.5)] ring-0 data-[state=closed]:hidden!"
      >
        {locales.map((code) => (
          <DropdownMenuItem key={code} asChild className="rounded-xl">
            <Link
              href={switchLocalePath(pathname, code)}
              hrefLang={localeMeta[code].htmlLang}
              // The other language is a different root layout: prefetching it is wasted (and can 404).
              prefetch={false}
              onClick={(e) => {
                if (
                  code === locale ||
                  e.button !== 0 ||
                  e.metaKey ||
                  e.ctrlKey ||
                  e.shiftKey ||
                  e.altKey
                )
                  return;
                e.preventDefault();
                // Keyboard activation reports 0,0: fall back to the item's centre.
                const r = e.currentTarget.getBoundingClientRect();
                const x = e.clientX || r.left + r.width / 2;
                const y = e.clientY || r.top + r.height / 2;
                // Hide the menu before the "old" snapshot is captured.
                flushSync(() => setOpen(false));
                onSwitch?.();
                transitionLocale({
                  x,
                  y,
                  navigate: () => router.push(switchLocalePath(pathname, code)),
                });
              }}
              className="flex items-center justify-between gap-3"
            >
              {localeMeta[code].nativeName}
              {code === locale && <Check className="size-4 text-brand-from" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
