"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import type { Dictionary } from "@/i18n/dictionaries";
import { TOOL_KINDS, type ToolKind, type TouchRect } from "@/components/three/stack-kinds";
import type { StackScene } from "@/components/three/stack-scene";
import { cn } from "@/lib/utils";

type Demo = Dictionary["showcase"]["stack"]["demo"];

const FALLBACK_ACCENT = { from: "255 138 115", to: "240 96 90", glow: "255 170 150" };
const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

/**
 * Interactive 3D demo: a blank web page floats in a Three.js scene, and the visitor drags nine
 * steps onto it, from Idea to SEO, watching it grow into a designed, built, tested, live website.
 *
 * Three.js (~170 kB gzipped) is loaded only when the stage is about to scroll into view, and the
 * render loop pauses while it is off screen. Keyboard users get real (visually hidden) buttons that
 * drive the same scene one step at a time, and the result text is announced through a live region.
 */
export function StackDemo({ dict }: { dict: Demo }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StackScene | null>(null);
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  const [status, setStatus] = useState<"idle" | "ready" | "unsupported">("idle");
  const [applied, setApplied] = useState<ToolKind[]>([]);
  const [last, setLast] = useState<ToolKind | null>(null);
  const [touch, setTouch] = useState<TouchRect | null>(null);

  useEffect(() => {
    reducedRef.current = reduced;
    sceneRef.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    if (!host || !layer) return;

    // A canvas whose WebGL context was lost (our cleanup does that on purpose) can never get a new one,
    // so every scene gets a brand-new canvas. Reusing one broke on remounts (StrictMode, Fast Refresh).
    let canvas: HTMLCanvasElement | null = null;
    let disposed = false;
    let started = false;
    let visible = false;

    const start = async () => {
      started = true;
      try {
        const sans = getComputedStyle(host).fontFamily;
        const root = getComputedStyle(document.documentElement);
        const read = (name: string, fallback: string) => root.getPropertyValue(name).trim() || fallback;

        // The scene draws text onto canvases, so the web fonts have to be ready first.
        const sample = JSON.stringify(dict.scene) + JSON.stringify(dict.tools);
        const [mod] = await Promise.all([
          import("@/components/three/stack-scene"),
          ...[400, 500, 600, 700, 800].map((w) => document.fonts.load(`${w} 24px ${sans}`, sample).catch(() => [])),
        ]);
        if (disposed) return;

        const { scene: s, tools } = dict;
        canvas = document.createElement("canvas");
        canvas.className = "block size-full";
        layer.appendChild(canvas);
        const scene = mod.createStackScene({
          host,
          canvas,
          copy: {
            tools: Object.fromEntries(TOOL_KINDS.map((k) => [k, tools[k].label])) as Record<ToolKind, string>,
            hints: Object.fromEntries(TOOL_KINDS.map((k) => [k, tools[k].hint])) as Record<ToolKind, string>,
            step: dict.step,
            dragHint: dict.dragHint,
            doneTitle: dict.done.title,
            doneHint: dict.done.hint,
            dropHint: dict.dropHint,
            links: s.links,
            brand: s.brand,
            blank: s.blank,
            ideaTitle: s.ideaTitle,
            ideaNote: s.ideaNote,
            reqTitle: s.reqTitle,
            reqItems: s.reqItems,
            styledTitle: s.styledTitle,
            styledBody: s.styledBody,
            styledButton: s.styledButton,
            cards: s.cards,
            orderToast: s.orderToast,
            testsTitle: s.testsTitle,
            tests: s.tests,
            passed: s.passed,
            offline: s.offline,
            live: s.live,
            visitors: s.visitors,
            searchTitle: s.searchTitle,
            searchSnippet: s.searchSnippet,
          },
          fonts: { sans, mono: MONO },
          accent: {
            from: read("--from-rgb", FALLBACK_ACCENT.from),
            to: read("--to-rgb", FALLBACK_ACCENT.to),
            glow: read("--glow-rgb", FALLBACK_ACCENT.glow),
          },
          reducedMotion: reducedRef.current,
          onChange: (list, lastKind) => {
            setApplied([...list]);
            setLast(lastKind);
          },
          onTouchRect: setTouch,
        });
        sceneRef.current = scene;
        scene.setActive(visible);
        setStatus("ready");
      } catch {
        // No WebGL (or it failed to start): the section heading above still stands on its own.
        canvas?.remove();
        canvas = null;
        if (!disposed) setStatus("unsupported");
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !started) void start();
        sceneRef.current?.setActive(visible);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(host);

    return () => {
      disposed = true;
      io.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
      canvas?.remove();
      canvas = null;
    };
  }, [dict]);

  if (status === "unsupported") return null;

  const total = TOOL_KINDS.length;
  const complete = applied.length === total;
  const message = complete ? dict.promptDone : last ? dict.tools[last].result : dict.prompt;

  return (
    <div className="glass rounded-[2rem] p-2.5 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 pt-1 pb-3 md:px-3">
        <p aria-live="polite" className="min-h-6 flex-1 basis-64 text-sm leading-snug text-white/85 text-pretty md:text-base">
          {message}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-xs tracking-wide tabular-nums">
            {applied.length}/{total} {dict.applied}
          </span>
          <button
            type="button"
            onClick={() => sceneRef.current?.reset()}
            disabled={applied.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 text-xs font-medium text-white transition-all outline-none hover:border-white/30 hover:bg-white/[0.12] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-35"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {dict.reset}
          </button>
        </div>
      </div>

      <div
        ref={hostRef}
        role="group"
        aria-label={dict.stageLabel}
        className="relative aspect-[3/4] w-full touch-pan-y overflow-hidden rounded-3xl bg-black/45 select-none md:aspect-[16/9]"
      >
        <div ref={layerRef} aria-hidden="true" className={cn("absolute inset-0 transition-opacity duration-700", status === "ready" ? "opacity-100" : "opacity-0")} />

        {/* Only the step that can be dragged captures touch, so the rest of the stage still scrolls the page. */}
        {status === "ready" && touch && (
          <div
            aria-hidden="true"
            className="absolute touch-none"
            style={{ left: `${touch.left * 100}%`, top: `${touch.top * 100}%`, width: `${touch.width * 100}%`, height: `${touch.height * 100}%` }}
          />
        )}

        {status !== "ready" && (
          <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
            <div className="h-1/2 w-3/5 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
          </div>
        )}

        {/* Keyboard route: the same actions as dragging, one step at a time, with the step highlighted in the scene. */}
        <div className="sr-only">
          {TOOL_KINDS.map((kind, i) => (
            <button
              key={kind}
              type="button"
              disabled={status !== "ready" || i !== applied.length}
              onFocus={() => sceneRef.current?.focusChip(kind)}
              onBlur={() => sceneRef.current?.focusChip(null)}
              onClick={() => sceneRef.current?.apply(kind)}
            >
              {dict.tools[kind].action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
