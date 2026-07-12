import { Children, isValidElement, type ReactNode } from "react";
import { JsonLd } from "../json-ld";
import { faqPageSchema, type FaqEntry } from "../../seo/json-ld";

/**
 * One question/answer pair. **String props only** — many MDX pipelines do not
 * evaluate brace-expression attributes, so FAQ data is authored as nested
 * `<FaqItem question="…" answer="…" />` children, not an `items={[…]}` array.
 */
export function FaqItem({ question, answer }: FaqEntry) {
  return (
    <div data-geo="faq-item">
      <dt data-geo="faq-question">{question}</dt>
      <dd data-geo="faq-answer">{answer}</dd>
    </div>
  );
}

/** Collect `FaqItem` children into schema entries. Exported for testing. */
export function extractFaqEntries(children: ReactNode): FaqEntry[] {
  const items: FaqEntry[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement<Partial<FaqEntry>>(child) &&
      typeof child.props.question === "string" &&
      typeof child.props.answer === "string"
    ) {
      items.push({ question: child.props.question, answer: child.props.answer });
    }
  });
  return items;
}

/**
 * Question-and-answer section that renders question-styled entries and emits
 * **FAQPage JSON-LD** (collected from `FaqItem` children). The Q&A format
 * measurably correlates with inclusion in AI answers.
 */
export function Faq({
  children,
  title = "Frequently asked questions",
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  const items = extractFaqEntries(children);
  if (!items.length) return null;
  return (
    <section className={className} data-geo="faq">
      <JsonLd schema={faqPageSchema(items)} />
      <h2 data-geo="faq-title">{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}
