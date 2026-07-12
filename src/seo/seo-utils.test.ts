import { describe, it, expect } from "vitest";
import type { GeoConfig } from "../config";
import { buildOgImageUrl } from "./og-image-url";
import { buildRobots, robotsToText } from "./robots";
import { sitemapEntry, sitemapToXml } from "./sitemap";

const config: GeoConfig = {
  siteUrl: "https://example.com",
  brandName: "Acme",
  description: "d",
  locale: "en-GB",
};

describe("buildOgImageUrl", () => {
  it("builds an absolute /api/og URL with encoded params", () => {
    const url = buildOgImageUrl(config, {
      title: "Best Tea & Cake",
      type: "blog",
      author: "Jane",
    });
    expect(url.startsWith("https://example.com/api/og?")).toBe(true);
    expect(url).toContain("title=Best+Tea+%26+Cake");
    expect(url).toContain("type=blog");
    expect(url).not.toContain("type=default");
  });
});

describe("buildRobots", () => {
  it("allows AI crawlers and adds a catch-all + sitemap", () => {
    const r = buildRobots(config, {
      disallow: ["/api/", "/admin/"],
      allow: ["/api/og"],
    });
    const oai = r.rules.find((x) => x.userAgent === "OAI-SearchBot");
    expect(oai).toBeDefined();
    expect(oai?.allow).toEqual(["/", "/api/og"]);
    expect(oai?.disallow).toEqual(["/api/", "/admin/"]);
    expect(r.rules.at(-1)?.userAgent).toBe("*");
    expect(r.sitemap).toBe("https://example.com/sitemap.xml");
  });

  it("serializes to robots.txt text", () => {
    const text = robotsToText(buildRobots(config, { disallow: ["/api/"] }));
    expect(text).toContain("User-agent: OAI-SearchBot");
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});

describe("sitemap", () => {
  it("absolutises entry URLs", () => {
    expect(sitemapEntry(config, "/blog", { priority: 0.7 })).toEqual({
      url: "https://example.com/blog",
      priority: 0.7,
    });
  });

  it("serializes to XML", () => {
    const xml = sitemapToXml([
      sitemapEntry(config, "/", { priority: 1, changeFrequency: "weekly" }),
    ]);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<priority>1</priority>");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
  });
});
