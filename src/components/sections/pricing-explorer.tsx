"use client";

import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import { localizedPath } from "@/config/routes";
import {
  FEATURED_LEVEL,
  addonPrices,
  defaultRegion,
  formatAmount,
  levelIds,
  levelPrices,
  regionIds,
  regions,
  type LevelId,
  type RegionId,
} from "@/content/pricing";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

/**
 * Only the slice of the pricing copy this client component needs. Passing the whole dictionary
 * would serialise everything (including unapproved testimonial drafts) into the page source.
 */
export type PricingExplorerDict = Pick<
  Dictionary["pricing"],
  "packages" | "regionLabel" | "regions" | "comingSoon" | "from" | "popular" | "levels" | "choose" | "oneOff" | "addons" | "custom" | "customNote" | "contactSales"
>;

/** `from RM 3,500`: the amount counts up whenever the market changes. */
function Price({ region, amount, from }: { region: RegionId; amount: number; from: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-muted-foreground text-sm">{from}</span>
      <span className="text-4xl font-semibold tracking-tight md:text-5xl">
        <span className="mr-1 text-[0.55em] font-medium text-white/70">{regions[region].symbol}</span>
        <CountUp value={formatAmount(amount)} duration={1400} />
      </span>
    </p>
  );
}

/** Three bars that fill with complexity: 1 = simple, 2 = moderate, 3 = complex. */
function ComplexityMeter({ level }: { level: LevelId }) {
  const filled = levelIds.indexOf(level) + 1;
  return (
    <span aria-hidden="true" className="flex items-end gap-1">
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn("w-1.5 rounded-full", n <= filled ? "bg-brand" : "bg-white/20")} style={{ height: 6 + n * 5 }} />
      ))}
    </span>
  );
}

export function PricingExplorer({ dict, locale }: { dict: PricingExplorerDict; locale: Locale }) {
  const [region, setRegion] = useState<RegionId>(defaultRegion);
  const contact = localizedPath(locale, "/contact");

  return (
    <Tabs value={region} onValueChange={(v) => setRegion(v as RegionId)} className="gap-0">
      {/* ---------- heading + market selector ---------- */}
      <Section id="pricing" className="pb-8 md:pb-10">
        <SectionHeading eyebrow={dict.packages.eyebrow} title={dict.packages.title} description={dict.packages.description} />

        <Reveal className="mt-10 flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">{dict.regionLabel}</p>
          <TabsList
            aria-label={dict.regionLabel}
            className="glass h-auto w-full max-w-xl gap-1 rounded-full bg-transparent p-1.5 group-data-horizontal/tabs:h-auto"
          >
            {regionIds.map((id) => (
              <TabsTrigger
                key={id}
                value={id}
                disabled={!regions[id].available}
                className="h-auto flex-col gap-0 rounded-full border-0 px-3 py-2.5 text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-white/70 data-[state=active]:bg-brand! data-[state=active]:text-white! data-[state=active]:shadow-[0_8px_30px_-8px_rgb(var(--to-rgb)/0.7)] sm:flex-row sm:gap-2.5 sm:px-5"
              >
                <span className="text-sm font-semibold">{dict.regions[id].label}</span>
                {regions[id].available ? (
                  <span className="text-[11px] tracking-wider opacity-80">{regions[id].currency}</span>
                ) : (
                  <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap uppercase">
                    {dict.comingSoon}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <p aria-live="polite" className="text-muted-foreground max-w-xl text-center text-xs leading-relaxed">
            {dict.regions[region].note}
          </p>
        </Reveal>
      </Section>

      {regionIds.map((r) => (
        <TabsContent key={r} value={r} className="text-base">
          {/* ---------- simple / moderate / complex ---------- */}
          <Section className="py-8 md:py-10">
            <ul className="flex flex-wrap justify-center gap-6">
              {levelIds.map((level, i) => {
                const featured = level === FEATURED_LEVEL;
                const copy = dict.levels[level];
                const prices = levelPrices[level];
                return (
                  <Reveal
                    as="li"
                    key={level}
                    delay={i * 90}
                    variant="scale"
                    className="w-full md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                  >
                    <article
                      className={cn(
                        "glass relative flex h-full flex-col gap-6 rounded-3xl p-7 md:p-8",
                        featured && "shadow-[0_0_90px_-20px_rgb(var(--to-rgb)/0.75)] lg:-my-4 lg:py-12",
                      )}
                    >
                      {featured && (
                        <span className="bg-brand absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold whitespace-nowrap text-white shadow-lg">
                          {dict.popular}
                        </span>
                      )}
                      <header>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-xl font-semibold tracking-tight">{copy.name}</h3>
                          <ComplexityMeter level={level} />
                        </div>
                        <p className="text-brand mt-1 text-xs font-medium">{copy.fits}</p>
                        <p className="text-muted-foreground mt-3 min-h-12 text-sm leading-relaxed">{copy.description}</p>
                      </header>

                      <div>
                        {prices ? (
                          <>
                            <Price region={r} amount={prices[r]} from={dict.from} />
                            <p className="text-muted-foreground mt-1.5 text-xs">{dict.oneOff}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-4xl font-semibold tracking-tight md:text-5xl">{dict.custom}</p>
                            <p className="text-muted-foreground mt-1.5 text-xs">{dict.customNote}</p>
                          </>
                        )}
                      </div>

                      <ul className="flex flex-1 flex-col gap-3 text-sm text-white/85">
                        {copy.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <Check className="text-brand-from mt-0.5 size-4 shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <Button asChild variant={featured ? "brand" : "glass"} size="pill" className="w-full justify-center">
                        <Link href={contact}>
                          {prices ? `${dict.choose} ${copy.name}` : dict.contactSales}
                        </Link>
                      </Button>
                    </article>
                  </Reveal>
                );
              })}
            </ul>
          </Section>

          {/* ---------- add-ons ---------- */}
          <Section className="py-12 md:py-16">
            <SectionHeading eyebrow={dict.addons.eyebrow} title={dict.addons.title} description={dict.addons.description} />
            <ul className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* cheapest first, in the selected market's currency */}
              {[...dict.addons.items]
                .sort((a, b) => addonPrices[a.id as keyof typeof addonPrices][r] - addonPrices[b.id as keyof typeof addonPrices][r])
                .map((item, i) => {
                const id = item.id as keyof typeof addonPrices;
                return (
                  <Reveal as="li" key={item.id} delay={(i % 3) * 70}>
                    <div className="glass flex h-full flex-col gap-3 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold tracking-tight">{item.name}</h3>
                        <p className="text-right whitespace-nowrap">
                          <span className="text-brand font-semibold">
                            {regions[r].symbol}
                            {formatAmount(addonPrices[id][r])}
                          </span>
                          <span className="text-muted-foreground block text-[11px]">{item.unit}</span>
                        </p>
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          </Section>
        </TabsContent>
      ))}
    </Tabs>
  );
}
