import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { LOGO_GLYPH_PATH } from "./logo-glyph";

const SYMBOL_ID = "olzytech-logo";

/**
 * Defines the logo once per page (rendered in the root layout). Every <LogoMark /> then references
 * it with <use>, so the 8KB path is not repeated in the header, footer and mobile menu.
 * The brand tile keeps its own orange to crimson gradient in every locale theme.
 */
export function LogoSprite() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="pointer-events-none absolute size-0 overflow-hidden">
      <defs>
        <linearGradient id={`${SYMBOL_ID}-gradient`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FA6E20" />
          <stop offset="1" stopColor="#A62D44" />
        </linearGradient>
        <symbol id={SYMBOL_ID} viewBox="0 0 200 200">
          <rect width="200" height="200" rx="19" fill={`url(#${SYMBOL_ID}-gradient)`} />
          <path fill="#fff" fillRule="evenodd" d={LOGO_GLYPH_PATH} />
        </symbol>
      </defs>
    </svg>
  );
}

/** The Olzytech mark: an interlaced hexagon knot on a gradient tile. Requires <LogoSprite /> on the page. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <use href={`#${SYMBOL_ID}`} />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>{siteConfig.name}</span>
    </span>
  );
}
