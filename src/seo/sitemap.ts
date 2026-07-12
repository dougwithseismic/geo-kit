import type { GeoConfig } from "../config";
import { toAbsoluteUrl } from "../config";

export type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

/** One sitemap entry. Shape matches a Next `MetadataRoute.Sitemap` item. */
export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

/** Build a single absolute-URL sitemap entry from a site-relative path. */
export function sitemapEntry(
  config: GeoConfig,
  path: string,
  opts: Omit<SitemapEntry, "url"> = {},
): SitemapEntry {
  return { url: toAbsoluteUrl(config, path), ...opts };
}

/** Escape a URL for XML text. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Serialize entries to sitemap XML (for non-Next stacks). */
export function sitemapToXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) {
        const iso =
          entry.lastModified instanceof Date
            ? entry.lastModified.toISOString()
            : entry.lastModified;
        parts.push(`    <lastmod>${iso}</lastmod>`);
      }
      if (entry.changeFrequency) {
        parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        parts.push(`    <priority>${entry.priority}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
