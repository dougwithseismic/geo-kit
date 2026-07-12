import { describe, it, expect, vi } from "vitest";
import type { GeoConfig } from "../config";
import { parseSitemapUrls, submitUrls, pingFromSitemap } from "./indexnow";

const config: GeoConfig = {
  siteUrl: "https://example.com",
  brandName: "Acme",
  description: "d",
  locale: "en-GB",
  indexNowKey: "test-key",
};

const SITEMAP = `<?xml version="1.0"?><urlset>
<url><loc>https://example.com/</loc></url>
<url><loc>https://example.com/blog/x</loc></url>
</urlset>`;

describe("parseSitemapUrls", () => {
  it("extracts loc URLs", () => {
    expect(parseSitemapUrls(SITEMAP)).toEqual([
      "https://example.com/",
      "https://example.com/blog/x",
    ]);
  });
  it("returns [] when there are none", () => {
    expect(parseSitemapUrls("<urlset></urlset>")).toEqual([]);
  });
});

describe("submitUrls", () => {
  it("posts key, host and keyLocation", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const r = await submitUrls(config, ["https://example.com/a"], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r.status).toBe(200);
    expect(r.error).toBeUndefined();
    const body = JSON.parse((fetchImpl.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      host: "example.com",
      key: "test-key",
      keyLocation: "https://example.com/test-key.txt",
    });
  });

  it("treats 202 as success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    const r = await submitUrls(config, ["https://example.com/a"], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r.status).toBe(202);
    expect(r.error).toBeUndefined();
  });

  it("skips the network on dry run", async () => {
    const fetchImpl = vi.fn();
    const r = await submitUrls(config, ["https://example.com/a"], {
      dryRun: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r.dryRun).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("errors when no key is configured", async () => {
    const r = await submitUrls({ ...config, indexNowKey: undefined }, ["x"]);
    expect(r.error).toContain("indexNowKey");
  });
});

describe("pingFromSitemap", () => {
  it("fetches the sitemap then submits its URLs", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(SITEMAP, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const r = await pingFromSitemap(config, {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r.urlCount).toBe(2);
    expect(r.status).toBe(200);
    expect((fetchImpl.mock.calls[0][0] as string)).toBe(
      "https://example.com/sitemap.xml",
    );
  });

  it("throws when the sitemap fetch fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(
      pingFromSitemap(config, { fetchImpl: fetchImpl as unknown as typeof fetch }),
    ).rejects.toThrow("Failed to fetch sitemap: 500");
  });
});
