/**
 * IndexNow submission — push URLs to Bing (and Seznam/Naver/Yandex) so they
 * reindex quickly. Bing's index grounds ChatGPT search answers, so keeping it
 * fresh is the cheapest lever for AI-search visibility of new pages.
 *
 * The IndexNow key is public by design: it is verified via a key file served at
 * `${siteUrl}/${indexNowKey}.txt`.
 */

import type { GeoConfig } from "../config";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10_000;

export interface IndexNowResult {
  urlCount: number;
  dryRun: boolean;
  /** HTTP status from IndexNow (0 when dry run or no URLs). */
  status: number;
  sampleUrls: string[];
  error?: string;
}

export interface IndexNowOptions {
  dryRun?: boolean;
  fetchImpl?: typeof fetch;
}

/** Extract `<loc>` URLs from a sitemap XML document. */
export function parseSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = match[1]?.trim();
    if (url) urls.push(url);
  }
  return urls;
}

/** Submit a list of URLs to IndexNow. Requires `config.indexNowKey`. */
export async function submitUrls(
  config: GeoConfig,
  urls: string[],
  options: IndexNowOptions = {},
): Promise<IndexNowResult> {
  const dryRun = options.dryRun ?? false;
  const fetchImpl = options.fetchImpl ?? fetch;
  const list = urls.slice(0, MAX_URLS);
  const result: IndexNowResult = {
    urlCount: list.length,
    dryRun,
    status: 0,
    sampleUrls: list.slice(0, 5),
  };

  if (!config.indexNowKey) {
    result.error = "config.indexNowKey is not set";
    return result;
  }
  if (dryRun || list.length === 0) return result;

  const base = config.siteUrl.replace(/\/$/, "");
  const res = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(base).host,
      key: config.indexNowKey,
      keyLocation: `${base}/${config.indexNowKey}.txt`,
      urlList: list,
    }),
  });

  result.status = res.status;
  // IndexNow returns 200 (ok) or 202 (accepted, key pending verification).
  if (!res.ok && res.status !== 202) {
    result.error = await res.text().catch(() => "Unknown error");
  }
  return result;
}

/** Fetch the site's sitemap, extract its URLs, and submit them to IndexNow. */
export async function pingFromSitemap(
  config: GeoConfig,
  options: IndexNowOptions = {},
): Promise<IndexNowResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const base = config.siteUrl.replace(/\/$/, "");
  const res = await fetchImpl(`${base}/sitemap.xml`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sitemap: ${res.status} ${base}/sitemap.xml`);
  }
  const urls = parseSitemapUrls(await res.text());
  return submitUrls(config, urls, options);
}
