import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleLink } from "@/components/shared/locale-link";
import { Reveal } from "@/components/shared/reveal";
import { Section } from "@/components/shared/section";
import { FlameBackground } from "./flame-background";
import type { RoutePath } from "@/config/routes";

type CtaBannerProps = {
  title: string;
  description: string;
  primary: { label: string; href: RoutePath };
  secondary?: { label: string; href: RoutePath };
};

export function CtaBanner({ title, description, primary, secondary }: CtaBannerProps) {
  return (
    <Section>
      <Reveal>
        <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-16 text-center md:px-16 md:py-24">
          <FlameBackground />
          <h2 className="text-fade-brand mx-auto max-w-3xl text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/90 md:text-lg">{description}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="dark" size="pill-lg">
              <LocaleLink href={primary.href}>
                {primary.label}
                <span className="bg-brand grid size-10 place-items-center rounded-full">
                  <ArrowRight className="size-4" />
                </span>
              </LocaleLink>
            </Button>
            {secondary && (
              <Button asChild variant="glass" size="pill" className="bg-black/55 hover:bg-black/70">
                <LocaleLink href={secondary.href}>{secondary.label}</LocaleLink>
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
