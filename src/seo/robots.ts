import type { GeoConfig } from "../config";

/**
 * AI retrieval + live-user-fetch agents that gate whether a site can be *cited*
 * in AI answers. Allow these to be citable.
 */
export const AI_RETRIEVAL_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Bingbot",
  "DuckAssistBot",
] as const;

/**
 * Training-only crawlers. Allowing them does NOT affect citations (only
 * model-training use). Included by default for maximum exposure; drop them if
 * rights concerns win.
 */
export const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
] as const;

export interface RobotsRule {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

export interface RobotsResult {
  rules: RobotsRule[];
  sitemap: string;
}

export interface BuildRobotsOptions {
  /** Paths disallowed for all agents (e.g. ["/api/", "/admin/"]). */
  disallow?: string[];
  /** Extra allowed paths that would otherwise be caught by a disallow (e.g. ["/api/og"]). */
  allow?: string[];
  /** Override the AI crawler allow-list (defaults to retrieval + training). */
  aiCrawlers?: readonly string[];
}

/**
 * Build a robots definition with an explicit AI-crawler allow-list plus a
 * catch-all. Returns a plain shape that maps directly to a Next App Router
 * `robots.ts` (`MetadataRoute.Robots`: `{ rules, sitemap }`).
 */
export function buildRobots(
  config: GeoConfig,
  options: BuildRobotsOptions = {},
): RobotsResult {
  const disallow = options.disallow ?? [];
  const allow = ["/", ...(options.allow ?? [])];
  const aiCrawlers =
    options.aiCrawlers ?? [...AI_RETRIEVAL_CRAWLERS, ...AI_TRAINING_CRAWLERS];

  const rules: RobotsRule[] = [
    ...aiCrawlers.map((userAgent) => ({ userAgent, allow, disallow })),
    { userAgent: "*", allow, disallow },
  ];

  return {
    rules,
    sitemap: `${config.siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}

/** Serialize a `RobotsResult` to robots.txt text (for non-Next stacks). */
export function robotsToText(result: RobotsResult): string {
  const blocks = result.rules.map((rule) => {
    const lines = [`User-agent: ${rule.userAgent}`];
    for (const a of rule.allow) lines.push(`Allow: ${a}`);
    for (const d of rule.disallow) lines.push(`Disallow: ${d}`);
    return lines.join("\n");
  });
  return `${blocks.join("\n\n")}\n\nSitemap: ${result.sitemap}\n`;
}
