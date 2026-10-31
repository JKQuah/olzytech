import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "@/components/shared/reveal";

type FaqItem = { question: string; answer: string };

/** Accessible FAQ accordion. The page emits the matching FAQPage JSON-LD (see `faqNode` in lib/structured-data). */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Reveal className="mx-auto w-full max-w-3xl">
      <Accordion type="single" collapsible className="glass rounded-3xl px-6 py-2">
        {items.map((item, i) => (
          <AccordionItem key={item.question} value={`faq-${i}`} className="border-white/10">
            <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-5 text-sm leading-relaxed">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Reveal>
  );
}
