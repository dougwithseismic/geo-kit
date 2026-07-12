import type { GeoConfig } from "../config";
import { toAbsoluteUrl } from "../config";

export interface RssItem {
  title: string;
  /** Site-relative or absolute URL. */
  path: string;
  description: string;
  /** ISO date string. */
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  category?: string;
}

/** Escape a string for XML text content. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface RssOptions {
  /** Feed title (defaults to "<brandName> Blog"). */
  title?: string;
  /** Path the feed lists (defaults to "/blog"). */
  channelPath?: string;
  /** Path the feed is served at (defaults to "/feed.xml"). */
  selfPath?: string;
  /** Max items (defaults to 50). */
  limit?: number;
}

/**
 * Render an RSS 2.0 feed as an XML string. Framework-free: return it from any
 * route handler with `Content-Type: application/rss+xml`. Items are sorted
 * newest-first and capped at `limit`.
 */
export function renderRssFeed(
  config: GeoConfig,
  items: RssItem[],
  options: RssOptions = {},
): string {
  const title = options.title ?? `${config.brandName} Blog`;
  const channelUrl = toAbsoluteUrl(config, options.channelPath ?? "/blog");
  const selfUrl = toAbsoluteUrl(config, options.selfPath ?? "/feed.xml");
  const limit = options.limit ?? 50;

  const sorted = [...items]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, limit);

  const rssItems = sorted
    .map((item) => {
      const url = toAbsoluteUrl(config, item.path);
      const lines = [
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escapeXml(item.description)}</description>`,
        `      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>`,
      ];
      if (item.author) {
        lines.push(`      <author>${escapeXml(item.author)}</author>`);
      }
      if (item.category) {
        lines.push(`      <category>${escapeXml(item.category)}</category>`);
      }
      return `    <item>\n${lines.join("\n")}\n    </item>`;
    })
    .join("\n");

  const lastBuild = sorted[0]
    ? new Date(sorted[0].updatedAt ?? sorted[0].publishedAt).toUTCString()
    : new Date(0).toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${channelUrl}</link>
    <description>${escapeXml(config.description)}</description>
    <language>${config.locale}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;
}
