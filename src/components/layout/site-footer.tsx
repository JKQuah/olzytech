import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { WhatsappIcon } from "@/components/shared/social-icons";
// import { GithubIcon, InstagramIcon, LinkedinIcon } from "@/components/shared/social-icons";
import { localizedPath, navRoutes, routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { legalDocuments } from "@/content/legal";
import { defaultLocale } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getCurrentYear } from "@/lib/year";

// const socials = [
//   { label: "GitHub", href: siteConfig.socials.github, Icon: GithubIcon },
//   { label: "LinkedIn", href: siteConfig.socials.linkedin, Icon: LinkedinIcon },
//   { label: "Instagram", href: siteConfig.socials.instagram, Icon: InstagramIcon },
// ];

export async function SiteFooter({
  locale,
  dict,
  nav,
}: {
  locale: Locale;
  dict: Dictionary["footer"];
  nav: Dictionary["common"]["nav"];
}) {
  const year = await getCurrentYear();
  return (
    <footer className="relative border-t border-white/10 bg-black">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Link href={localizedPath(locale)} aria-label="Olzytech">
            <Logo />
          </Link>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {dict.tagline}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">{dict.explore}</h2>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            {navRoutes.map((key) => (
              <li key={key}>
                <Link
                  href={localizedPath(locale, routes[key])}
                  className="transition-colors hover:text-white"
                >
                  {nav[key]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">{dict.services}</h2>
          <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
            {dict.serviceLinks.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">{dict.connect}</h2>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-muted-foreground mt-4 inline-flex items-center gap-2 text-sm transition-colors hover:text-white"
          >
            <Mail className="size-4" />
            {siteConfig.email}
          </a>
          <a
            // Opens the chat with a ready-made greeting in the visitor's language.
            href={`${siteConfig.whatsapp}?text=${encodeURIComponent(dict.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground mt-3 flex w-fit items-center gap-2 text-sm transition-colors hover:text-white"
          >
            <WhatsappIcon className="size-4" />
            {siteConfig.phone}
            <span className="sr-only"> (WhatsApp)</span>
          </a>
          {/* <ul className="mt-5 flex gap-3">
            {socials.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground grid size-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul> */}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page text-muted-foreground flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>
            © 2023 - {year} {siteConfig.legalName}. {dict.rights}
          </p>
          <nav aria-label="Legal" className="flex items-center gap-5">
            {/* English-only pages: always link to the single unprefixed URL */}
            {legalDocuments.map((doc) => (
              <Link
                key={doc.slug}
                href={localizedPath(defaultLocale, doc.path)}
                hrefLang="en"
                lang="en"
                // English-only pages live under another language root: prefetching them from /ms fails (404), so skip it.
                prefetch={false}
                className="transition-colors hover:text-white"
              >
                {doc.title}
              </Link>
            ))}
            <p className="hidden sm:block">{dict.madeIn}</p>
          </nav>
        </div>
      </div>
    </footer>
  );
}
