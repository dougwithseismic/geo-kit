import { describe, it, expect } from "vitest";
import type { GeoConfig } from "../config";
import { renderRssFeed, type RssItem } from "./rss";

const config: GeoConfig = {
  siteUrl: "https://example.com",
  brandName: "Acme",
  description: "Acme feed",
  locale: "en-GB",
};

const items: RssItem[] = [
  {
    title: "Older",
    path: "/blog/older",
    description: "older",
    publishedAt: "2026-01-01",
  },
  {
    title: "Newer & Bolder",
    path: "/blog/newer",
    description: "has <b>html</b> & ampersand",
    publishedAt: "2026-06-01",
  },
];

describe("renderRssFeed", () => {
  it("emits a valid RSS channel with feed metadata", () => {
    const xml = renderRssFeed(config, items);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<title>Acme Blog</title>");
    expect(xml).toContain("<link>https://example.com/blog</link>");
    expect(xml).toContain(
      '<atom:link href="https://example.com/feed.xml" rel="self"',
    );
  });

  it("sorts newest-first", () => {
    const xml = renderRssFeed(config, items);
    expect(xml.indexOf("Newer")).toBeLessThan(xml.indexOf("Older"));
  });

  it("escapes XML in titles and descriptions", () => {
    const xml = renderRssFeed(config, items);
    expect(xml).toContain("Newer &amp; Bolder");
    expect(xml).toContain("&lt;b&gt;html&lt;/b&gt; &amp; ampersand");
  });

  it("caps at the limit", () => {
    const xml = renderRssFeed(config, items, { limit: 1 });
    expect((xml.match(/<item>/g) ?? []).length).toBe(1);
  });
});
