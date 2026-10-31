import { CheckCircle2, ClipboardList, Code2, Palette, Rocket } from "lucide-react";
import { GlassCard } from "@/components/shared/glass-card";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { CountUp } from "@/components/motion/count-up";
import { ScrollDeck } from "@/components/motion/scroll-deck";
import { Tilt } from "@/components/motion/tilt";
import { ProgressRing } from "@/components/shared/progress-ring";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type Cards = Dictionary["home"]["hero"]["cards"];

const ghost = "fly glass rounded-3xl";

/**
 * Where a card sits while stacked behind the hero card: `s` = start delay, `x`/`y` = offset toward
 * the centre (px), `z` = depth, `o` = max opacity. See the `fly` utility in globals.css.
 */
function fly(s: number, x: number, y: number, z = -260, o = 1): CSSProperties {
  return { "--s": s, "--tx": `${x}px`, "--ty": `${y}px`, "--tz": `${z}px`, "--o": o } as CSSProperties;
}

function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm font-medium text-white/90", className)}>{children}</p>;
}

function Sparkline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 36" className={cn("h-9 w-full", className)} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark" x1="0" x2="1">
          <stop style={{ stopColor: "rgb(var(--pale-rgb))" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--to-rgb))" }} />
        </linearGradient>
      </defs>
      <path
        d="M0 28 C 12 26, 18 12, 30 16 S 52 30, 64 20 S 90 4, 102 10 S 116 14, 120 8"
        stroke="url(#spark)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Decorative product-style widgets for the hero: an at-a-glance "project dashboard".
 * Hidden from assistive tech; numbers are illustrative.
 */
export function HeroDashboard({ cards, className }: { cards: Cards; className?: string }) {
  const milestones = [
    { key: "requirements", icon: ClipboardList, value: 100 },
    { key: "design", icon: Palette, value: 100 },
    { key: "build", icon: Code2, value: 86 },
  ] as const;

  return (
    <ScrollDeck className={cn("relative mx-auto w-full max-w-[1180px]", className)}>
      <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-6">
        {/* Left column */}
        <div className="animate-float-slow hidden flex-col gap-5 lg:flex">
          <GlassCard className="fly p-5" style={fly(0.1, 400, 120)}>
            <CardTitle>{cards.performance.title}</CardTitle>
            <div className="mt-4 grid place-items-center">
              <ProgressRing value={Number(cards.performance.value)} size={128} stroke={5} id="perf">
                <div className="text-center">
                  <div className="text-2xl font-semibold tracking-tight">
                    <CountUp value={cards.performance.value} />
                  </div>
                  <div className="text-[10px] text-white/60">{cards.performance.caption}</div>
                </div>
              </ProgressRing>
            </div>
          </GlassCard>

          <GlassCard className="fly p-5" style={fly(0.2, 400, -120)}>
            <CardTitle>{cards.uptime.title}</CardTitle>
            <Sparkline className="mt-3" />
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              <CountUp value={cards.uptime.value} duration={2200} />
            </div>
            <div className="text-[11px] text-white/50">{cards.uptime.caption}</div>
          </GlassCard>
        </div>

        {/* Centre column */}
        <div className="relative">
          {/* ghost panels peeking out behind the main card */}
          <div className={cn(ghost, "absolute -top-10 -left-16 hidden h-48 w-44 lg:block")} style={fly(0.3, 200, 90, -380, 0.6)} />
          <div className={cn(ghost, "absolute -top-10 -right-16 hidden h-48 w-44 lg:block")} style={fly(0.34, -200, 90, -380, 0.6)} />
          <div className={cn(ghost, "absolute -bottom-12 -left-14 hidden h-56 w-40 lg:block")} style={fly(0.38, 200, -90, -380, 0.6)} />
          <div className={cn(ghost, "absolute -right-14 -bottom-12 hidden h-56 w-40 lg:block")} style={fly(0.4, -200, -90, -380, 0.6)} />

          <div className="fly relative z-10" style={fly(0, 0, 70, -160)}>
          <Tilt max={4}>
          <GlassCard className="animate-float relative overflow-hidden rounded-[28px] p-6 shadow-[0_0_80px_-10px_rgb(var(--to-rgb)/0.55)] sm:p-8">
            <div
              className="absolute inset-0 -z-10 opacity-90"
              style={{
                background:
                  "radial-gradient(120% 90% at 85% 100%, rgb(var(--to-rgb) / 0.65), transparent 60%), linear-gradient(160deg, rgb(var(--ember-rgb) / 0.55), rgb(var(--night-rgb) / 0.7))",
              }}
            />
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{cards.pipeline.title}</CardTitle>
              <Rocket className="size-4 text-white/60" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <CheckCircle2 className="size-7 text-brand-from sm:size-8" />
              <div className="text-3xl font-semibold tracking-tight sm:text-5xl">{cards.pipeline.value}</div>
            </div>

            {/* segmented progress */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {[100, 100, 86, 40].map((v, i) => (
                <AnimatedBar key={i} value={v} delay={300 + i * 220} />
              ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-12">
              <div>
                <div className="text-xs text-white/60">{cards.pipeline.design}</div>
                <div className="text-xl font-semibold tracking-tight sm:text-3xl">
                  <CountUp value="100%" />
                </div>
              </div>
              <div>
                <div className="text-xs text-white/60">{cards.pipeline.build}</div>
                <div className="text-xl font-semibold tracking-tight sm:text-3xl">
                  <CountUp value="86%" />
                </div>
              </div>
            </div>
          </GlassCard>
          </Tilt>
          </div>
        </div>

        {/* Right column */}
        <div className="animate-float-slow hidden flex-col gap-5 [animation-delay:-4s] lg:flex">
          <GlassCard className="fly p-5" style={fly(0.12, -400, 130)}>
            <CardTitle>{cards.milestones.title}</CardTitle>
            <ul className="mt-3 flex flex-col gap-2">
              {milestones.map(({ key, icon: Icon, value }) => (
                <li key={key} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-2">
                  <span className="grid size-8 place-items-center rounded-full bg-white/10">
                    <Icon className="size-3.5 text-white/80" />
                  </span>
                  <span className="flex-1 text-[11px] leading-tight text-white/90">
                    {cards.milestones.items[key]}
                  </span>
                  <ProgressRing value={value} size={30} stroke={2.5} id={`ms-${key}`} delay={400}>
                    <span className="text-[8px] text-white/80">{value}%</span>
                  </ProgressRing>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="fly p-5" style={fly(0.22, -400, -130)}>
            <div className="flex items-center justify-between">
              <CardTitle>{cards.release.title}</CardTitle>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/70">
                {cards.release.seeAll}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.05] p-2.5 text-[11px] text-white/90">
              <Rocket className="size-3.5 text-white/70" />
              {cards.release.name}
            </div>
            <div className="mt-4 text-xl font-semibold tracking-tight">
              <CountUp value="92%" />
            </div>
            <AnimatedBar value={92} delay={500} trackClassName="mt-2" />
            <div className="mt-2 text-right text-[10px] text-white/50">{cards.release.remaining}</div>
          </GlassCard>
        </div>
      </div>
    </ScrollDeck>
  );
}
