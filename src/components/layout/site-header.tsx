import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { localizedPath, navRoutes, routes } from "@/config/routes";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { HeaderShell } from "./header-shell";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary["common"] }) {
  const items = navRoutes.map((key) => ({ href: routes[key], label: dict.nav[key] }));

  return (
    <HeaderShell>
      <div className="container-page flex h-20 items-center justify-between gap-4 transition-[height] duration-500 group-data-[scrolled=true]/header:h-16">
        <Link href={localizedPath(locale)} aria-label={`Olzytech, ${dict.nav.home}`} className="rounded-full">
          <Logo />
        </Link>

        <nav
          aria-label={dict.primaryNavigation}
          className="glass glass-blur absolute left-1/2 hidden -translate-x-1/2 rounded-full px-2 py-1.5 md:block"
        >
          <NavLinks
            locale={locale}
            items={items}
            className="flex items-center"
            linkClassName="block rounded-full px-4 py-2 text-sm hover:bg-white/5 aria-[current=page]:bg-white/10"
          />
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher locale={locale} label={dict.language} />
          </div>
          <Button asChild variant="dark" size="pill" className="hidden md:inline-flex">
            <Link href={localizedPath(locale, "/contact")}>{dict.startProject}</Link>
          </Button>
          <MobileNav
            locale={locale}
            items={items}
            labels={{
              open: dict.openMenu,
              close: dict.closeMenu,
              language: dict.language,
              cta: dict.startProject,
              nav: dict.primaryNavigation,
            }}
          />
        </div>
      </div>
    </HeaderShell>
  );
}
