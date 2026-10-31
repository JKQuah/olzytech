import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Frosted-glass surface with a coral hairline. Compose cards, panels and hero widgets from this. */
export function GlassCard({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass rounded-3xl", className)} {...props} />;
}
