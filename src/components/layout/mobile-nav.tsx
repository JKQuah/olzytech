"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { localizedPath } from "@/config/routes";
import type { Locale } from "@/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { NavLinks, type NavItem } from "./nav-links";

type MobileNavProps = {
  locale: Locale;
  items: NavItem[];
  labels: { open: string; close: string; language: string; cta: string; nav: string };
};

export function MobileNav({ locale, items, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="glass" size="icon-lg" className="rounded-full md:hidden" aria-label={labels.open}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(88vw,24rem)] border-white/10 bg-black/95 p-6">
        <SheetTitle className="sr-only">{labels.nav}</SheetTitle>
        <SheetDescription className="sr-only">{labels.nav}</SheetDescription>
        <Logo />
        <nav aria-label={labels.nav} className="mt-10">
          <NavLinks
            locale={locale}
            items={items}
            onNavigate={() => setOpen(false)}
            className="flex flex-col gap-1"
            linkClassName="block rounded-xl px-3 py-3 text-2xl font-medium tracking-tight hover:bg-white/5"
          />
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <LanguageSwitcher locale={locale} label={labels.language} onSwitch={() => setOpen(false)} />
          <Button asChild variant="brand" size="pill-lg" className="justify-center pr-7">
            <Link href={localizedPath(locale, "/contact")} onClick={() => setOpen(false)}>
              {labels.cta}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
