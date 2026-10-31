import { Fragment } from "react";
import { cn } from "@/lib/utils";

type WordsRiseProps = {
  text: string;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Extra delay per word, in ms. */
  stagger?: number;
  className?: string;
};

/**
 * Splits text into words that rise in sequence on load (pure CSS, no JS).
 * The text stays a normal string of words in the DOM, so SEO and screen readers are unaffected.
 */
export function WordsRise({ text, delay = 0, stagger = 90, className }: WordsRiseProps) {
  return text.split(" ").map((word, i, all) => (
    <Fragment key={`${word}-${i}`}>
      <span className={cn("animate-rise inline-block", className)} style={{ animationDelay: `${delay + i * stagger}ms` }}>
        {word}
      </span>
      {i < all.length - 1 ? " " : null}
    </Fragment>
  ));
}
