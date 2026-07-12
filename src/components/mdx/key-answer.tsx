import type { ReactNode } from "react";

/**
 * Answer-first summary block, placed immediately after the title. 40–70 words
 * giving the direct answer to the page's implied question — the single
 * strongest AI-citation factor.
 *
 * Unstyled by design: pass `className` (Tailwind/CSS) to match your design
 * system. The `data-geo` attribute is a styling/analytics hook.
 */
export function KeyAnswer({
  children,
  className,
  label = "In short",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <section className={className} data-geo="key-answer">
      <p data-geo="key-answer-label">{label}</p>
      <div data-geo="key-answer-body">{children}</div>
    </section>
  );
}
