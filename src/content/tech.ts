import {
  siCloudflare,
  siExpress,
  siGraphql,
  siNextdotjs,
  siNodedotjs,
  siReact,
  siTailwindcss,
  siTypescript,
  siVercel,
  siVuedotjs,
} from "simple-icons";

/**
 * Filled brand icons for the technology lists, keyed by the exact (untranslated) name used in the
 * message files. Paths come from Simple Icons (24x24 viewBox). They are drawn with `currentColor`,
 * so they follow the surrounding text colour. Amazon removed AWS from Simple Icons, so AWS uses a
 * generic cloud glyph (see `GENERIC_ICONS`).
 */
export const techIconPaths: Record<string, string> = {
  "Next.js": siNextdotjs.path,
  React: siReact.path,
  "Vue.js": siVuedotjs.path,
  TypeScript: siTypescript.path,
  "Tailwind CSS": siTailwindcss.path,
  "Node.js": siNodedotjs.path,
  Express: siExpress.path,
  GraphQL: siGraphql.path,
  Vercel: siVercel.path,
  Cloudflare: siCloudflare.path,
};

/** Names that use a built-in glyph instead of a brand path. */
export const GENERIC_ICONS: Record<string, "cloud"> = { AWS: "cloud" };
