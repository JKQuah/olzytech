"use client";

import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** 0-100 */
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  /** Unique gradient id when several rings render on one page. */
  id?: string;
  /** Stagger in ms for the fill animation. */
  delay?: number;
};

/** SVG ring with a theme-gradient arc that sweeps in from empty when scrolled into view. */
export function ProgressRing({ value, size = 120, stroke = 5, className, children, id = "ring", delay = 0 }: ProgressRingProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = inView ? c * (1 - Math.min(Math.max(value, 0), 100) / 100) : c;
  const gid = `${id}-grad`;

  return (
    <div ref={ref} className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop style={{ stopColor: "rgb(var(--pale-rgb))" }} />
            <stop offset="1" style={{ stopColor: "rgb(var(--to-rgb))" }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1800ms cubic-bezier(0.22, 1, 0.36, 1)", transitionDelay: `${delay}ms` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
