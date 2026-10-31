/**
 * Locale switch with a circular reveal from the click point.
 *
 * Uses the View Transitions API: the browser freezes a snapshot of the old locale/theme, we
 * navigate, and once the new locale is rendered the new snapshot is revealed through an
 * expanding circle. Both snapshots are GPU textures, so unlike animating CSS colours across
 * the live page (a full repaint every frame) this stays smooth. Browsers without the API, and
 * users who prefer reduced motion, just get an instant switch.
 */
/** Slow, ease-in-out reveal: it starts gently, sweeps across, and settles softly. */
const DURATION = 1500;
const EASING = "cubic-bezier(0.45, 0, 0.2, 1)";
const TIMEOUT = 3000;

export function transitionLocale({ x, y, navigate }: { x: number; y: number; navigate: () => void }) {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || typeof document.startViewTransition !== "function") {
    navigate();
    return;
  }

  const startLang = root.lang;
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        let finished = false;
        const done = () => {
          if (finished) return;
          finished = true;
          observer.disconnect();
          clearTimeout(timer);
          // Rendering is paused while the callback is pending, so rAF would never fire here:
          // use a timer to let React finish committing before the "new" snapshot is taken.
          setTimeout(resolve, 60);
        };
        const observer = new MutationObserver(() => {
          if (root.lang !== startLang) done();
        });
        observer.observe(root, { attributes: true, attributeFilter: ["lang"] });
        const timer = setTimeout(done, TIMEOUT);
        navigate();
      }),
  );

  transition.ready
    .then(() => {
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: DURATION, easing: EASING, pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {
      /* transition skipped (e.g. tab hidden): the page already switched */
    });
}
