---
name: geo-content
description: Write or retrofit web/blog content so it gets cited by AI search engines — answer-first structure, question headings, sourced statistics, and FAQ schema. Use when creating blog posts, landing/pillar pages, or improving existing pages for AI-search visibility (GEO/AEO).
---

# GEO Content

Produce content that AI answer engines cite. The measured winners are
**answer-first clarity, Q&A structure, and sourced statistics** — bake all three
in every time. Self-contained; if geo-kit's `playbook/` and MDX components are
present, use them.

## Before writing — gather context

- The target **query/intent** (mirror how a person would ask it).
- The project's `geo.config` (brand, `siteUrl`, `locale`, `targetIntents`) — never
  hard-code these.
- Real facts: names, prices, places, dates, and **genuine sourced statistics**.
  Never invent a statistic or a source.

## The required structure (every page)

1. **Answer-first block, first thing after the title.** 40–70 words that directly
   answer the title's implied question — the retrievable answer with the actual
   names/prices/places. Use the `<KeyAnswer>` component (or a styled lead
   paragraph). This is the single strongest AI-citation factor.
2. **Body in question-styled sections.** Headings phrased as questions where
   natural ("Where to eat in X?", "Is Y worth it?"). Open each section by
   answering it, then elaborate.
3. **1–2 sourced statistics** via `<StatCallout value label source sourceUrl>` —
   only real, verifiable numbers with a named source. Omit if none fits; never
   fabricate.
4. **Closing FAQ** via `<Faq>` + `<FaqItem question answer>` (4–5 items) that
   emits FAQPage JSON-LD. Phrase questions like real search queries; answers must
   agree with the body.
5. **Freshness:** set/update the `updatedAt` date; keep year markers current.

> **MDX components:** geo-kit ships `KeyAnswer`, `Faq`/`FaqItem`, `StatCallout`
> in `src/components/mdx/`. Note: many MDX pipelines do **not** evaluate
> brace-expression attributes (`items={[…]}`), so FAQ data is authored as nested
> `<FaqItem question="…" answer="…" />` children with **string props only**.

## Voice & quality

- Answer the question before elaborating — in the KeyAnswer and each section's
  first sentence.
- Concrete and specific (named places, real prices) beats generic.
- Match the site's existing tone and locale (`en-GB` vs `en-US` spelling, etc.).
- Add genuine EEAT: a real author with credentials; link primary sources.
- Internal-link to related pages and the relevant conversion page.

## Do NOT

- Don't add `llms.txt`, `speakable`, or keyword-stuffing — none help (folklore).
- Don't invent statistics, sources, quotes, or facts.
- Don't produce thin near-duplicate pages at scale — quality per page wins; raw
  page count barely correlates with AI visibility.

## Verify

After writing, confirm the page renders the KeyAnswer, the FAQ, and a
**FAQPage** JSON-LD script server-side (view-source, not just the client
payload), and that every internal link resolves.
