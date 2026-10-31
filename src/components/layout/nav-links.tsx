"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizedPath, type RoutePath } from "@/config/routes";
import type { Locale } from "@/i18n/config";
import { stripLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type NavItem = { href: RoutePath; label: string };

type NavLinksProps = {
  locale: Locale;
  items: NavItem[];
  className?: string;
  linkClassName?: string;
  /** Called on click, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
};

export function NavLinks({ locale, items, className, linkClassName, onNavigate }: NavLinksProps) {
  // The default locale is unprefixed but rewritten internally, so compare locale-less paths.
  const current = stripLocale(usePathname());

  return (
    <ul className={className}>
      {items.map(({ href, label }) => {
        const target = localizedPath(locale, href);
        const active = current === href;
        return (
          <li key={href}>
            <Link
              href={target}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "text-muted-foreground transition-colors hover:text-white focus-visible:text-white",
                active && "text-white",
                linkClassName,
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
