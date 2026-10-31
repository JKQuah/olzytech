import type { ProjectSlug } from "./projects";

/**
 * Client testimonials. The wording lives in the message files (`pricing.testimonials.items.<id>`),
 * keyed by the project slug.
 *
 * IMPORTANT: the current wording is a DRAFT written from what each project delivered, to send to
 * the client for approval. It is not a real quote until the client agrees to it. Until `approved`
 * is true an entry only shows in development (with a "Draft" badge) and is hidden in production,
 * so unapproved reviews can never go live. To publish: get the client's OK (edit the wording to
 * match what they actually said), then set `approved: true`.
 */
export type Testimonial = {
  id: ProjectSlug;
  /** Star rating given by the client, 1-5. Only set this to what the client actually gave. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** True only once the client has approved the wording and rating. */
  approved: boolean;
};

export const testimonials: Testimonial[] = [
  { id: "cashflow", rating: 5, approved: true },
  { id: "sgmathwizard", rating: 5, approved: true },
  { id: "juststayliving", rating: 5, approved: true },
];

/**
 * Production shows approved entries only. Development also shows drafts so the design can be reviewed,
 * and a preview build can opt in with SHOW_DRAFT_TESTIMONIALS=true. Never set that on the live site.
 */
export const showDrafts = process.env.NODE_ENV !== "production" || process.env.SHOW_DRAFT_TESTIMONIALS === "true";

export function visibleTestimonials() {
  return testimonials.filter((t) => t.approved || showDrafts);
}
