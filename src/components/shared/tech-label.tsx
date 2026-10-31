import { Cloud, Hexagon } from "lucide-react";
import { GENERIC_ICONS, techIconPaths } from "@/content/tech";
import { cn } from "@/lib/utils";

type TechLabelProps = {
  /** Technology name, e.g. "Next.js". Brand names are the same in every language. */
  name: string;
  /** Items without a brand icon (e.g. "CI/CD") get a generic filled hexagon so a list stays aligned. */
  fallbackIcon?: boolean;
  className?: string;
};

/** A technology name with its filled icon in front. The icon is decorative (the name carries the meaning). */
export function TechLabel({ name, fallbackIcon = false, className }: TechLabelProps) {
  const path = techIconPaths[name];
  const generic = GENERIC_ICONS[name];

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {path ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.15em] shrink-0 fill-current">
          <path d={path} />
        </svg>
      ) : generic === "cloud" ? (
        <Cloud aria-hidden="true" className="size-[1.15em] shrink-0 fill-current" strokeWidth={1.5} />
      ) : fallbackIcon ? (
        <Hexagon aria-hidden="true" className="size-[1.05em] shrink-0 fill-current" strokeWidth={1.5} />
      ) : null}
      {name}
    </span>
  );
}
