/**
 * The nine steps of the demo, in the order they must be applied. Kept in its own file (no three.js
 * import) so the React side can use it without pulling the 3D bundle in.
 */
export const TOOL_KINDS = ["idea", "requirements", "prototype", "design", "backend", "database", "testing", "deploy", "seo"] as const;

export type ToolKind = (typeof TOOL_KINDS)[number];

/** Where the draggable step sits inside the stage, as fractions (0-1) of its width and height. */
export type TouchRect = { left: number; top: number; width: number; height: number };
