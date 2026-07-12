/**
 * geo-kit core — framework-free utilities. Import from `geo-kit`.
 *
 * React/MDX components live in the `geo-kit/react` entry (`src/react.ts`) so
 * server-only consumers never pull in React. Markdown assets (`playbook/`,
 * `skills/`, `templates/`) are copied, not imported.
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

// Measurement (pure)
export * from "./measurement/gsc";
export * from "./measurement/ai-referral";
export * from "./measurement/ai-bot-telemetry";
