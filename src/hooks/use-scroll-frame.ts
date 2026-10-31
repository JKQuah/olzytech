"use client";

import { useEffect, useRef } from "react";

/**
 * One shared scroll/resize listener and one requestAnimationFrame per frame for every
 * scroll-linked effect. Each frame runs ALL `read` callbacks first (layout reads), then ALL
 * `write` callbacks (style writes). Interleaving reads and writes across components forces
 * the browser to re-run style/layout several times per frame, which is what makes scroll
 * effects janky.
 */
type Task = { read: () => unknown; write: (data: never) => void; };

const tasks = new Set<Task>();
let raf = 0;
let listening = false;

function flush() {
  raf = 0;
  const reads: [Task, unknown][] = [];
  tasks.forEach((task) => reads.push([task, task.read()]));
  for (const [task, data] of reads) {
    if (data !== null) task.write(data as never);
  }
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(flush);
}

function subscribe(task: Task) {
  tasks.add(task);
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  schedule();
  return () => {
    tasks.delete(task);
    if (tasks.size === 0 && listening) {
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

/**
 * `read` measures (scrollY, getBoundingClientRect, ...) and returns data, or `null` to skip this
 * frame. `write` receives that data and only touches styles. Never mix the two.
 */
export function useScrollFrame<T>(read: () => T | null, write: (data: T) => void, enabled = true) {
  const latest = useRef({ read, write });
  useEffect(() => {
    latest.current = { read, write };
  });

  useEffect(() => {
    if (!enabled) return;
    return subscribe({
      read: () => latest.current.read(),
      write: (data) => latest.current.write(data),
    });
  }, [enabled]);
}

export const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
