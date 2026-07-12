/**
 * geo-kit configuration contract.
 *
 * `GeoConfig` is the single place a consuming project sets everything
 * brand/domain-specific. Every code asset in the kit takes this config (or a
 * typed input derived from it) so nothing else hard-codes a brand or domain.
 *
 * Create your own `geo.config.ts` in your app, typed with `defineGeoConfig`,
 * and pass it to the helpers.
 */

/** A scheduled job for the in-process cron scheduler. */
export interface CronJob {
  /** API endpoint to POST, e.g. "/cron/indexnow-ping". */
  path: string;
  /** Standard 5-field cron expression, interpreted as UTC. */
  cron: string;
}

/** An AI-assistant referrer source for referral attribution. */
export interface AiReferrerSource {
  /** Canonical source id, e.g. "chatgpt". */
  id: string;
  /** Regex matched against `document.referrer`. */
  pattern: RegExp;
}

export interface GeoConfig {
  /** Canonical site URL, no trailing slash, e.g. "https://example.com". */
  siteUrl: string;
  /** Brand / organization name. */
  brandName: string;
  /** One-sentence description for metadata + Organization schema. */
  description: string;
  /** BCP-47 locale, e.g. "en-GB". */
  locale: string;
  /** Organization founder name. */
  founder?: string;
  /** Founding year, e.g. "2024". */
  foundingDate?: string;
  /** Cities/regions served — local entity + areaServed signals. */
  areaServed?: string[];
  /** Topics the brand is authoritative on (schema `knowsAbout`). */
  knowsAbout?: string[];
  /** Social / profile URLs (schema `sameAs`). */
  sameAs?: string[];
  /** Public contact email. */
  contactEmail?: string;
  /** Search intents to win AI citations for (drives content + measurement). */
  targetIntents?: string[];
  /** Default OG image (absolute or site-relative), e.g. "/og-image.jpg". */
  ogImagePath?: string;
  /** IndexNow key; served as `${siteUrl}/${indexNowKey}.txt`. */
  indexNowKey?: string;
  /** AI-assistant referrer sources (defaults to {@link DEFAULT_AI_REFERRER_SOURCES}). */
  aiReferrerSources?: AiReferrerSource[];
  /** AI-bot UA match for server/middleware telemetry (defaults to {@link DEFAULT_AI_BOT_PATTERN}). */
  aiBotUserAgentPattern?: RegExp;
  /** Jobs for the in-process scheduler. */
  cronJobs?: CronJob[];
}

/** Identity helper: type-checks a config literal and gives editor autocomplete. */
export function defineGeoConfig(config: GeoConfig): GeoConfig {
  return config;
}

/**
 * Join a site-relative path to the config's `siteUrl`. Absolute URLs pass
 * through unchanged.
 */
export function toAbsoluteUrl(config: GeoConfig, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = config.siteUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Default AI-assistant referrer sources. Referral tracking is inherently
 * incomplete (most AI exposure is zero-click and app traffic strips referrers)
 * but referrers are the strongest direct signal a citation converted to a visit.
 */
export const DEFAULT_AI_REFERRER_SOURCES: AiReferrerSource[] = [
  { id: "chatgpt", pattern: /chatgpt\.com|chat\.openai\.com/i },
  { id: "perplexity", pattern: /perplexity\.ai/i },
  { id: "claude", pattern: /claude\.ai/i },
  { id: "gemini", pattern: /gemini\.google\.com|bard\.google\.com/i },
  { id: "copilot", pattern: /copilot\.microsoft\.com/i },
  { id: "duckai", pattern: /duckduckgo\.com\/\?.*ia=chat|duck\.ai/i },
];

/**
 * Default AI-bot user-agent pattern. Covers retrieval/citation crawlers
 * (OAI-SearchBot, Claude-SearchBot, PerplexityBot), live user-fetch agents
 * (ChatGPT-User, Perplexity-User — the closest signal to "used in a live
 * answer"), and training crawlers (GPTBot, ClaudeBot, CCBot, …).
 */
export const DEFAULT_AI_BOT_PATTERN =
  /(ChatGPT-User|OAI-SearchBot|GPTBot|Claude-User|Claude-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|DuckAssistBot|Google-Extended|Applebot-Extended|CCBot|Bytespider|Amazonbot|meta-externalagent)/i;
