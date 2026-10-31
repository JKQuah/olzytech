import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

export function Section({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("relative py-20 md:py-28", className)} {...props}>
      <div className="container-page">{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <span className="text-brand text-xs font-semibold tracking-[0.22em] uppercase">{eyebrow}</span>
      )}
      <Heading className="text-fade-brand text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl">
        {title}
      </Heading>
      {description && (
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed text-pretty md:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
