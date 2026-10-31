import { Reveal } from "@/components/shared/reveal";
import { Section, SectionHeading } from "@/components/shared/section";
import { StackDemo } from "@/components/sections/stack-demo";
import type { Dictionary } from "@/i18n/dictionaries";

/** "How we build": the interactive idea-to-launch demo, with its heading. */
export function StackSection({ dict }: { dict: Dictionary["showcase"]["stack"] }) {
  return (
    <Section>
      <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />
      <Reveal className="mt-12 md:mt-14">
        <StackDemo dict={dict.demo} />
      </Reveal>
    </Section>
  );
}
