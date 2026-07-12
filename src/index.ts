/**
 * geo-kit — importable surface.
 *
 * Pure utilities (config, SEO builders, infra, measurement) import cleanly.
 * The React/MDX components are re-exported here too but require `react` in the
 * consuming app. Markdown assets (`playbook/`, `skills/`, `templates/`) are
 * copied, not imported.
 */

// Config (the parameterization contract)
export * from "./config";

// SEO
export * from "./seo/json-ld";
export * from "./seo/og-image-url";
export * from "./seo/robots";
export * from "./seo/sitemap";

// Feed
export * from "./feed/rss";

// Infra
export * from "./infra/scheduler";
export * from "./infra/indexnow";

// Measurement
export * from "./measurement/gsc";
export * from "./measurement/ai-referral";
export * from "./measurement/ai-bot-telemetry";

// Components (require react in the consuming app)
export { JsonLd } from "./components/json-ld";
export { KeyAnswer } from "./components/mdx/key-answer";
export { StatCallout } from "./components/mdx/stat-callout";
export { Faq, FaqItem, extractFaqEntries } from "./components/mdx/faq";
