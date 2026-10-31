import * as THREE from "three";
import { TOOL_KINDS, type ToolKind, type TouchRect } from "./stack-kinds";

/**
 * "From idea to launch" demo for the About page toolkit section.
 *
 * A blank web page floats in 3D. A roadmap of nine step chips (Idea, Requirements, Prototype, Design,
 * Backend, Database, Testing, Deployment, SEO) sits beside it. Only the next step can be picked up;
 * dragging it onto the page (or tapping it) applies it, and the page visibly grows:
 *
 *   idea         sticky note + light bulb
 *   requirements checklist ticks itself off
 *   prototype    grey wireframe
 *   design       wireframe becomes the finished brand page
 *   backend      API log streams, data packets flow in, orders pop up
 *   database     tables fill, real prices replace the loading skeletons
 *   testing      test suite goes green, a verified badge appears
 *   deploy       localhost becomes https, Live badge, globe, pulses
 *   seo          #1 search result, visitors stream in, analytics climb
 *
 * This file is plain TypeScript (no React). `StackDemo` owns the DOM and calls `createStackScene`.
 * Everything is transparent and depth-less, layered by `renderOrder` in creation order.
 */

export { TOOL_KINDS };
export type { ToolKind, TouchRect };

export type SceneCopy = {
  tools: Record<ToolKind, string>;
  hints: Record<ToolKind, string>;
  step: string;
  dragHint: string;
  doneTitle: string;
  doneHint: string;
  dropHint: string;
  links: string[];
  brand: string;
  blank: string;
  ideaTitle: string;
  ideaNote: string;
  reqTitle: string;
  reqItems: string[];
  styledTitle: string;
  styledBody: string;
  styledButton: string;
  cards: string[];
  orderToast: string;
  testsTitle: string;
  tests: string[];
  passed: string;
  offline: string;
  live: string;
  visitors: string;
  searchTitle: string;
  searchSnippet: string;
};

export type SceneOptions = {
  /** Receives the pointer events and defines the size of the canvas. */
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  copy: SceneCopy;
  fonts: { sans: string; mono: string };
  /** Theme channels as "r g b" (0-255). */
  accent: { from: string; to: string; glow: string };
  reducedMotion: boolean;
  onChange: (applied: readonly ToolKind[], last: ToolKind | null) => void;
  /** Where the draggable step currently sits, so only that area captures touch. */
  onTouchRect: (rect: TouchRect | null) => void;
};

export type StackScene = {
  apply(kind: ToolKind): void;
  reset(): void;
  setActive(active: boolean): void;
  setReducedMotion(reduced: boolean): void;
  focusChip(kind: ToolKind | null): void;
  dispose(): void;
};

/* ----------------------------------------------------------------------------------------------
 * Layout constants (world units)
 * ------------------------------------------------------------------------------------------- */

const S = 240; // texture pixels per world unit
const WIN_W = 8;
const WIN_H = 4.8;
const VIEW_W = 7.7;
const VIEW_H = 4.05;
const VIEW_Y = -0.275;
const CARD_W = 3.1;
const CARD_H = 1.9;
const NODE_D = 0.56;
const X0 = -3.45; // left margin of the page content
const FOV = 32;
const VISITORS = 90;
const PRICES = ["RM 9", "RM 11", "RM 12"];

/* ----------------------------------------------------------------------------------------------
 * Small helpers
 * ------------------------------------------------------------------------------------------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const damp = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

const channels = (s: string) => s.trim().split(/\s+/).map(Number) as [number, number, number];
const rgb = (s: string) => {
  const [r, g, b] = channels(s);
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
};
const rgba = (s: string, a = 1) => {
  const [r, g, b] = channels(s);
  return `rgba(${r},${g},${b},${a})`;
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
};

const fitText = (ctx: CanvasRenderingContext2D, text: string, maxPx: number) => {
  if (ctx.measureText(text).width <= maxPx) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxPx) t = t.slice(0, -1);
  return `${t}…`;
};

/* ----------------------------------------------------------------------------------------------
 * Rounded-rectangle shader: one material for every panel, so radius, colour and opacity can animate
 * ------------------------------------------------------------------------------------------- */

const panelVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const panelFrag = /* glsl */ `
uniform vec2 uSize;
uniform float uRadius;
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uOpacity;
uniform float uBorder;
uniform vec3 uBorderColor;
uniform float uBorderOpacity;
uniform float uSoft;
varying vec2 vUv;

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float r = min(uRadius, min(uSize.x, uSize.y) * 0.5);
  float d = sdBox(p, uSize * 0.5, r);
  float aa = max(fwidth(d), 0.0005);
  float inside = 1.0 - smoothstep(-aa, aa, d);
  if (uSoft > 0.0) {
    inside = 1.0 - smoothstep(-uSoft, 0.0, d);
    inside *= inside;
  }
  float ring = inside * smoothstep(-uBorder - aa, -uBorder + aa, d) * step(0.0001, uBorder);
  vec3 col = mix(uBottom, uTop, vUv.y);
  float rb = ring * uBorderOpacity;
  col = mix(col, uBorderColor, rb);
  float a = max(inside * uOpacity, rb);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

type PanelOpts = {
  w: number;
  h: number;
  radius?: number;
  top?: THREE.Color;
  bottom?: THREE.Color;
  opacity?: number;
  border?: number;
  borderColor?: THREE.Color;
  borderOpacity?: number;
  soft?: number;
};

type Panel = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  u: {
    uSize: { value: THREE.Vector2 };
    uRadius: { value: number };
    uTop: { value: THREE.Color };
    uBottom: { value: THREE.Color };
    uOpacity: { value: number };
    uBorder: { value: number };
    uBorderColor: { value: THREE.Color };
    uBorderOpacity: { value: number };
    uSoft: { value: number };
  };
  resize(w: number, h: number): void;
};

type TextMesh = THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
type TextObj = { mesh: TextMesh; w: number; h: number };
type TextOpts = {
  text: string;
  font: string;
  size: number;
  weight?: number;
  color?: string;
  gradient?: [string, string];
  maxWidth?: number;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  anchor?: [number, number];
};

type Fade = (o: number) => void;

type LiveCard = {
  mesh: TextMesh;
  /** Re-draw next tick (state changed). */
  dirty: boolean;
  /** Redraw when `needsDraw` (at most every `interval` seconds) or when dirty. */
  tick(dt: number, needsDraw: boolean, interval: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): void;
  alpha: Fade;
};

type Chip = {
  /** The step this card stands for; null for the closing "launched" card. */
  kind: ToolKind | null;
  index: number;
  group: THREE.Group;
  bg: Panel;
  halo: Panel;
  face: TextMesh;
  orbit: TextMesh;
  grip: TextMesh;
  color: THREE.Color;
  state: "idle" | "fly";
  done: boolean;
  flyT: number;
  flyFrom: THREE.Vector3;
  alpha: number;
  scale: number;
  glow: number;
  unlock: number;
  /** 0 = in front, 1 = first card behind it, and so on. Animated. */
  depth: number;
  phase: number;
};

type Drag = {
  chip: Chip;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  offset: THREE.Vector2;
  target: THREE.Vector3;
  overWindow: boolean;
};

/* ----------------------------------------------------------------------------------------------
 * Scene
 * ------------------------------------------------------------------------------------------- */

export function createStackScene(opts: SceneOptions): StackScene {
  const { host, canvas, copy, fonts } = opts;
  let reduced = opts.reducedMotion;

  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(o: T): T => {
    disposables.push(o);
    return o;
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  /* ---- colours ---- */
  const accentFrom = rgb(opts.accent.from);
  const accentTo = rgb(opts.accent.to);
  const accentGlow = rgb(opts.accent.glow);
  const WHITE = new THREE.Color("#ffffff");
  const BLACK = new THREE.Color("#000000");
  const GREEN = new THREE.Color("#34d399");
  const RED = new THREE.Color("#f87171");

  const toolHex: Record<ToolKind, string | null> = {
    idea: "#facc15",
    requirements: "#22d3ee",
    prototype: "#a78bfa",
    design: null, // the locale theme colour
    backend: "#60a5fa",
    database: "#e879f9",
    testing: "#a3e635",
    deploy: "#34d399",
    seo: "#fb923c",
  };
  const toolColor = Object.fromEntries(TOOL_KINDS.map((k) => [k, toolHex[k] ? new THREE.Color(toolHex[k]!) : accentFrom])) as Record<ToolKind, THREE.Color>;

  let order = 0;
  const ordered = <T extends THREE.Object3D>(o: T): T => {
    o.renderOrder = ++order;
    return o;
  };

  /* ---- factories ---- */
  const unitPlane = track(new THREE.PlaneGeometry(1, 1));

  const createPanel = (o: PanelOpts): Panel => {
    const u = {
      uSize: { value: new THREE.Vector2(o.w, o.h) },
      uRadius: { value: o.radius ?? 0 },
      uTop: { value: (o.top ?? WHITE).clone() },
      uBottom: { value: (o.bottom ?? o.top ?? WHITE).clone() },
      uOpacity: { value: o.opacity ?? 1 },
      uBorder: { value: o.border ?? 0 },
      uBorderColor: { value: (o.borderColor ?? WHITE).clone() },
      uBorderOpacity: { value: o.borderOpacity ?? 0 },
      uSoft: { value: o.soft ?? 0 },
    };
    const material = track(
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: panelVert,
        fragmentShader: panelFrag,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    );
    const mesh = ordered(new THREE.Mesh(unitPlane, material));
    mesh.scale.set(o.w, o.h, 1);
    return {
      mesh,
      u,
      resize(w, h) {
        mesh.scale.set(w, h, 1);
        u.uSize.value.set(w, h);
      },
    };
  };

  const canvasTexture = (wU: number, hU: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.ceil(wU * S));
    c.height = Math.max(2, Math.ceil(hU * S));
    const ctx = c.getContext("2d")!;
    draw(ctx, c.width, c.height);
    const t = track(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };

  const spriteMaterial = (map: THREE.Texture, opacity = 1) =>
    track(new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthTest: false, depthWrite: false }));

  const spriteMesh = (wU: number, hU: number, map: THREE.Texture, opacity = 0): TextMesh =>
    ordered(new THREE.Mesh(track(new THREE.PlaneGeometry(wU, hU)), spriteMaterial(map, opacity)));

  const circleMesh = (r: number, color: THREE.ColorRepresentation, opacity = 0): THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial> =>
    ordered(new THREE.Mesh(track(new THREE.CircleGeometry(r, 28)), track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false }))));

  const measure = document.createElement("canvas").getContext("2d")!;

  const wrapLine = (line: string, maxPx: number) => {
    if (!Number.isFinite(maxPx)) return [line];
    const tokens = /\s/.test(line) ? (line.match(/\S+\s*/g) ?? [line]) : Array.from(line);
    const out: string[] = [];
    let cur = "";
    for (const tok of tokens) {
      const next = cur + tok;
      if (cur && measure.measureText(next.trimEnd()).width > maxPx) {
        out.push(cur.trimEnd());
        cur = tok;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur.trimEnd());
    return out;
  };

  const makeText = (o: TextOpts): TextObj => {
    const px = o.size * S;
    const font = `${o.weight ?? 400} ${px}px ${o.font}`;
    measure.font = font;
    const maxPx = o.maxWidth ? o.maxWidth * S : Infinity;
    const lines = o.text.split("\n").flatMap((l) => wrapLine(l, maxPx));
    const lh = px * (o.lineHeight ?? 1.3);
    const wPx = Math.ceil(Math.max(...lines.map((l) => measure.measureText(l).width), 1)) + 6;
    const hPx = Math.ceil(lh * lines.length) + 4;
    const align = o.align ?? "left";
    const texture = canvasTexture(wPx / S, hPx / S, (ctx, w) => {
      ctx.font = font;
      ctx.textBaseline = "middle";
      ctx.textAlign = align;
      if (o.gradient) {
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, o.gradient[0]);
        g.addColorStop(1, o.gradient[1]);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = o.color ?? "#fff";
      }
      const x = align === "left" ? 3 : align === "center" ? w / 2 : w - 3;
      lines.forEach((l, i) => ctx.fillText(l, x, 2 + lh * (i + 0.5)));
    });
    const wU = wPx / S;
    const hU = hPx / S;
    const mesh = spriteMesh(wU, hU, texture, 0);
    const anchor = o.anchor ?? [0, 0.5];
    mesh.geometry.translate((0.5 - anchor[0]) * wU, (anchor[1] - 0.5) * hU, 0);
    mesh.visible = false;
    return { mesh, w: wU, h: hU };
  };

  /* fade helpers: every page element can be turned into a function of one number */
  const fadeMesh =
    (m: { material: THREE.MeshBasicMaterial; visible: boolean }, max = 1): Fade =>
    (o) => {
      m.material.opacity = o * max;
      m.visible = o > 0.004;
    };
  const fadeText = (t: TextObj, max = 1): Fade => fadeMesh(t.mesh, max);
  const fadePanel = (p: Panel): Fade => {
    const baseFill = p.u.uOpacity.value;
    const baseBorder = p.u.uBorderOpacity.value;
    return (o) => {
      p.u.uOpacity.value = baseFill * o;
      p.u.uBorderOpacity.value = baseBorder * o;
      p.mesh.visible = o > 0.004;
    };
  };

  const dotTexture = canvasTexture(0.3, 0.3, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

  const makePoints = (count: number, size: number) => {
    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const material = track(
      new THREE.PointsMaterial({
        size,
        map: dotTexture,
        vertexColors: true,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    const points = ordered(new THREE.Points(geometry, material));
    points.frustumCulled = false;
    return points;
  };

  const cardBackground = (ctx: CanvasRenderingContext2D, w: number, h: number, fill = "rgba(18,18,25,0.97)", stroke = "rgba(255,255,255,0.16)") => {
    roundRect(ctx, 2, 2, w - 4, h - 4, 0.18 * S);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  /* ---- scene graph ---- */
  const root = new THREE.Group();
  scene.add(root);
  const tilt = new THREE.Group(); // the window and everything attached to it, parallax-rotated together
  root.add(tilt);
  const win = new THREE.Group();
  tilt.add(win);

  const createLiveCard = (wU: number, hU: number, parent: THREE.Object3D, x: number, y: number, z: number): LiveCard => {
    const c = document.createElement("canvas");
    c.width = Math.ceil(wU * S);
    c.height = Math.ceil(hU * S);
    const ctx = c.getContext("2d")!;
    const texture = track(new THREE.CanvasTexture(c));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const mesh = spriteMesh(wU, hU, texture, 0);
    mesh.position.set(x, y, z);
    mesh.visible = false;
    parent.add(mesh);
    let acc = 0;
    const card: LiveCard = {
      mesh,
      dirty: true,
      tick(dt, needsDraw, interval, draw) {
        acc += dt;
        if (!card.dirty && !(needsDraw && acc >= interval)) return;
        acc = 0;
        card.dirty = false;
        ctx.clearRect(0, 0, c.width, c.height);
        draw(ctx, c.width, c.height);
        texture.needsUpdate = true;
      },
      alpha: fadeMesh(mesh),
    };
    return card;
  };

  /* ---- globe (behind the window, appears on deploy) ---- */
  const globe = new THREE.Group();
  globe.position.set(3.45, 2.75, -0.8);
  tilt.add(globe);
  const globeSpin = new THREE.Group();
  globeSpin.rotation.z = 0.4;
  globe.add(globeSpin);
  const globeLinesMat = track(new THREE.LineBasicMaterial({ color: accentGlow, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  const globeLines = ordered(new THREE.LineSegments(track(new THREE.WireframeGeometry(track(new THREE.SphereGeometry(0.95, 20, 14)))), globeLinesMat));
  globeSpin.add(globeLines);
  const globeNodes = makePoints(34, 0.14);
  {
    const pos = globeNodes.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = globeNodes.geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < 34; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      pos.setXYZ(i, 0.97 * Math.sin(phi) * Math.cos(theta), 0.97 * Math.cos(phi), 0.97 * Math.sin(phi) * Math.sin(theta));
      col.setXYZ(i, 1, 0.95, 0.85);
    }
  }
  globeSpin.add(globeNodes);
  const globeRing = createPanel({ w: 2.5, h: 2.5, radius: 1.25, opacity: 0, border: 0.02, borderColor: accentGlow, borderOpacity: 0 });
  globe.add(globeRing.mesh);
  globe.scale.setScalar(0.0001);

  /* ---- window frame, halo and deploy pulses ---- */
  const HALO = 0.55;
  const halo = createPanel({ w: WIN_W + HALO * 2, h: WIN_H + HALO * 2, radius: 0.28 + HALO, top: accentFrom, opacity: 0, soft: HALO });
  win.add(halo.mesh);
  const pulses = [0, 1].map(() => {
    const p = createPanel({ w: WIN_W, h: WIN_H, radius: 0.28, opacity: 0, border: 0.03, borderColor: GREEN, borderOpacity: 0 });
    win.add(p.mesh);
    return p;
  });
  const frame = createPanel({
    w: WIN_W,
    h: WIN_H,
    radius: 0.28,
    top: new THREE.Color("#171720"),
    bottom: new THREE.Color("#0e0e14"),
    border: 0.02,
    borderColor: WHITE,
    borderOpacity: 0.14,
  });
  win.add(frame.mesh);

  /* ---- toolbar: traffic lights, URL pill, status badge ---- */
  const toolbarY = WIN_H / 2 - 0.33;
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
    const dot = circleMesh(0.075, c, 1);
    dot.position.set(-WIN_W / 2 + 0.38 + i * 0.24, toolbarY, 0.001);
    win.add(dot);
  });
  const PILL_W = 4.5;
  const PILL_X = -0.45;
  const pill = createPanel({ w: PILL_W, h: 0.4, radius: 0.2, top: new THREE.Color("#23232d"), border: 0.02, borderColor: GREEN, borderOpacity: 0 });
  pill.mesh.position.set(PILL_X, toolbarY, 0.001);
  win.add(pill.mesh);

  const urlTexture = (live: boolean) =>
    canvasTexture(PILL_W - 0.2, 0.4, (ctx, w, h) => {
      const cy = h / 2;
      const lock = live ? "#34d399" : "#f87171";
      ctx.fillStyle = lock;
      ctx.strokeStyle = lock;
      ctx.lineWidth = 0.028 * S;
      ctx.lineCap = "round";
      const bx = 0.2 * S;
      roundRect(ctx, bx, cy - 0.02 * S, 0.17 * S, 0.13 * S, 0.025 * S);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bx + 0.085 * S, cy - 0.02 * S, 0.055 * S, Math.PI, live ? 0 : Math.PI * 1.8);
      ctx.stroke();
      ctx.font = `500 ${0.18 * S}px ${fonts.sans}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      if (live) {
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText("https://", 0.5 * S, cy);
        const pw = ctx.measureText("https://").width;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText("brewandco.com", 0.5 * S + pw, cy);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillText("localhost:3000", 0.5 * S, cy);
      }
    });
  const urlOffMesh = spriteMesh(PILL_W - 0.2, 0.4, urlTexture(false), 1);
  const urlOnMesh = spriteMesh(PILL_W - 0.2, 0.4, urlTexture(true), 0);
  [urlOffMesh, urlOnMesh].forEach((m) => {
    m.position.set(PILL_X, toolbarY, 0.002);
    win.add(m);
  });

  const BADGE_X = 2.95;
  const badge = createPanel({ w: 1.5, h: 0.4, radius: 0.2, top: new THREE.Color("#23232d") });
  badge.mesh.position.set(BADGE_X, toolbarY, 0.001);
  win.add(badge.mesh);
  const badgeDot = circleMesh(0.06, RED, 1);
  badgeDot.position.set(BADGE_X - 0.5, toolbarY, 0.002);
  win.add(badgeDot);
  const badgeOff = makeText({ text: copy.offline, font: fonts.sans, size: 0.17, weight: 600, color: "rgba(248,113,113,1)" });
  const badgeOn = makeText({ text: copy.live, font: fonts.sans, size: 0.17, weight: 600, color: "rgba(52,211,153,1)" });
  [badgeOff, badgeOn].forEach((t) => {
    t.mesh.position.set(BADGE_X - 0.36, toolbarY, 0.002);
    win.add(t.mesh);
  });

  /* ----------------------------------------------------------------------------------------------
   * The page
   * ------------------------------------------------------------------------------------------- */

  const page = new THREE.Group();
  page.position.set(0, VIEW_Y, 0.004);
  win.add(page);

  const sans = fonts.sans;
  const mono = fonts.mono;

  const LIGHT_TOP = new THREE.Color("#f8f8fa");
  const LIGHT_BOTTOM = new THREE.Color("#ececf1");
  const DARK_TOP = new THREE.Color("#15151e").lerp(accentTo, 0.06);
  const DARK_BOTTOM = new THREE.Color("#07070b");
  const pageBg = createPanel({ w: VIEW_W, h: VIEW_H, radius: 0.2, top: LIGHT_TOP, bottom: LIGHT_BOTTOM });
  page.add(pageBg.mesh);

  const blobTexture = canvasTexture(1, 1, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const designBlob = spriteMesh(4.6, 4.6, blobTexture, 0);
  designBlob.material.color.copy(accentTo);
  designBlob.position.set(2.2, 0.6, 0.001);
  page.add(designBlob);

  const addText = (o: TextOpts, x: number, y: number, parent: THREE.Object3D = page) => {
    const t = makeText(o);
    t.mesh.position.set(x, y, 0.002);
    parent.add(t.mesh);
    return t;
  };

  /* ---- 0. blank ---- */
  const blankText = addText({ text: copy.blank, font: sans, size: 0.2, weight: 500, color: "rgba(60,64,75,0.55)", align: "center", anchor: [0.5, 0.5] }, 0, 0);

  /* ---- 1. idea: sticky note and a light bulb ---- */
  const ideaGroup = new THREE.Group();
  page.add(ideaGroup);
  const ideaFades: Fade[] = [];
  {
    const shadow = createPanel({ w: 2.9, h: 2.3, radius: 0.25, top: BLACK, opacity: 0.22, soft: 0.25 });
    shadow.mesh.position.set(0.02, -0.1, 0);
    const note = createPanel({ w: 2.4, h: 1.8, radius: 0.05, top: new THREE.Color("#fef08a"), bottom: new THREE.Color("#fcd34d") });
    ideaGroup.add(shadow.mesh, note.mesh);
    const title = addText({ text: copy.ideaTitle, font: sans, size: 0.25, weight: 700, color: "#7c4a03" }, -1.0, 0.62, ideaGroup);
    const body = addText({ text: copy.ideaNote, font: sans, size: 0.16, weight: 500, color: "#5b3a05", maxWidth: 2.05, lineHeight: 1.4, anchor: [0, 0] }, -1.0, 0.36, ideaGroup);
    ideaFades.push(fadePanel(shadow), fadePanel(note), fadeText(title), fadeText(body));
  }
  const bulbTexture = canvasTexture(1.5, 1.5, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h * 0.44;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    g.addColorStop(0, "rgba(253,224,71,0.55)");
    g.addColorStop(1, "rgba(253,224,71,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(250,204,21,0.95)";
    ctx.lineWidth = 0.035 * S;
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const ang = -Math.PI / 2 + (i - 3) * 0.42; // rays fan out over the top of the bulb
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 0.36 * S, cy + Math.sin(ang) * 0.36 * S);
      ctx.lineTo(cx + Math.cos(ang) * 0.5 * S, cy + Math.sin(ang) * 0.5 * S);
      ctx.stroke();
    }
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.arc(cx, cy, 0.25 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a8a29e";
    roundRect(ctx, cx - 0.12 * S, cy + 0.22 * S, 0.24 * S, 0.1 * S, 0.03 * S);
    ctx.fill();
    roundRect(ctx, cx - 0.09 * S, cy + 0.33 * S, 0.18 * S, 0.07 * S, 0.03 * S);
    ctx.fill();
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 0.025 * S;
    ctx.beginPath();
    ctx.moveTo(cx - 0.08 * S, cy + 0.2 * S);
    ctx.lineTo(cx - 0.05 * S, cy - 0.02 * S);
    ctx.lineTo(cx, cy + 0.06 * S);
    ctx.lineTo(cx + 0.05 * S, cy - 0.02 * S);
    ctx.lineTo(cx + 0.08 * S, cy + 0.2 * S);
    ctx.stroke();
  });
  const bulb = spriteMesh(1.5, 1.5, bulbTexture, 0);
  bulb.position.set(0.95, 1.12, 0.01);
  ideaGroup.add(bulb);
  ideaFades.push(fadeMesh(bulb));
  ideaGroup.rotation.z = -0.045;

  /* ---- 2. requirements: checklist ---- */
  const REQ = { w: 3.5, h: 2.7, x: 1.6, y: 0.05 };
  const reqCard = createLiveCard(REQ.w, REQ.h, page, REQ.x, REQ.y, 0.003);
  const drawReq = (ctx: CanvasRenderingContext2D, w: number, h: number, p: number) => {
    roundRect(ctx, 2, 2, w - 4, h - 4, 0.14 * S);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(15,23,42,0.14)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `700 ${0.25 * S}px ${sans}`;
    ctx.fillStyle = "#0f172a";
    ctx.fillText(copy.reqTitle, 0.3 * S, 0.4 * S);
    ctx.fillStyle = "rgba(34,211,238,0.9)";
    roundRect(ctx, 0.3 * S, 0.62 * S, 0.5 * S, 0.05 * S, 0.025 * S);
    ctx.fill();
    copy.reqItems.slice(0, 4).forEach((item, i) => {
      const y = (0.98 + i * 0.5) * S;
      const t = easeOut(seg(p, 0.3 + i * 0.16, 0.5 + i * 0.16));
      const bx = 0.3 * S;
      const bs = 0.27 * S;
      roundRect(ctx, bx, y - bs / 2, bs, bs, 0.07 * S);
      if (t > 0) {
        ctx.fillStyle = `rgba(34,197,94,${t})`;
        ctx.fill();
      }
      ctx.strokeStyle = t > 0.5 ? "rgba(34,197,94,1)" : "rgba(100,116,139,0.7)";
      ctx.lineWidth = 0.025 * S;
      ctx.stroke();
      if (t > 0.05) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 0.04 * S;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(bx + bs * 0.24, y);
        ctx.lineTo(bx + bs * 0.44, y + bs * 0.2);
        ctx.lineTo(bx + bs * 0.78, y - bs * 0.2);
        ctx.stroke();
      }
      ctx.font = `500 ${0.18 * S}px ${sans}`;
      ctx.fillStyle = t > 0.5 ? "#334155" : "#64748b";
      ctx.fillText(fitText(ctx, item, w - 1.0 * S), 0.72 * S, y);
    });
  };

  /* ---- 3. prototype: wireframe ---- */
  const wireTexture = canvasTexture(VIEW_W, VIEW_H, (ctx) => {
    const X = (x: number) => (x + VIEW_W / 2) * S;
    const Y = (y: number) => (VIEW_H / 2 - y) * S;
    const line = "#9aa1ae";
    const fill = "#d5d9e1";
    const box = (cx: number, cy: number, bw: number, bh: number, r = 0.08, dashed = true) => {
      roundRect(ctx, X(cx - bw / 2), Y(cy + bh / 2), bw * S, bh * S, r * S);
      ctx.setLineDash(dashed ? [0.09 * S, 0.07 * S] : []);
      ctx.strokeStyle = line;
      ctx.lineWidth = 0.025 * S;
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const bar = (x: number, cy: number, bw: number, bh: number) => {
      roundRect(ctx, X(x), Y(cy + bh / 2), bw * S, bh * S, (bh / 2) * S);
      ctx.fillStyle = fill;
      ctx.fill();
    };
    const marker = (n: number, x: number, y: number) => {
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(X(x), Y(y), 0.12 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `700 ${0.14 * S}px ${sans}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(n), X(x), Y(y) + 1);
    };
    // header
    box(X0 + 0.55, 1.78, 1.1, 0.3);
    [0, 1, 2, 3].forEach((i) => bar(0.9 + i * 0.66, 1.78, 0.5, 0.07));
    // hero copy
    bar(X0, 1.12, 3.1, 0.2);
    bar(X0, 0.8, 2.0, 0.2);
    bar(X0, 0.3, 3.0, 0.09);
    bar(X0, 0.1, 2.4, 0.09);
    box(X0 + 0.75, -0.86, 1.5, 0.46, 0.23);
    bar(X0 + 0.35, -0.86, 0.8, 0.08);
    // hero image
    ctx.fillStyle = "rgba(213,217,225,0.45)";
    roundRect(ctx, X(0.8), Y(1.3), 2.8 * S, 3.0 * S, 0.2 * S);
    ctx.fill();
    box(2.2, -0.2, 2.8, 3.0, 0.2, false);
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.02 * S;
    ctx.beginPath();
    ctx.moveTo(X(0.9), Y(1.2));
    ctx.lineTo(X(3.5), Y(-1.6));
    ctx.moveTo(X(3.5), Y(1.2));
    ctx.lineTo(X(0.9), Y(-1.6));
    ctx.stroke();
    // cards
    [0, 1, 2].forEach((i) => {
      const cx = X0 + 0.565 + i * 1.25;
      box(cx, -1.63, 1.13, 0.58, 0.14);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(X(cx - 0.36), Y(-1.5), 0.07 * S, 0, Math.PI * 2);
      ctx.fill();
      bar(cx - 0.44, -1.76, 0.6, 0.07);
    });
    marker(1, X0 + 1.25, 1.92);
    marker(2, X0 + 3.3, 1.1);
    marker(3, X0 + 1.75, -0.86);
    marker(4, 3.55, 1.2);
  });
  const wire = spriteMesh(VIEW_W, VIEW_H, wireTexture, 0);
  wire.position.set(0, 0, 0.002);
  wire.visible = false;
  page.add(wire);

  /* ---- 4. design: the finished brand page ---- */
  const logoDot = circleMesh(0.1, accentFrom);
  logoDot.position.set(X0 + 0.1, 1.78, 0.002);
  page.add(logoDot);
  const logoText = addText({ text: copy.brand, font: sans, size: 0.19, weight: 700, color: "#fff" }, X0 + 0.3, 1.78);
  const navTexts: TextObj[] = [];
  {
    const widths = copy.links.map((text) => {
      const t = makeText({ text, font: sans, size: 0.15, weight: 500, color: "rgba(255,255,255,0.7)" });
      navTexts.push(t);
      return t.w;
    });
    let x = 3.45 - widths.reduce((a, b) => a + b, 0) - 0.3 * (widths.length - 1);
    navTexts.forEach((t, i) => {
      t.mesh.position.set(x, 1.78, 0.002);
      page.add(t.mesh);
      x += widths[i] + 0.3;
    });
  }
  const styledTitle = addText({ text: copy.styledTitle, font: sans, size: 0.42, weight: 700, gradient: ["#ffffff", rgba(opts.accent.glow)], maxWidth: 3.7, lineHeight: 1.12, anchor: [0, 0] }, X0, 1.3);
  const styledBody = addText({ text: copy.styledBody, font: sans, size: 0.17, color: "rgba(255,255,255,0.62)", maxWidth: 3.2, lineHeight: 1.45, anchor: [0, 0] }, X0, 0.18);

  const btnText = makeText({ text: copy.styledButton, font: sans, size: 0.17, weight: 600, color: "#fff", anchor: [0.5, 0.5] });
  const BTN = { x: 0, y: -0.86, w: Math.max(btnText.w + 0.6, 1.5), h: 0.46 };
  BTN.x = X0 + BTN.w / 2;
  const btn = createPanel({ w: BTN.w, h: BTN.h, radius: 0.3, top: accentFrom, bottom: accentTo });
  btn.mesh.position.set(BTN.x, BTN.y, 0.003);
  btn.mesh.visible = false;
  page.add(btn.mesh);
  btnText.mesh.position.set(BTN.x, BTN.y, 0.004);
  ordered(btnText.mesh); // created before the pill (to size it), so lift it above
  page.add(btnText.mesh);

  // hero visual: a latte cup on a brand-coloured card
  const HERO = { x: 2.2, y: -0.2, w: 2.8, h: 3.0 };
  const hero = createPanel({ w: HERO.w, h: HERO.h, radius: 0.36, top: accentTo.clone().multiplyScalar(0.85), bottom: new THREE.Color("#150c0e"), border: 0.015, borderColor: WHITE, borderOpacity: 0.16 });
  hero.mesh.position.set(HERO.x, HERO.y, 0.002);
  hero.mesh.visible = false;
  page.add(hero.mesh);
  const heroGroup = new THREE.Group();
  heroGroup.position.set(HERO.x, HERO.y + 0.12, 0.003);
  page.add(heroGroup);
  const cupParts: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>[] = [];
  (
    [
      ["#e6d9cc", 0.98, 1, 0, 0],
      ["#f8f3ec", 0.8, 1, 0, 0],
      ["#3b2214", 0.66, 1, 0, 0],
      ["#c99a6b", 0.4, 0.85, 0, 0.02],
      ["#ecd0ad", 0.14, 1, -0.2, 0.2],
    ] as const
  ).forEach(([c, r, sy, ox, oy]) => {
    const m = circleMesh(r, c);
    m.scale.y = sy;
    m.position.set(ox, oy, 0);
    m.visible = false;
    heroGroup.add(m);
    cupParts.push(m);
  });

  // three menu cards: skeleton bars while the API loads, real prices once the database answers
  const MENU_W = 1.13;
  const MENU_H = 0.58;
  const cards = copy.cards.slice(0, 3).map((label, i) => {
    const cx = X0 + MENU_W / 2 + i * (MENU_W + 0.12);
    const cy = -1.63;
    const panel = createPanel({ w: MENU_W, h: MENU_H, radius: 0.16, top: new THREE.Color("#22222d"), bottom: new THREE.Color("#16161e"), opacity: 0, border: 0.012, borderColor: WHITE, borderOpacity: 0 });
    panel.mesh.position.set(cx, cy, 0.002);
    panel.mesh.visible = false;
    page.add(panel.mesh);
    const icon = circleMesh(0.075, i === 1 ? accentGlow : accentFrom);
    icon.position.set(cx - MENU_W / 2 + 0.2, cy + 0.12, 0.003);
    page.add(icon);
    const text = addText({ text: label, font: sans, size: 0.14, weight: 600, color: "#fff" }, cx - MENU_W / 2 + 0.14, cy - 0.13);
    const price = addText({ text: PRICES[i] ?? "", font: sans, size: 0.14, weight: 700, color: rgba(opts.accent.glow), align: "right", anchor: [1, 0.5] }, cx + MENU_W / 2 - 0.13, cy + 0.12);
    const skeleton = createPanel({ w: 0.38, h: 0.075, radius: 0.04, top: WHITE, opacity: 0.2 });
    skeleton.mesh.position.set(cx + MENU_W / 2 - 0.32, cy + 0.12, 0.003);
    skeleton.mesh.visible = false;
    page.add(skeleton.mesh);
    return { panel, icon, text, price, skeleton, cx, cy };
  });

  // order notification from the backend
  const TOAST = { x: 2.3, y: 1.52 };
  const toastPanel = createPanel({ w: 2.2, h: 0.3, radius: 0.15, top: new THREE.Color("#0f2a1f"), bottom: new THREE.Color("#0a1d15"), opacity: 0, border: 0.014, borderColor: GREEN, borderOpacity: 0 });
  toastPanel.mesh.position.set(TOAST.x, TOAST.y, 0.005);
  toastPanel.mesh.visible = false;
  page.add(toastPanel.mesh);
  const toastDot = circleMesh(0.05, GREEN);
  toastDot.position.set(TOAST.x - 0.9, TOAST.y, 0.006);
  page.add(toastDot);
  const toastText = addText({ text: copy.orderToast, font: sans, size: 0.14, weight: 600, color: "#d1fae5" }, TOAST.x - 0.78, TOAST.y);
  toastText.mesh.position.z = 0.006;

  // "tested" badge on the hero card
  const shield = circleMesh(0.18, GREEN);
  shield.position.set(3.35, 1.18, 0.006);
  page.add(shield);
  const shieldCheck = addText({ text: "✓", font: sans, size: 0.22, weight: 800, color: "#052e1a", align: "center", anchor: [0.5, 0.5] }, 3.35, 1.18);
  shieldCheck.mesh.position.z = 0.007;

  /* ----------------------------------------------------------------------------------------------
   * Floating satellites around the window
   * ------------------------------------------------------------------------------------------- */

  /* backend: API log (top-left) */
  const TERM = { w: 2.7, h: 1.2, x: -3.3, y: WIN_H / 2 + 0.8 };
  const termCard = createLiveCard(TERM.w, TERM.h, tilt, TERM.x, TERM.y, 0.5);
  const API_LOG: [string, string, string][] = [
    ["GET", "/api/menu", "200"],
    ["POST", "/api/orders", "201"],
    ["GET", "/api/orders/42", "200"],
    ["PUT", "/api/cart", "200"],
    ["GET", "/api/menu/2", "200"],
  ];
  const METHOD_COLOR: Record<string, string> = { GET: "#60a5fa", POST: "#34d399", PUT: "#fbbf24" };
  const drawTerm = (ctx: CanvasRenderingContext2D, w: number, h: number, count: number, frac: number) => {
    cardBackground(ctx, w, h, "rgba(10,13,20,0.97)", "rgba(96,165,250,0.4)");
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc((0.24 + i * 0.16) * S, 0.22 * S, 0.045 * S, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";
    ctx.font = `600 ${0.12 * S}px ${mono}`;
    ctx.fillStyle = "rgba(96,165,250,0.9)";
    ctx.fillText("api", w - 0.22 * S, 0.22 * S);
    ctx.textAlign = "left";
    ctx.font = `500 ${0.125 * S}px ${mono}`;
    for (let row = 0; row < 4; row++) {
      const n = count - 3 + row;
      if (n < 0) continue;
      const [method, path, status] = API_LOG[n % API_LOG.length];
      const a = row === 3 ? clamp01(frac * 3) : 1;
      const y = (0.5 + row * 0.2) * S;
      ctx.globalAlpha = a * (0.55 + row * 0.15);
      ctx.fillStyle = METHOD_COLOR[method];
      ctx.fillText(method, 0.24 * S, y);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(path, 0.84 * S, y);
      ctx.fillStyle = "#34d399";
      ctx.fillText(status, 2.2 * S, y);
    }
    ctx.globalAlpha = 1;
  };

  /* database: table (bottom-left) */
  const DB = { w: 2.3, h: 1.3, x: -2.95, y: -WIN_H / 2 - 0.55 };
  const dbCard = createLiveCard(DB.w, DB.h, tilt, DB.x, DB.y, 0.5);
  const drawDb = (ctx: CanvasRenderingContext2D, w: number, h: number, p: number, hi: number) => {
    cardBackground(ctx, w, h, "rgba(18,12,24,0.97)", "rgba(232,121,249,0.4)");
    // cylinder
    const cx = 0.5 * S;
    const top = 0.4 * S;
    const rx = 0.3 * S;
    const ry = 0.1 * S;
    const ch = 0.55 * S;
    ctx.strokeStyle = "#e879f9";
    ctx.fillStyle = "rgba(232,121,249,0.16)";
    ctx.lineWidth = 0.03 * S;
    ctx.beginPath();
    ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
    ctx.moveTo(cx - rx, top);
    ctx.lineTo(cx - rx, top + ch);
    ctx.ellipse(cx, top + ch, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, top);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, top + ch / 2, rx, ry, 0, 0, Math.PI);
    ctx.stroke();
    // rows
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `600 ${0.12 * S}px ${mono}`;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("menu", 1.0 * S, 0.24 * S);
    copy.cards.slice(0, 3).forEach((name, i) => {
      const y = (0.54 + i * 0.25) * S;
      ctx.globalAlpha = easeOut(seg(p, 0.2 + i * 0.2, 0.5 + i * 0.2));
      if (hi === i) {
        ctx.fillStyle = "rgba(232,121,249,0.2)";
        roundRect(ctx, 0.92 * S, y - 0.11 * S, w - 1.12 * S, 0.22 * S, 0.06 * S);
        ctx.fill();
      }
      ctx.font = `500 ${0.125 * S}px ${sans}`;
      ctx.fillStyle = "#f5f5f5";
      ctx.textAlign = "left";
      ctx.fillText(fitText(ctx, name, 0.8 * S), 1.0 * S, y);
      ctx.font = `600 ${0.125 * S}px ${mono}`;
      ctx.fillStyle = "#f0abfc";
      ctx.textAlign = "right";
      ctx.fillText(PRICES[i] ?? "", w - 0.22 * S, y);
    });
    ctx.globalAlpha = 1;
  };

  /* testing: suite (bottom-centre) */
  const TEST = { w: 2.45, h: 1.5, x: 0.15, y: -WIN_H / 2 - 0.65 };
  const testCard = createLiveCard(TEST.w, TEST.h, tilt, TEST.x, TEST.y, 0.5);
  const TEST_TOTAL = 42;
  const drawTests = (ctx: CanvasRenderingContext2D, w: number, h: number, p: number) => {
    cardBackground(ctx, w, h, "rgba(14,20,12,0.97)", "rgba(163,230,53,0.4)");
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `600 ${0.15 * S}px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(copy.testsTitle, 0.22 * S, 0.26 * S);
    const count = Math.round(TEST_TOTAL * easeOut(p));
    ctx.textAlign = "right";
    ctx.font = `700 ${0.17 * S}px ${mono}`;
    ctx.fillStyle = "#a3e635";
    ctx.fillText(`${count}/${TEST_TOTAL}`, w - 0.22 * S, 0.26 * S);
    const bx = 0.22 * S;
    const bw = w - 0.44 * S;
    roundRect(ctx, bx, 0.43 * S, bw, 0.07 * S, 0.035 * S);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    if (p > 0.01) {
      roundRect(ctx, bx, 0.43 * S, Math.max(0.07 * S, bw * easeOut(p)), 0.07 * S, 0.035 * S);
      ctx.fillStyle = "#a3e635";
      ctx.fill();
    }
    ctx.textAlign = "left";
    copy.tests.slice(0, 4).forEach((name, i) => {
      const y = (0.7 + i * 0.22) * S;
      const t = seg(p, 0.1 + i * 0.2, 0.3 + i * 0.2);
      if (t >= 1) {
        ctx.fillStyle = "#a3e635";
        ctx.beginPath();
        ctx.arc(0.3 * S, y, 0.07 * S, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1a2e05";
        ctx.lineWidth = 0.025 * S;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(0.265 * S, y);
        ctx.lineTo(0.295 * S, y + 0.03 * S);
        ctx.lineTo(0.34 * S, y - 0.03 * S);
        ctx.stroke();
      } else {
        const spin = performance.now() / 160;
        ctx.strokeStyle = t > 0 ? "#a3e635" : "rgba(255,255,255,0.3)";
        ctx.lineWidth = 0.025 * S;
        ctx.beginPath();
        ctx.arc(0.3 * S, y, 0.065 * S, t > 0 ? spin : 0, t > 0 ? spin + Math.PI * 1.4 : Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = `500 ${0.13 * S}px ${sans}`;
      ctx.fillStyle = t >= 1 ? "#e5e7eb" : "rgba(255,255,255,0.5)";
      ctx.fillText(fitText(ctx, name, w - 0.35 * S - 0.7 * S), 0.46 * S, y);
      if (t >= 1) {
        ctx.textAlign = "right";
        ctx.font = `500 ${0.11 * S}px ${sans}`;
        ctx.fillStyle = "rgba(163,230,53,0.8)";
        ctx.fillText(copy.passed, w - 0.22 * S, y);
        ctx.textAlign = "left";
      }
    });
  };

  /* seo: search result (top-centre) */
  const SEARCH = { w: 3.4, h: 0.95, x: 0.1, y: WIN_H / 2 + 0.8 };
  const searchTexture = canvasTexture(SEARCH.w, SEARCH.h, (ctx, w, h) => {
    cardBackground(ctx, w, h, "rgba(21,21,28,0.97)");
    ctx.fillStyle = rgba(opts.accent.from);
    ctx.beginPath();
    ctx.arc(0.3 * S, 0.27 * S, 0.1 * S, 0, Math.PI * 2);
    ctx.fill();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `500 ${0.14 * S}px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("brewandco.com", 0.5 * S, 0.27 * S);
    ctx.font = `600 ${0.17 * S}px ${sans}`;
    ctx.fillStyle = "#8ab4f8";
    ctx.fillText(fitText(ctx, copy.searchTitle, w - 0.56 * S), 0.28 * S, 0.54 * S);
    ctx.font = `400 ${0.14 * S}px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(fitText(ctx, copy.searchSnippet, w - 0.56 * S), 0.28 * S, 0.77 * S);
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, rgba(opts.accent.from));
    g.addColorStop(1, rgba(opts.accent.to));
    ctx.fillStyle = g;
    roundRect(ctx, w - 0.82 * S, 0.14 * S, 0.58 * S, 0.27 * S, 0.135 * S);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `700 ${0.16 * S}px ${sans}`;
    ctx.fillText("#1", w - 0.53 * S, 0.275 * S);
  });
  const searchCard = spriteMesh(SEARCH.w, SEARCH.h, searchTexture, 0);
  searchCard.position.set(SEARCH.x, SEARCH.y, 0.5);
  searchCard.visible = false;
  tilt.add(searchCard);

  /* seo: analytics (bottom-right) */
  const STATS = { w: 2.5, h: 1.5, x: 3.3, y: -WIN_H / 2 - 0.65 };
  const statsCard = createLiveCard(STATS.w, STATS.h, tilt, STATS.x, STATS.y, 0.5);
  const BARS = 14;
  const barShape = Array.from({ length: BARS }, (_, i) => 0.3 + 0.7 * Math.pow(i / (BARS - 1), 1.5) * (0.8 + 0.2 * Math.sin(i * 1.9)));
  const drawStats = (ctx: CanvasRenderingContext2D, w: number, h: number, count: number, s: number, time: number) => {
    cardBackground(ctx, w, h, "rgba(21,21,28,0.97)");
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `500 ${0.15 * S}px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(copy.visitors, 0.22 * S, 0.27 * S);
    ctx.font = `700 ${0.42 * S}px ${sans}`;
    ctx.fillStyle = "#fff";
    ctx.fillText(Math.round(count).toLocaleString(), 0.22 * S, 0.66 * S);
    if (s > 0.02) {
      ctx.textAlign = "right";
      ctx.font = `600 ${0.15 * S}px ${sans}`;
      ctx.fillStyle = `rgba(52,211,153,${clamp01(s * 1.5)})`;
      ctx.fillText(`▲ +${Math.round(312 * easeOut(s))}%`, w - 0.22 * S, 0.27 * S);
    }
    const x0 = 0.22 * S;
    const areaW = w - 0.44 * S;
    const base = h - 0.2 * S;
    const maxH = 0.42 * S;
    const bw = areaW / BARS;
    for (let i = 0; i < BARS; i++) {
      const grow = easeOut(seg(s, i * 0.03, 0.45 + i * 0.03));
      const wiggle = s >= 1 ? 0.035 * Math.sin(time * 2.2 + i * 0.9) : 0;
      const bh = Math.max(0.03 * S, (0.1 + (barShape[i] - 0.1) * grow + wiggle) * maxH);
      const g = ctx.createLinearGradient(0, base - bh, 0, base);
      g.addColorStop(0, s > 0.02 ? rgba(opts.accent.from) : "rgba(255,255,255,0.28)");
      g.addColorStop(1, s > 0.02 ? rgba(opts.accent.to, 0.55) : "rgba(255,255,255,0.12)");
      ctx.fillStyle = g;
      roundRect(ctx, x0 + i * bw + bw * 0.14, base - bh, bw * 0.72, bh, bw * 0.2);
      ctx.fill();
    }
  };

  /* ---- data packets: API -> page and database -> page ---- */
  const makeStream = (from: THREE.Vector3, to: THREE.Vector3, count: number, color: THREE.Color) => {
    const points = makePoints(count, 0.2);
    tilt.add(points);
    const seeds = Array.from({ length: count }, () => ({ speed: 0.3 + Math.random() * 0.25, phase: Math.random(), bend: (Math.random() - 0.5) * 0.9 }));
    return {
      update(strength: number, t: number) {
        const pos = points.geometry.getAttribute("position") as THREE.BufferAttribute;
        const col = points.geometry.getAttribute("color") as THREE.BufferAttribute;
        const active = reduced ? 0 : Math.round(strength * count);
        for (let i = 0; i < count; i++) {
          if (i >= active) {
            col.setXYZ(i, 0, 0, 0);
            continue;
          }
          const sd = seeds[i];
          const u = (t * sd.speed + sd.phase) % 1;
          const wob = Math.sin(u * Math.PI) * sd.bend;
          pos.setXYZ(i, lerp(from.x, to.x, u) + wob * 0.6, lerp(from.y, to.y, u) + wob, lerp(from.z, to.z, u));
          const a = Math.sin(u * Math.PI);
          col.setXYZ(i, color.r * a, color.g * a, color.b * a);
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
      },
    };
  };
  const pageCenter = new THREE.Vector3(0, VIEW_Y + 0.2, 0.45);
  const apiStream = makeStream(new THREE.Vector3(TERM.x, TERM.y - 0.4, 0.5), pageCenter, 16, new THREE.Color("#60a5fa"));
  const dbStream = makeStream(new THREE.Vector3(DB.x, DB.y + 0.4, 0.5), pageCenter, 16, new THREE.Color("#e879f9"));

  /* ---- visitors (SEO) ---- */
  const visitors = makePoints(VISITORS, 0.3);
  tilt.add(visitors);
  type Visitor = { sx: number; sy: number; sz: number; cx: number; cy: number; ex: number; ey: number; speed: number; phase: number; prev: number };
  const swarm: Visitor[] = Array.from({ length: VISITORS }, () => {
    const a = Math.random() * Math.PI * 2;
    const r = 5.2 + Math.random() * 2.4;
    const sx = Math.cos(a) * r * 1.3;
    const sy = Math.sin(a) * r * 0.85 - 0.3;
    const ex = (Math.random() - 0.5) * 3.4;
    const ey = (Math.random() - 0.5) * 2.2 - 0.3;
    const bend = (Math.random() - 0.5) * 2.4;
    return {
      sx,
      sy,
      sz: 0.6 + Math.random() * 0.6,
      cx: (sx + ex) / 2 + -(sy - ey) * 0.12 * bend,
      cy: (sy + ey) / 2 + (sx - ex) * 0.12 * bend,
      ex,
      ey,
      speed: 0.16 + Math.random() * 0.14,
      phase: Math.random(),
      prev: 0,
    };
  });

  /* ---- burst (applied feedback) ---- */
  const BURST = 56;
  const burstPoints = makePoints(BURST, 0.2);
  root.add(burstPoints);
  const burstVel = new Float32Array(BURST * 3);
  let burstLife = 0;
  const burstColor = new THREE.Color();
  const startBurst = (color: THREE.Color) => {
    win.getWorldPosition(burstPoints.position);
    burstPoints.position.z += 0.8;
    burstColor.copy(color).lerp(WHITE, 0.25);
    const pos = burstPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < BURST; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 3.2;
      pos.setXYZ(i, 0, 0, 0);
      burstVel[i * 3] = Math.cos(a) * sp;
      burstVel[i * 3 + 1] = Math.sin(a) * sp * 0.8;
      burstVel[i * 3 + 2] = 0;
    }
    pos.needsUpdate = true;
    burstLife = reduced ? 0 : 1;
  };

  /* ---- drop hint ---- */
  const hintGroup = new THREE.Group();
  hintGroup.position.set(0, 1.45, 0.7);
  tilt.add(hintGroup);
  const hintText = makeText({ text: copy.dropHint, font: sans, size: 0.2, weight: 600, color: "#fff", anchor: [0.5, 0.5] });
  const hintPill = createPanel({ w: hintText.w + 0.7, h: 0.54, radius: 0.27, top: accentFrom, bottom: accentTo, opacity: 0 });
  hintGroup.add(hintPill.mesh, hintText.mesh);
  ordered(hintText.mesh); // the text was created first (to size the pill), so lift it above the pill

  /* ----------------------------------------------------------------------------------------------
   * Roadmap: a deck of step cards (the next step in front, the following ones peeking out behind)
   * and a progress rail of nine nodes that fills as steps are applied
   * ------------------------------------------------------------------------------------------- */

  const drawGlyph = (ctx: CanvasRenderingContext2D, kind: ToolKind, cx: number, cy: number, R: number) => {
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    ctx.lineWidth = R * 0.13;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(cx + x1 * R, cy + y1 * R);
      ctx.lineTo(cx + x2 * R, cy + y2 * R);
      ctx.stroke();
    };
    const star = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    };
    switch (kind) {
      case "idea":
        ctx.beginPath();
        ctx.arc(cx, cy - R * 0.14, R * 0.36, 0, Math.PI * 2);
        ctx.stroke();
        line(-0.15, 0.3, 0.15, 0.3);
        line(-0.1, 0.46, 0.1, 0.46);
        break;
      case "requirements":
        [-0.34, 0, 0.34].forEach((y) => {
          ctx.beginPath();
          ctx.arc(cx - R * 0.36, cy + y * R, R * 0.06, 0, Math.PI * 2);
          ctx.fill();
          line(-0.16, y, 0.46, y);
        });
        break;
      case "prototype":
        roundRect(ctx, cx - R * 0.48, cy - R * 0.42, R * 0.96, R * 0.84, R * 0.12);
        ctx.stroke();
        line(-0.48, -0.12, 0.48, -0.12);
        line(-0.12, -0.12, -0.12, 0.42);
        break;
      case "design":
        star(cx - R * 0.08, cy + R * 0.08, R * 0.5);
        star(cx + R * 0.42, cy - R * 0.4, R * 0.2);
        break;
      case "backend":
        roundRect(ctx, cx - R * 0.46, cy - R * 0.46, R * 0.92, R * 0.36, R * 0.1);
        ctx.stroke();
        roundRect(ctx, cx - R * 0.46, cy + R * 0.1, R * 0.92, R * 0.36, R * 0.1);
        ctx.stroke();
        [-0.28, 0.28].forEach((y) => {
          ctx.beginPath();
          ctx.arc(cx + R * 0.28, cy + y * R, R * 0.05, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      case "database":
        ctx.beginPath();
        ctx.ellipse(cx, cy - R * 0.32, R * 0.42, R * 0.16, 0, 0, Math.PI * 2);
        ctx.moveTo(cx - R * 0.42, cy - R * 0.32);
        ctx.lineTo(cx - R * 0.42, cy + R * 0.32);
        ctx.ellipse(cx, cy + R * 0.32, R * 0.42, R * 0.16, 0, Math.PI, 0, true);
        ctx.lineTo(cx + R * 0.42, cy - R * 0.32);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * 0.42, R * 0.16, 0, 0, Math.PI);
        ctx.stroke();
        break;
      case "testing":
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.46, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - R * 0.2, cy);
        ctx.lineTo(cx - R * 0.04, cy + R * 0.17);
        ctx.lineTo(cx + R * 0.24, cy - R * 0.16);
        ctx.stroke();
        break;
      case "deploy":
        line(0, 0.5, 0, -0.48);
        ctx.beginPath();
        ctx.moveTo(cx - R * 0.36, cy - R * 0.12);
        ctx.lineTo(cx, cy - R * 0.5);
        ctx.lineTo(cx + R * 0.36, cy - R * 0.12);
        ctx.stroke();
        break;
      case "seo":
        ctx.beginPath();
        ctx.arc(cx - R * 0.08, cy - R * 0.08, R * 0.34, 0, Math.PI * 2);
        ctx.moveTo(cx + R * 0.17, cy + R * 0.17);
        ctx.lineTo(cx + R * 0.5, cy + R * 0.5);
        ctx.stroke();
        break;
    }
    ctx.restore();
  };

  const hexA = (hex: string, a: number) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const tint = (kind: ToolKind | null, a: number) => {
    const hex = kind ? toolHex[kind] : "#34d399";
    return hex ? hexA(hex, a) : rgba(opts.accent.from, a);
  };
  const N = TOOL_KINDS.length;

  const drawCheck = (ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) => {
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = R * 0.16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.3, cy);
    ctx.lineTo(cx - R * 0.06, cy + R * 0.26);
    ctx.lineTo(cx + R * 0.34, cy - R * 0.22);
    ctx.stroke();
    ctx.restore();
  };

  const cardTexture = (index: number) =>
    canvasTexture(CARD_W, CARD_H, (ctx, w, h) => {
      const kind = (TOOL_KINDS[index] ?? null) as ToolKind | null;
      const glow = ctx.createRadialGradient(0.5 * S, 0.4 * S, 0, 0.5 * S, 0.4 * S, 2.4 * S);
      glow.addColorStop(0, tint(kind, 0.3));
      glow.addColorStop(1, tint(kind, 0));
      ctx.fillStyle = glow;
      roundRect(ctx, 0, 0, w, h, 0.26 * S);
      ctx.fill();

      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = `700 ${0.15 * S}px ${mono}`;
      ctx.fillStyle = tint(kind, 1);
      ctx.fillText(kind ? `${copy.step.toUpperCase()} ${String(index + 1).padStart(2, "0")}` : `${N}/${N}`, 0.28 * S, 0.3 * S);
      if (kind) {
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText(`${index + 1}/${N}`, w - 0.3 * S, 0.3 * S);
        ctx.textAlign = "left";
      }

      // icon orb
      const cx = 0.66 * S;
      const cy = 1.0 * S;
      const R = 0.34 * S;
      const orb = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.9);
      orb.addColorStop(0, tint(kind, 0.4));
      orb.addColorStop(1, tint(kind, 0));
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.9, 0, Math.PI * 2);
      ctx.fill();
      const fill = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      fill.addColorStop(0, tint(kind, 1));
      fill.addColorStop(1, kind === "design" ? rgba(opts.accent.to) : tint(kind, 0.7));
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      if (kind) drawGlyph(ctx, kind, cx, cy, R);
      else drawCheck(ctx, cx, cy, R);

      // title, shrunk to fit
      const title = kind ? copy.tools[kind] : copy.doneTitle;
      const maxW = (CARD_W - 1.2 - 0.62) * S;
      let size = 0.34 * S;
      ctx.font = `700 ${size}px ${sans}`;
      while (ctx.measureText(title).width > maxW && size > 0.2 * S) {
        size -= 2;
        ctx.font = `700 ${size}px ${sans}`;
      }
      ctx.fillStyle = "#fff";
      ctx.fillText(title, 1.2 * S, 0.84 * S);

      // one-line explanation
      const hint = kind ? copy.hints[kind] : copy.doneHint;
      measure.font = `500 ${0.155 * S}px ${sans}`;
      const lines = wrapLine(hint, 1.5 * S).slice(0, 2);
      ctx.font = `500 ${0.155 * S}px ${sans}`;
      ctx.fillStyle = "rgba(255,255,255,0.62)";
      lines.forEach((l, i) => ctx.fillText(l, 1.2 * S, (1.14 + i * 0.22) * S));

      if (kind) {
        ctx.font = `600 ${0.125 * S}px ${sans}`;
        ctx.fillStyle = tint(kind, 0.95);
        ctx.fillText(`→ ${copy.dragHint}`, 0.28 * S, 1.72 * S);
      }
    });

  const nodeTexture = (kind: ToolKind) =>
    canvasTexture(NODE_D, NODE_D, (ctx, w, h) => {
      const R = w * 0.34;
      const g = ctx.createLinearGradient(w / 2 - R, h / 2 - R, w / 2 + R, h / 2 + R);
      g.addColorStop(0, tint(kind, 1));
      g.addColorStop(1, kind === "design" ? rgba(opts.accent.to) : tint(kind, 0.7));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, R, 0, Math.PI * 2);
      ctx.fill();
      drawGlyph(ctx, kind, w / 2, h / 2, R);
    });

  const ringTexture = canvasTexture(1, 1, (ctx, w, h) => {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.022 * S;
    ctx.lineCap = "round";
    ctx.setLineDash([0.1 * S, 0.075 * S]);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 0.44 * S, 0, Math.PI * 2);
    ctx.stroke();
  });

  const chevronTexture = canvasTexture(0.3, 0.3, (ctx, w, h) => {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 0.035 * S;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(w * 0.36, h * 0.24);
    ctx.lineTo(w * 0.64, h * 0.5);
    ctx.lineTo(w * 0.36, h * 0.76);
    ctx.stroke();
  });

  const statusTextures = {
    grip: canvasTexture(0.5, 0.5, (ctx, w, h) => {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 2; c++) {
          ctx.beginPath();
          ctx.arc(w / 2 + (c - 0.5) * 0.12 * S, h / 2 + (r - 1) * 0.12 * S, 0.028 * S, 0, Math.PI * 2);
          ctx.fill();
        }
    }),
    check: canvasTexture(0.5, 0.5, (ctx, w, h) => {
      ctx.fillStyle = "rgba(52,211,153,1)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 0.17 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#06281c";
      ctx.lineWidth = 0.045 * S;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 0.075 * S, h / 2);
      ctx.lineTo(w / 2 - 0.012 * S, h / 2 + 0.07 * S);
      ctx.lineTo(w / 2 + 0.085 * S, h / 2 - 0.065 * S);
      ctx.stroke();
    }),
  };

  /* progress rail */
  const railTrack = createPanel({ w: 0.06, h: 1, radius: 0.03, top: WHITE, opacity: 0.12 });
  root.add(railTrack.mesh);
  const railFill = createPanel({ w: 0.06, h: 1, radius: 0.03, top: accentGlow, bottom: accentFrom, opacity: 1 });
  root.add(railFill.mesh);
  const railSpark = makePoints(1, 0.34);
  root.add(railSpark);
  const nodeGlow = createPanel({ w: NODE_D + 0.9, h: NODE_D + 0.9, radius: NODE_D / 2 + 0.45, top: accentFrom, opacity: 0, soft: 0.45 });
  root.add(nodeGlow.mesh);
  type RailNode = { kind: ToolKind; group: THREE.Group; ring: Panel; icon: TextMesh; check: TextMesh; home: THREE.Vector3; scale: number; alpha: number };
  const nodes: RailNode[] = TOOL_KINDS.map((kind) => {
    const group = new THREE.Group();
    root.add(group);
    const ring = createPanel({ w: NODE_D, h: NODE_D, radius: NODE_D / 2, top: new THREE.Color("#262633"), bottom: new THREE.Color("#15151d"), border: 0.03, borderColor: toolColor[kind], borderOpacity: 0.9 });
    const icon = spriteMesh(NODE_D, NODE_D, nodeTexture(kind), 1);
    icon.position.z = 0.001;
    const check = spriteMesh(0.36, 0.36, statusTextures.check, 0);
    check.position.set(NODE_D * 0.36, -NODE_D * 0.36, 0.002);
    group.add(ring.mesh, icon, check);
    return { kind, group, ring, icon, check, home: new THREE.Vector3(), scale: 1, alpha: 0.4 };
  });

  /* drag feedback: ghost of the empty slot, energy tether, hint chevrons, ripple on the page */
  const ghost = createPanel({ w: CARD_W, h: CARD_H, radius: 0.26, opacity: 0, border: 0.02, borderColor: WHITE, borderOpacity: 0 });
  root.add(ghost.mesh);
  const TETHER = 18;
  const tether = makePoints(TETHER, 0.22);
  root.add(tether);
  const chevrons = [0, 1, 2].map(() => {
    const m = spriteMesh(0.24, 0.24, chevronTexture, 0);
    m.visible = false;
    root.add(m);
    return m;
  });
  const ripple = createPanel({ w: WIN_W, h: WIN_H, radius: 0.28, opacity: 0, border: 0.04, borderColor: WHITE, borderOpacity: 0 });
  ripple.mesh.visible = false;
  win.add(ripple.mesh);
  let rippleT = 1;

  /* the cards (one per step, plus a final "launched" card) */
  const chips: Chip[] = Array.from({ length: N + 1 }, (_, i) => {
    const kind = (TOOL_KINDS[i] ?? null) as ToolKind | null;
    const color = kind ? toolColor[kind] : GREEN;
    const group = new THREE.Group();
    root.add(group);
    const halo = createPanel({ w: CARD_W + 0.9, h: CARD_H + 0.9, radius: 0.26 + 0.45, top: color, opacity: 0, soft: 0.45 });
    const bg = createPanel({ w: CARD_W, h: CARD_H, radius: 0.26, top: new THREE.Color("#272734"), bottom: new THREE.Color("#14141c"), border: 0.024, borderColor: color, borderOpacity: 0.7 });
    const face = spriteMesh(CARD_W, CARD_H, cardTexture(i), 1);
    face.position.z = 0.001;
    const orbit = spriteMesh(0.95, 0.95, ringTexture, 0);
    orbit.material.color.copy(color);
    orbit.position.set(-CARD_W / 2 + 0.66, CARD_H / 2 - 1.0, 0.002);
    const grip = spriteMesh(0.5, 0.5, statusTextures.grip, 0);
    grip.position.set(CARD_W / 2 - 0.24, CARD_H / 2 - 1.0, 0.002);
    group.add(halo.mesh, bg.mesh, face, orbit, grip);
    return {
      kind,
      index: i,
      group,
      bg,
      halo,
      face,
      orbit,
      grip,
      color,
      state: "idle",
      done: false,
      flyT: 0,
      flyFrom: new THREE.Vector3(),
      alpha: Math.max(0, 1 - 0.42 * i),
      scale: 1,
      glow: 0,
      unlock: i === 0 ? 1 : 0,
      depth: Math.min(3.5, i),
      phase: i * 1.3,
    };
  });

  /* ----------------------------------------------------------------------------------------------
   * Layout (landscape: rail + deck on the left; portrait: rail + deck underneath the page)
   * ------------------------------------------------------------------------------------------- */

  let width = 1;
  let height = 1;
  let landscape = true;
  let cardScale = 1;
  let nodeScale = 1;
  let railLen = 1;
  const slot = new THREE.Vector3();
  const railStart = new THREE.Vector3();
  const railDir = new THREE.Vector3(0, -1, 0);
  const tiltBase = new THREE.Vector3();
  const applied: ToolKind[] = [];
  const projected = new THREE.Vector3();

  /** The draggable card sits in `slot`; tell the page which part of the stage must capture touch. */
  const emitTouch = () => {
    const chip = chips[applied.length];
    if (!chip || !chip.kind) {
      opts.onTouchRect(null);
      return;
    }
    camera.updateMatrixWorld();
    const hw = (CARD_W * cardScale) / 2 + 0.1;
    const hh = (CARD_H * cardScale) / 2 + 0.1;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [dx, dy] of [
      [-hw, -hh],
      [hw, -hh],
      [hw, hh],
      [-hw, hh],
    ]) {
      projected.set(slot.x + dx, slot.y + dy, 0).project(camera);
      minX = Math.min(minX, projected.x);
      maxX = Math.max(maxX, projected.x);
      minY = Math.min(minY, projected.y);
      maxY = Math.max(maxY, projected.y);
    }
    opts.onTouchRect({ left: (minX + 1) / 2, top: (1 - maxY) / 2, width: (maxX - minX) / 2, height: (maxY - minY) / 2 });
  };

  const layout = () => {
    const aspect = width / height;
    landscape = aspect >= 1.2;
    let b: { minX: number; maxX: number; minY: number; maxY: number };
    let railStep: number;
    if (landscape) {
      cardScale = 1;
      nodeScale = 1;
      slot.set(-4.3, 0, 0);
      tiltBase.set(2.0, 0, 0);
      railStart.set(-6.85, 2.72, 0);
      railDir.set(0, -1, 0);
      railStep = 0.68;
      b = { minX: -7.2, maxX: 6.7, minY: -3.95, maxY: 3.95 };
    } else {
      cardScale = 1.45;
      nodeScale = 1.12;
      slot.set(0, -5.65, 0);
      tiltBase.set(0, 0.8, 0);
      railStart.set(-3.6, -3.55, 0);
      railDir.set(1, 0, 0);
      railStep = 0.9;
      b = { minX: -4.8, maxX: 4.8, minY: -7.95, maxY: 4.7 };
    }
    railLen = railStep * (N - 1);
    nodes.forEach((n, i) => n.home.copy(railStart).addScaledVector(railDir, i * railStep));
    ghost.mesh.position.copy(slot);
    ghost.mesh.scale.set(CARD_W * cardScale, CARD_H * cardScale, 1);
    tilt.position.copy(tiltBase);
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const needW = (b.maxX - b.minX) * 1.05;
    const needH = (b.maxY - b.minY) * 1.06;
    const dist = Math.max(needH / (2 * half), needW / (2 * half * aspect));
    camera.position.set((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2, dist);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    emitTouch();
  };

  let firstLayout = true;
  const resize = () => {
    const r = host.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    layout();
    if (firstLayout) {
      chips.forEach((c) => c.group.position.set(slot.x, slot.y - 0.32 * cardScale * c.depth, 0));
      firstLayout = false;
    }
    scene.updateMatrixWorld(true);
  };

  /** Front cards draw over the ones behind them; the card being dragged or flown draws over everything. */
  const setCardOrder = (chip: Chip, base: number) => chip.group.children.forEach((o, i) => (o.renderOrder = base + i));
  const setDeckOrder = () => {
    const current = applied.length;
    chips.forEach((c) => setCardOrder(c, 1000 + (12 - Math.min(12, Math.max(0, c.done ? 0 : c.index - current))) * 10));
  };
  setDeckOrder();

  /* ----------------------------------------------------------------------------------------------
   * State
   * ------------------------------------------------------------------------------------------- */

  const target = Object.fromEntries(TOOL_KINDS.map((k) => [k, false])) as Record<ToolKind, boolean>;
  const prog = Object.fromEntries(TOOL_KINDS.map((k) => [k, 0])) as Record<ToolKind, number>;
  const prev = { ...prog };
  const duration: Record<ToolKind, number> = { idea: 1.0, requirements: 1.8, prototype: 1.2, design: 1.5, backend: 1.2, database: 1.5, testing: 2.2, deploy: 1.1, seo: 1.7 };
  let lastApplied: ToolKind | null = null;
  let seoTime = 0;
  let backendClock = 0;
  let pop = 0;
  let ping = 0;
  let hoverAmt = 0;
  let dragAmt = 0;
  let finale = 0;
  let time = 0;
  let statsClock = 0;
  let lastCount = -1;
  let railFillT = 0;
  let focusKind: ToolKind | null = null;
  let hoverChip: Chip | null = null;

  const emit = () => opts.onChange([...applied], lastApplied);
  const changed = (k: ToolKind) => prog[k] !== prev[k];

  const commit = (kind: ToolKind) => {
    if (applied.includes(kind)) return;
    applied.push(kind);
    lastApplied = kind;
    target[kind] = true;
    pop = 1;
    startBurst(toolColor[kind]);
    ripple.u.uBorderColor.value.copy(toolColor[kind]);
    rippleT = reduced ? 1 : 0;
    const next = chips[applied.length];
    if (next) next.unlock = 1;
    if (applied.length === N) finale = 1;
    setDeckOrder();
    emit();
    emitTouch();
  };

  const beginFly = (chip: Chip) => {
    if (!chip.kind || chip.done || chip.state === "fly" || chip.index !== applied.length || chips.some((c) => c.state === "fly")) return;
    chip.state = "fly";
    chip.flyT = 0;
    chip.flyFrom.copy(chip.group.position);
    setCardOrder(chip, 3000);
  };

  /* ----------------------------------------------------------------------------------------------
   * Pointer interaction
   * ------------------------------------------------------------------------------------------- */

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.3);
  const tmp = new THREE.Vector3();
  let drag: Drag | null = null;
  let parX = 0;
  let parY = 0;
  let parTX = 0;
  let parTY = 0;

  const setNdc = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };

  /** Only the next step in the roadmap can be picked up. */
  const pickChip = () => {
    const chip = chips[applied.length];
    if (!chip || !chip.kind || chip.done || chip.state !== "idle") return null;
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(chip.bg.mesh, false).length ? chip : null;
  };

  const overWindow = () => {
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(frame.mesh, false).length > 0;
  };

  const planePoint = (out: THREE.Vector3) => {
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(dragPlane, out);
  };

  const onDown = (e: PointerEvent) => {
    if (drag || (e.pointerType === "mouse" && e.button !== 0)) return;
    setNdc(e);
    scene.updateMatrixWorld(true);
    const chip = pickChip();
    if (!chip) return;
    e.preventDefault();
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already gone */
    }
    const hit = planePoint(tmp);
    const k = hit ? (camera.position.z - 1.3) / camera.position.z : 1;
    drag = {
      chip,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      offset: new THREE.Vector2((chip.group.position.x - (hit?.x ?? 0)) * k, (chip.group.position.y - (hit?.y ?? 0)) * k),
      target: chip.group.position.clone(),
      overWindow: false,
    };
    setCardOrder(chip, 3000);
    host.style.cursor = "grabbing";
  };

  const onMove = (e: PointerEvent) => {
    setNdc(e);
    parTX = ndc.x;
    parTY = ndc.y;
    if (drag) {
      if (e.pointerId !== drag.pointerId) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) drag.moved = true;
      const p = planePoint(tmp);
      if (p) drag.target.set(p.x + drag.offset.x, p.y + drag.offset.y, 1.3);
      drag.overWindow = drag.moved && overWindow();
      return;
    }
    if (e.pointerType === "mouse") {
      scene.updateMatrixWorld(true);
      hoverChip = pickChip();
      host.style.cursor = hoverChip ? "grab" : "";
    }
  };

  const endDrag = (e: PointerEvent, cancelled: boolean) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    try {
      host.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    host.style.cursor = "";
    if (!cancelled && (!d.moved || d.overWindow)) beginFly(d.chip);
    else setDeckOrder();
  };

  const onUp = (e: PointerEvent) => endDrag(e, false);
  const onCancel = (e: PointerEvent) => endDrag(e, true);
  const onLeave = () => {
    parTX = 0;
    parTY = 0;
    hoverChip = null;
    if (!drag) host.style.cursor = "";
  };

  const abort = new AbortController();
  const sig = { signal: abort.signal };
  host.addEventListener("pointerdown", onDown, sig);
  host.addEventListener("pointermove", onMove, sig);
  host.addEventListener("pointerup", onUp, sig);
  host.addEventListener("pointercancel", onCancel, sig);
  host.addEventListener("pointerleave", onLeave, sig);
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), sig);

  /* ----------------------------------------------------------------------------------------------
   * Per-frame updates
   * ------------------------------------------------------------------------------------------- */

  const E = (k: ToolKind, a: number, b: number) => easeInOut(seg(prog[k], a, b));
  const setO = (t: TextObj, o: number) => fadeText(t)(o);

  const updateState = (dt: number) => {
    TOOL_KINDS.forEach((k) => {
      prev[k] = prog[k];
      const d = reduced ? 1 : dt / duration[k];
      prog[k] = clamp01(prog[k] + (target[k] ? d : -d * 2));
    });
    pop = damp(pop, 0, reduced ? 20 : 4.5, dt);
    ping = damp(ping, 0, 6, dt);
    finale = damp(finale, 0, 1.4, dt);
    hoverAmt = damp(hoverAmt, drag?.overWindow ? 1 : 0, 14, dt);
    dragAmt = damp(dragAmt, drag?.moved ? 1 : 0, 8, dt);
    seoTime = target.seo && prog.seo > 0.2 ? seoTime + dt : 0;
    backendClock = target.backend && prog.backend > 0.3 ? backendClock + dt : 0;
  };

  const updatePage = (dt: number) => {
    /* page background: light paper until the design is applied */
    const bgE = E("design", 0, 0.55);
    pageBg.u.uTop.value.lerpColors(LIGHT_TOP, DARK_TOP, bgE);
    pageBg.u.uBottom.value.lerpColors(LIGHT_BOTTOM, DARK_BOTTOM, bgE);
    fadeMesh(designBlob, 0.4)(E("design", 0.3, 1));

    /* 0-2: blank, idea, requirements */
    setO(blankText, 1 - E("idea", 0, 0.3));
    const leave = 1 - E("prototype", 0, 0.4);
    const reqE = E("requirements", 0, 0.7);
    const ideaA = E("idea", 0, 0.5) * leave;
    ideaFades.forEach((f) => f(ideaA));
    const ideaPop = prog.idea > 0 ? easeOutBack(seg(prog.idea, 0, 0.7)) : 0;
    ideaGroup.scale.setScalar(Math.max(0.0001, ideaPop * lerp(1, 0.84, reqE)));
    ideaGroup.position.set(lerp(0.15, -1.95, reqE), 0.05, 0.002);
    bulb.rotation.z = reduced ? 0 : Math.sin(time * 1.7) * 0.07;

    const reqA = E("requirements", 0, 0.4) * leave;
    reqCard.alpha(reqA);
    reqCard.mesh.scale.setScalar(0.88 + 0.12 * (prog.requirements > 0 ? easeOutBack(seg(prog.requirements, 0, 0.5)) : 0));
    reqCard.tick(dt, changed("requirements"), 0, (ctx, w, h) => drawReq(ctx, w, h, prog.requirements));

    /* 3: wireframe */
    const wireA = E("prototype", 0, 0.6) * (1 - E("design", 0, 0.4));
    fadeMesh(wire)(wireA);
    wire.position.y = (1 - E("prototype", 0, 0.7)) * -0.15;

    /* 4: the finished page */
    const d = prog.design;
    const logoE = E("design", 0.3, 0.7);
    setO(logoText, logoE);
    fadeMesh(logoDot)(logoE);
    navTexts.forEach((t, i) => setO(t, easeOut(seg(d, 0.36 + i * 0.05, 0.78 + i * 0.05))));
    const tE = easeOut(seg(d, 0.35, 0.8));
    setO(styledTitle, tE);
    styledTitle.mesh.position.y = 1.3 - (1 - tE) * 0.25;
    const bE = easeOut(seg(d, 0.45, 0.9));
    setO(styledBody, bE);
    styledBody.mesh.position.y = 0.18 - (1 - bE) * 0.2;

    const btnE = seg(d, 0.45, 0.95);
    const btnS = btnE > 0 ? Math.max(0.0001, easeOutBack(btnE)) : 0.0001;
    btn.mesh.visible = btnE > 0.002;
    btn.mesh.scale.set(BTN.w * btnS, BTN.h * btnS, 1);
    setO(btnText, easeInOut(seg(d, 0.55, 0.9)));

    const hE = seg(d, 0.35, 1);
    const hs = hE > 0 ? easeOutBack(hE) : 0;
    hero.mesh.visible = hE > 0.002;
    hero.u.uOpacity.value = clamp01(hE * 3);
    hero.u.uBorderOpacity.value = 0.16 * clamp01(hE * 3);
    hero.mesh.scale.set(HERO.w * hs, HERO.h * hs, 1);
    heroGroup.scale.setScalar(Math.max(0.0001, hs));
    heroGroup.rotation.z = reduced ? 0 : Math.sin(time * 0.6) * 0.04;
    cupParts.forEach((m) => {
      m.material.opacity = clamp01(hE * 2.5);
      m.visible = hE > 0.002;
    });

    /* menu cards: skeleton (backend) -> prices (database) */
    const skel = E("backend", 0.3, 0.8) * (1 - E("database", 0.3, 0.7));
    const priceE = E("database", 0.35, 0.9);
    cards.forEach((c, i) => {
      const e = easeOut(seg(d, 0.55 + i * 0.08, 0.95 + i * 0.05));
      const lift = (1 - e) * 0.3;
      c.panel.u.uOpacity.value = e;
      c.panel.u.uBorderOpacity.value = 0.12 * e;
      c.panel.mesh.visible = e > 0.004;
      c.panel.mesh.position.y = c.cy - lift;
      fadeMesh(c.icon)(e);
      c.icon.position.y = c.cy + 0.12 - lift;
      setO(c.text, e);
      c.text.mesh.position.y = c.cy - 0.13 - lift;
      const shimmer = reduced ? 1 : 0.6 + 0.4 * Math.sin(time * 4 + i * 1.3);
      c.skeleton.u.uOpacity.value = 0.2 * e * skel * shimmer;
      c.skeleton.mesh.visible = e * skel > 0.004;
      c.skeleton.mesh.position.y = c.cy + 0.12 - lift;
      fadeText(c.price)(e * priceE);
      c.price.mesh.position.y = c.cy + 0.12 - lift + (1 - priceE) * -0.06;
    });

    /* backend: order notification that comes and goes */
    const bk = E("backend", 0.5, 1);
    let toast = 0;
    if (bk > 0) {
      const t = reduced ? 1.5 : (time + 1) % 5.5;
      toast = smoothstep(0, 0.4, t) * (1 - smoothstep(3, 3.5, t));
    }
    const toastA = toast * bk;
    toastPanel.u.uOpacity.value = toastA;
    toastPanel.u.uBorderOpacity.value = 0.6 * toastA;
    toastPanel.mesh.visible = toastA > 0.004;
    fadeMesh(toastDot)(toastA);
    fadeText(toastText)(toastA);
    const ty = TOAST.y + (1 - toast) * 0.18;
    toastPanel.mesh.position.y = ty;
    toastDot.position.y = ty;
    toastText.mesh.position.y = ty;

    /* testing: verified badge */
    const sh = seg(prog.testing, 0.6, 1);
    const shS = sh > 0 ? Math.max(0.0001, easeOutBack(sh)) : 0.0001;
    shield.scale.setScalar(shS);
    shield.material.opacity = sh > 0 ? 1 : 0;
    shield.visible = sh > 0.002;
    shieldCheck.mesh.scale.setScalar(shS);
    fadeText(shieldCheck)(sh > 0 ? 1 : 0);
  };

  const setCard = (card: LiveCard, e: number, baseY: number) => {
    card.alpha(e);
    card.mesh.scale.setScalar(0.9 + 0.1 * easeOut(e));
    card.mesh.position.y = baseY + (1 - easeOut(e)) * 0.3 + (reduced ? 0 : Math.sin(time * 0.9 + baseY) * 0.035 * e);
  };

  const updateSatellites = (dt: number) => {
    /* backend: API log + packets */
    const bE = easeOut(seg(prog.backend, 0, 0.5));
    setCard(termCard, bE, TERM.y);
    const logCount = Math.floor(prog.backend * 3) + Math.floor(backendClock / 0.9);
    termCard.tick(dt, bE > 0 && target.backend, 0.1, (ctx, w, h) => drawTerm(ctx, w, h, logCount, (backendClock / 0.9) % 1));
    apiStream.update(E("backend", 0.3, 1), time);

    /* database: table + packets */
    const dE = easeOut(seg(prog.database, 0, 0.5));
    setCard(dbCard, dE, DB.y);
    const hi = prog.database >= 1 && !reduced ? Math.floor(time / 1.1) % 3 : -1;
    dbCard.tick(dt, dE > 0 && (changed("database") || hi >= 0), 0.12, (ctx, w, h) => drawDb(ctx, w, h, prog.database, hi));
    dbStream.update(E("database", 0.3, 1), time + 0.4);

    /* testing: suite */
    const tE = easeOut(seg(prog.testing, 0, 0.3));
    setCard(testCard, tE, TEST.y);
    testCard.tick(dt, tE > 0 && prog.testing < 1, 0.05, (ctx, w, h) => drawTests(ctx, w, h, prog.testing));
    if (prev.testing < 1 && prog.testing >= 1) testCard.dirty = true;
  };

  const updateDeploy = (dt: number) => {
    const p = prog.deploy;
    const e = easeInOut(seg(p, 0, 0.7));
    fadeMesh(urlOffMesh)(1 - easeInOut(seg(p, 0, 0.45)));
    fadeMesh(urlOnMesh)(easeInOut(seg(p, 0.35, 0.85)));
    pill.u.uBorderOpacity.value = 0.65 * e;
    setO(badgeOff, 1 - easeInOut(seg(p, 0, 0.4)));
    setO(badgeOn, easeInOut(seg(p, 0.4, 0.9)));
    badgeDot.material.color.lerpColors(RED, GREEN, easeInOut(seg(p, 0.2, 0.8)));
    badgeDot.scale.setScalar(p >= 1 && !reduced ? 1 + 0.25 * Math.sin(time * 3.2) : 1);

    const gs = seg(p, 0.15, 1);
    globe.scale.setScalar(Math.max(0.0001, easeOutBack(gs)));
    globeLinesMat.opacity = 0.42 * gs;
    (globeNodes.material as THREE.PointsMaterial).opacity = gs;
    globeLines.visible = globeNodes.visible = gs > 0.004;
    globeRing.u.uBorderOpacity.value = 0.3 * gs;
    globeRing.mesh.visible = gs > 0.004;
    if (!reduced) globeSpin.rotation.y += dt * 0.4;

    pulses.forEach((pl, i) => {
      if (p < 1 || reduced) {
        pl.u.uBorderOpacity.value = 0;
        pl.mesh.visible = false;
        return;
      }
      const ph = ((time + i * 1.3) % 2.6) / 2.6;
      const k = 1 + 0.22 * easeOut(ph);
      pl.mesh.visible = true;
      pl.resize(WIN_W * k, WIN_H * k);
      pl.u.uRadius.value = 0.28 * k;
      pl.u.uBorderOpacity.value = 0.55 * (1 - ph) * (1 - ph);
    });
  };

  const updateSeo = (dt: number) => {
    const s = prog.seo;
    const e = easeInOut(seg(s, 0, 0.6));
    searchCard.material.opacity = e;
    searchCard.visible = e > 0.004;
    searchCard.position.y = SEARCH.y + (1 - easeOut(seg(s, 0, 0.6))) * 0.5 + (reduced ? 0 : Math.sin(time * 0.9) * 0.04 * e);
    statsCard.mesh.material.opacity = 0.6 + 0.4 * e;
    statsCard.mesh.visible = true;

    const active = Math.round(s * VISITORS);
    const pos = visitors.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = visitors.geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < VISITORS; i++) {
      const v = swarm[i];
      if (i >= active) {
        col.setXYZ(i, 0, 0, 0);
        v.prev = 0;
        continue;
      }
      const u = reduced ? 0.55 + (i % 7) * 0.05 : (time * v.speed + v.phase) % 1;
      if (u < v.prev) ping = Math.min(1, ping + 0.12);
      v.prev = u;
      const t = easeIn(u) * 0.9 + u * 0.1;
      const it = 1 - t;
      pos.setXYZ(i, it * it * v.sx + 2 * it * t * v.cx + t * t * v.ex, it * it * v.sy + 2 * it * t * v.cy + t * t * v.ey, lerp(v.sz, 0.45, t));
      const a = Math.min(1, u * 5) * (1 - smoothstep(0.82, 1, u));
      col.setXYZ(i, a, 0.78 * a, 0.3 * a);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;

    const count = 18 + 1100 * easeOut(s) + seoTime * 47;
    const shown = Math.round(count);
    statsClock += dt;
    if (statsClock > 0.07 && (shown !== lastCount || (s >= 1 && !reduced))) {
      statsClock = 0;
      lastCount = shown;
      statsCard.dirty = true;
    }
    statsCard.tick(dt, false, 0, (ctx, w, h) => drawStats(ctx, w, h, count, s, time));
  };

  const updateWindow = (dt: number) => {
    rippleT = Math.min(1, rippleT + dt / 0.9);
    ripple.mesh.visible = rippleT < 1 && !reduced;
    if (ripple.mesh.visible) {
      const k = 1 + 0.28 * easeOut(rippleT);
      ripple.resize(WIN_W * k, WIN_H * k);
      ripple.u.uRadius.value = 0.28 * k;
      ripple.u.uBorderOpacity.value = 0.9 * (1 - rippleT) * (1 - rippleT);
    }
    const live = prog.deploy;
    const base = Math.max(0.28 * live, 0.18 * dragAmt, 0.8 * hoverAmt);
    halo.u.uOpacity.value = clamp01(base + 0.35 * pop + 0.18 * ping + 0.25 * finale);
    halo.u.uTop.value.copy(accentFrom).lerp(GREEN, live * (1 - hoverAmt) * 0.8);
    frame.u.uBorderColor.value.copy(WHITE).lerp(accentFrom, hoverAmt);
    frame.u.uBorderOpacity.value = 0.14 + 0.75 * hoverAmt;
    frame.u.uBorder.value = 0.02 + 0.02 * hoverAmt;

    win.scale.setScalar(1 + 0.04 * pop);
    if (!reduced) {
      parX = damp(parX, parTX, 4, dt);
      parY = damp(parY, parTY, 4, dt);
      tilt.rotation.y = parX * 0.13 + Math.sin(time * 0.4) * 0.025;
      tilt.rotation.x = -parY * 0.09 + Math.cos(time * 0.33) * 0.015;
      tilt.position.y = tiltBase.y + Math.sin(time * 0.7) * 0.05;
    } else {
      tilt.rotation.set(0, 0, 0);
      tilt.position.copy(tiltBase);
    }

    const hintO = damp(hintPill.u.uOpacity.value, hoverAmt, 14, dt);
    hintPill.u.uOpacity.value = hintO;
    hintPill.mesh.visible = hintText.mesh.visible = hintO > 0.01;
    hintText.mesh.material.opacity = hintO;
    hintGroup.scale.setScalar(0.85 + 0.15 * hintO);
  };

  const winCenter = new THREE.Vector3();
  const nudge = new THREE.Vector3();
  const tFrom = new THREE.Vector3();
  const tMid = new THREE.Vector3();
  const tCtrl = new THREE.Vector3();
  let chevHint = 0;

  const updateDeck = (dt: number) => {
    win.getWorldPosition(winCenter);
    winCenter.z += 1.2;
    const current = applied.length;
    const flying = chips.some((c) => c.state === "fly");
    nudge.set(landscape ? 1 : 0, landscape ? 0 : 1, 0);

    chips.forEach((chip) => {
      const g = chip.group;
      const dragging = drag?.chip === chip;
      const isNext = chip.index === current && !chip.done;
      const dTarget = chip.done ? 0 : Math.min(3.5, chip.index - current);
      chip.depth = damp(chip.depth, dTarget, reduced ? 60 : 7, dt);
      const front = clamp01(1 - chip.depth);
      const alphaT = chip.done ? 0 : Math.max(0, 1 - 0.42 * dTarget);
      let scaleT = 1 - 0.06 * chip.depth;
      let glowT = isNext ? 0.4 : 0;

      if (chip.state === "fly") {
        chip.flyT += dt / (reduced ? 0.05 : 0.42);
        const t = clamp01(chip.flyT);
        const e = easeInOut(t);
        g.position.lerpVectors(chip.flyFrom, winCenter, e);
        chip.scale = lerp(1.1, 0.35, e);
        chip.alpha = 1 - easeIn(t);
        g.rotation.set(0, 0, 0);
        if (t >= 1) {
          chip.state = "idle";
          chip.done = true;
          chip.alpha = 0;
          chip.depth = 0;
          chip.scale = 1;
          g.position.copy(slot);
          if (chip.kind) commit(chip.kind);
        }
      } else {
        const hovered = (chip === hoverChip || (chip.kind !== null && focusKind === chip.kind)) && isNext && !!chip.kind;
        if (dragging) {
          scaleT = 1.08;
          glowT = 0.9;
        } else if (hovered) {
          scaleT = 1.03;
          glowT = 0.65;
        }
        scaleT += 0.14 * chip.unlock;
        const attention = isNext && chip.kind && !dragging && !reduced ? Math.sin(time * 1.6 + chip.phase) * 0.05 : 0;
        const behind = -0.32 * cardScale * Math.min(3, chip.depth);
        const tx = dragging ? drag!.target.x : slot.x + nudge.x * attention;
        const ty = dragging ? drag!.target.y : slot.y + behind + nudge.y * attention;
        const tz = dragging ? drag!.target.z : 0;
        const rate = dragging ? 24 : 12;
        const px = g.position.x;
        const py = g.position.y;
        g.position.x = damp(px, tx, rate, dt);
        g.position.y = damp(py, ty, rate, dt);
        g.position.z = damp(g.position.z, tz, rate, dt);
        const vx = (g.position.x - px) / Math.max(dt, 1e-3);
        const vy = (g.position.y - py) / Math.max(dt, 1e-3);
        g.rotation.z = damp(g.rotation.z, reduced ? 0 : THREE.MathUtils.clamp(-vx * 0.02, -0.25, 0.25), 10, dt);
        g.rotation.y = damp(g.rotation.y, reduced ? 0 : THREE.MathUtils.clamp(vx * 0.015, -0.3, 0.3), 10, dt);
        g.rotation.x = damp(g.rotation.x, reduced ? 0 : THREE.MathUtils.clamp(-vy * 0.012, -0.25, 0.25), 10, dt);
        chip.scale = damp(chip.scale, scaleT, 14, dt);
        chip.alpha = damp(chip.alpha, alphaT, 8, dt);
      }
      chip.unlock = damp(chip.unlock, 0, 4, dt);
      const pulse = isNext && chip.kind && !reduced && !dragging ? 0.18 * (0.5 + 0.5 * Math.sin(time * 2.4)) : 0;
      chip.glow = damp(chip.glow, chip.done ? 0 : glowT + pulse, 10, dt);

      g.visible = chip.alpha > 0.004;
      g.scale.setScalar(chip.scale * cardScale);
      const lit = front * chip.alpha;
      chip.bg.u.uOpacity.value = chip.alpha;
      chip.bg.u.uBorderOpacity.value = (0.4 + 0.45 * front) * chip.alpha;
      chip.face.material.opacity = chip.alpha * clamp01(1 - chip.depth * 1.7);
      chip.halo.u.uOpacity.value = chip.glow * chip.alpha;
      chip.orbit.material.opacity = chip.kind ? lit * 0.75 : 0;
      chip.grip.material.opacity = chip.kind ? lit : 0;
      if (!reduced) chip.orbit.rotation.z -= dt * 0.55;
    });

    /* ghost of the empty slot + energy tether while a card is being dragged */
    const act = chips[current];
    const live = !!act && !!act.kind && dragAmt > 0.02;
    ghost.u.uBorderOpacity.value = 0.3 * dragAmt;
    ghost.u.uOpacity.value = 0.05 * dragAmt;
    ghost.mesh.visible = dragAmt > 0.01;
    const tpos = tether.geometry.getAttribute("position") as THREE.BufferAttribute;
    const tcol = tether.geometry.getAttribute("color") as THREE.BufferAttribute;
    if (live) {
      tFrom.copy(slot);
      tMid.copy(tFrom).add(act.group.position).multiplyScalar(0.5);
      const dx = act.group.position.x - tFrom.x;
      const dy = act.group.position.y - tFrom.y;
      tCtrl.set(tMid.x - dy * 0.22, tMid.y + dx * 0.22, 0.4);
      for (let i = 0; i < TETHER; i++) {
        const t = i / (TETHER - 1);
        const it = 1 - t;
        tpos.setXYZ(
          i,
          it * it * tFrom.x + 2 * it * t * tCtrl.x + t * t * act.group.position.x,
          it * it * tFrom.y + 2 * it * t * tCtrl.y + t * t * act.group.position.y,
          0.4,
        );
        const f = (0.25 + 0.75 * t) * dragAmt * (reduced ? 0.8 : 0.6 + 0.4 * Math.sin(time * 7 - i * 0.7));
        tcol.setXYZ(i, act.color.r * f, act.color.g * f, act.color.b * f);
      }
    } else {
      for (let i = 0; i < TETHER; i++) tcol.setXYZ(i, 0, 0, 0);
    }
    tpos.needsUpdate = true;
    tcol.needsUpdate = true;

    /* chevrons that point from the card towards the page (landscape only: in portrait the page is above) */
    chevHint = damp(chevHint, landscape && !drag && !flying && !!act && !!act.kind ? 1 : 0, 8, dt);
    chevrons.forEach((m, i) => {
      const wave = reduced ? 0.6 : Math.max(0, Math.sin(time * 3.2 - i * 0.9));
      const o = chevHint * wave * 0.9;
      m.material.opacity = o;
      m.material.color.copy(act?.color ?? WHITE);
      m.visible = o > 0.01;
      m.position.set(slot.x + CARD_W / 2 + 0.2 + i * 0.2, slot.y, 0.05);
    });

    /* progress rail: the fill runs up to the current step, with a spark travelling along it */
    railFillT = damp(railFillT, current >= N ? 1 : current / (N - 1), reduced ? 60 : 3.2, dt);
    const along = railLen * railFillT;
    const horiz = !landscape;
    railTrack.resize(horiz ? railLen : 0.06, horiz ? 0.06 : railLen);
    railTrack.mesh.position.copy(railStart).addScaledVector(railDir, railLen / 2);
    railFill.resize(horiz ? Math.max(0.0001, along) : 0.06, horiz ? 0.06 : Math.max(0.0001, along));
    railFill.mesh.position.copy(railStart).addScaledVector(railDir, along / 2);
    railFill.mesh.visible = along > 0.01;
    const spos = railSpark.geometry.getAttribute("position") as THREE.BufferAttribute;
    const scol = railSpark.geometry.getAttribute("color") as THREE.BufferAttribute;
    if (along > 0.05 && !reduced) {
      const u = (time * 0.45) % 1;
      spos.setXYZ(0, railStart.x + railDir.x * along * u, railStart.y + railDir.y * along * u, 0.1);
      const a = Math.sin(u * Math.PI);
      scol.setXYZ(0, 1 * a, 0.9 * a, 0.7 * a);
    } else {
      scol.setXYZ(0, 0, 0, 0);
    }
    spos.needsUpdate = true;
    scol.needsUpdate = true;

    nodes.forEach((n, i) => {
      const isDone = i < current;
      const isCur = i === current;
      n.scale = damp(n.scale, (isCur ? 1.3 : isDone ? 1 : 0.85) * nodeScale, 10, dt);
      n.alpha = damp(n.alpha, isDone || isCur ? 1 : 0.42, 8, dt);
      n.group.position.set(n.home.x, n.home.y, 0.2);
      n.group.scale.setScalar(n.scale);
      n.ring.u.uOpacity.value = n.alpha;
      n.ring.u.uBorderOpacity.value = 0.9 * n.alpha;
      n.icon.material.opacity = n.alpha;
      n.check.material.opacity = damp(n.check.material.opacity, isDone ? 1 : 0, 10, dt);
    });
    const gi = Math.min(current, N - 1);
    const gn = nodes[gi];
    nodeGlow.mesh.position.x = damp(nodeGlow.mesh.position.x, gn.home.x, reduced ? 60 : 9, dt);
    nodeGlow.mesh.position.y = damp(nodeGlow.mesh.position.y, gn.home.y, reduced ? 60 : 9, dt);
    nodeGlow.mesh.position.z = 0.15;
    nodeGlow.resize((NODE_D + 0.9) * nodeScale, (NODE_D + 0.9) * nodeScale);
    nodeGlow.u.uRadius.value = (NODE_D / 2 + 0.45) * nodeScale;
    nodeGlow.u.uTop.value.copy(toolColor[TOOL_KINDS[gi]]);
    nodeGlow.u.uOpacity.value = (current < N ? 0.5 + (reduced ? 0 : 0.2 * Math.sin(time * 2.4)) : 0.3) * (1 + 0.5 * finale);
  };

  const updateBurst = (dt: number) => {
    if (burstLife <= 0) {
      burstPoints.visible = false;
      return;
    }
    burstLife = Math.max(0, burstLife - dt / 0.9);
    burstPoints.visible = true;
    const pos = burstPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
    const col = burstPoints.geometry.getAttribute("color") as THREE.BufferAttribute;
    const f = burstLife * burstLife;
    const drag01 = Math.exp(-2.6 * dt);
    for (let i = 0; i < BURST; i++) {
      burstVel[i * 3] *= drag01;
      burstVel[i * 3 + 1] *= drag01;
      pos.setXYZ(i, pos.getX(i) + burstVel[i * 3] * dt, pos.getY(i) + burstVel[i * 3 + 1] * dt, 0);
      col.setXYZ(i, burstColor.r * f, burstColor.g * f, burstColor.b * f);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  };

  /* ----------------------------------------------------------------------------------------------
   * Loop
   * ------------------------------------------------------------------------------------------- */

  let raf = 0;
  let last = 0;
  let running = false;

  const step = (dt: number) => {
    time += dt;
    updateState(dt);
    updatePage(dt);
    updateSatellites(dt);
    updateDeploy(dt);
    updateSeo(dt);
    updateWindow(dt);
    updateDeck(dt);
    updateBurst(dt);
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    // rAF timestamps can precede the performance.now() used to seed `last`; a negative dt would make the damping diverge
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    step(dt);
    raf = requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  step(0.016);

  const markAllDirty = () => {
    [reqCard, termCard, dbCard, testCard, statsCard].forEach((c) => (c.dirty = true));
  };

  return {
    apply(kind) {
      const chip = chips.find((c) => c.kind === kind);
      if (chip) beginFly(chip);
    },
    reset() {
      TOOL_KINDS.forEach((k) => (target[k] = false));
      applied.length = 0;
      lastApplied = null;
      lastCount = -1;
      finale = 0;
      chips.forEach((c) => {
        c.done = false;
        c.state = "idle";
        c.alpha = 0;
        c.unlock = 0;
      });
      chips[0].unlock = 1;
      setDeckOrder();
      markAllDirty();
      emit();
      emitTouch();
    },
    setActive(active) {
      if (active && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      } else if (!active && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    },
    setReducedMotion(value) {
      reduced = value;
      markAllDirty();
    },
    focusChip(kind) {
      focusKind = kind;
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      abort.abort();
      ro.disconnect();
      host.style.cursor = "";
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
