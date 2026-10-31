import Image from "next/image";
import { ArrowUpRight, CalendarCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { projectImageSize } from "@/content/projects";
import { cn } from "@/lib/utils";

export type ProjectCardData = {
  slug: string;
  name: string;
  summary: string;
  result: string;
  tags: string[];
  /** Live website. Missing while the project is still coming soon. */
  url?: string;
  /** Screenshot of the live homepage. Missing while the project is still coming soon. */
  image?: string;
  /** Not launched yet: shows a "coming soon" cover and does not link anywhere. */
  comingSoon?: boolean;
  /** Completion month, e.g. "2026-06" (for <time>) and its localised label, e.g. "Jun 2026". Both optional. */
  completedISO?: string;
  completedLabel?: string;
};

type ProjectCardProps = {
  project: ProjectCardData;
  categoryLabel: string;
  labels: { result: string; visit: string; newTab: string; completed: string; comingSoon: string };
  className?: string;
};

/** Cover for a project that has not launched: brand-coloured ripples spreading from the project name. */
function ComingSoonCover({ name, label }: { name: string; label: string }) {
  return (
    <div
      className="relative grid size-full place-items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(75% 95% at 50% 125%, rgb(var(--to-rgb) / 0.6), transparent 70%), radial-gradient(45% 55% at 50% 48%, rgb(var(--from-rgb) / 0.22), transparent 72%), #07070b",
      }}
    >
      {[34, 54, 76, 100].map((size, i) => (
        <span
          key={size}
          aria-hidden="true"
          className="absolute aspect-square rounded-full border border-white/10"
          style={{ width: `${size}%`, borderColor: `rgb(var(--glow-rgb) / ${0.34 - i * 0.07})` }}
        />
      ))}
      {[0, 1.4].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="border-brand-mid/60 absolute aspect-square w-[34%] rounded-full border motion-safe:animate-ping"
          style={{ animationDelay: `${delay}s`, animationDuration: "4s" }}
        />
      ))}
      <span className="text-fade-brand relative text-3xl font-semibold tracking-tight md:text-4xl">{name}</span>
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
        <span aria-hidden="true" className="bg-brand-from size-1.5 rounded-full motion-safe:animate-pulse" />
        {label}
      </span>
    </div>
  );
}

/**
 * A real project: homepage screenshot, summary, highlights and a link to the live site.
 * The whole card is clickable through a stretched link on the title (one tab stop, no nested links).
 */
export function ProjectCard({ project, categoryLabel, labels, className }: ProjectCardProps) {
  return (
    <article
      className={cn(
        "glass spotlight group relative flex h-full flex-col gap-5 rounded-3xl p-4 transition-transform duration-300 hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            width={projectImageSize.width}
            height={projectImageSize.height}
            sizes="(min-width: 1024px) 400px, (min-width: 768px) 45vw, 100vw"
            className="size-full object-cover object-top-left transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <ComingSoonCover name={project.name} label={labels.comingSoon} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-2 pb-2">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline" className="rounded-full border-white/20 bg-white/5 text-[11px] text-white/80">
            {categoryLabel}
          </Badge>
          {project.completedLabel && (
            <time dateTime={project.completedISO} className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CalendarCheck aria-hidden="true" className="size-3.5" />
              <span className="sr-only">{labels.completed}: </span>
              {project.completedLabel}
            </time>
          )}
        </div>

        <h3 className="text-xl font-semibold tracking-tight">
          {project.url && !project.comingSoon ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-brand-mid/70"
            >
              {project.name}
              <span className="sr-only"> {labels.newTab}</span>
            </a>
          ) : (
            project.name
          )}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{project.summary}</p>

        <p className="mt-auto pt-2 text-sm text-white/85">
          <span className="text-brand font-medium">{labels.result}: </span>
          {project.result}
        </p>

        <ul className="flex flex-wrap gap-2 pt-1">
          {project.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-white/70">
              {tag}
            </li>
          ))}
        </ul>

        {project.url && !project.comingSoon ? (
          <span aria-hidden="true" className="text-brand-from mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
            {labels.visit}
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        ) : (
          <span className="text-muted-foreground mt-1 inline-flex items-center gap-2 text-sm font-medium">
            <span aria-hidden="true" className="bg-brand-from size-1.5 rounded-full" />
            {labels.comingSoon}
          </span>
        )}
      </div>
    </article>
  );
}
