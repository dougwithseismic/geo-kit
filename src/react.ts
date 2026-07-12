/**
 * geo-kit React entry — MDX/JSX components. Import from `geo-kit/react`.
 * Requires `react` in the consuming app (declared as a peer dependency).
 *
 * `JsonLd`, `KeyAnswer`, `StatCallout`, `Faq`/`FaqItem` are server-safe. The
 * `AiReferralTracker` is a client component (uses hooks) — in Next.js App
 * Router it carries `"use client"`; import it from a client boundary.
 */

export { JsonLd } from "./components/json-ld";
export { KeyAnswer } from "./components/mdx/key-answer";
export { StatCallout } from "./components/mdx/stat-callout";
export { Faq, FaqItem, extractFaqEntries } from "./components/mdx/faq";
export {
  AiReferralTracker,
  type AiReferralTrackerProps,
} from "./components/ai-referral-tracker";
