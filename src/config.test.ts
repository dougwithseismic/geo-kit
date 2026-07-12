import { describe, it, expect } from "vitest";
import {
  toAbsoluteUrl,
  DEFAULT_AI_REFERRER_SOURCES,
  DEFAULT_AI_BOT_PATTERN,
  type GeoConfig,
} from "./config";
import { exampleConfig } from "./config.example";

const base: GeoConfig = {
  siteUrl: "https://example.com",
  brandName: "Acme",
  description: "desc",
  locale: "en-GB",
};

describe("exampleConfig", () => {
  it("has the required fields populated", () => {
    expect(exampleConfig.siteUrl).toMatch(/^https?:\/\//);
    expect(exampleConfig.brandName).toBeTruthy();
    expect(exampleConfig.description).toBeTruthy();
    expect(exampleConfig.locale).toBeTruthy();
  });
});

describe("toAbsoluteUrl", () => {
  it("joins site-relative paths", () => {
    expect(toAbsoluteUrl(base, "/events")).toBe("https://example.com/events");
    expect(toAbsoluteUrl(base, "events")).toBe("https://example.com/events");
  });

  it("passes absolute URLs through", () => {
    expect(toAbsoluteUrl(base, "https://cdn.example.com/x.jpg")).toBe(
      "https://cdn.example.com/x.jpg",
    );
  });

  it("does not double a trailing slash on siteUrl", () => {
    const cfg = { ...base, siteUrl: "https://example.com/" };
    expect(toAbsoluteUrl(cfg, "/events")).toBe("https://example.com/events");
  });
});

describe("defaults", () => {
  it("matches the major AI referrers", () => {
    const match = (ref: string) =>
      DEFAULT_AI_REFERRER_SOURCES.find((s) => s.pattern.test(ref))?.id;
    expect(match("https://chatgpt.com/")).toBe("chatgpt");
    expect(match("https://www.perplexity.ai/search")).toBe("perplexity");
    expect(match("https://claude.ai/")).toBe("claude");
    expect(match("https://gemini.google.com/app")).toBe("gemini");
    expect(match("https://www.google.com/")).toBeUndefined();
  });

  it("matches AI-bot user agents (retrieval, user-fetch, training)", () => {
    expect(DEFAULT_AI_BOT_PATTERN.test("Mozilla/5.0 ChatGPT-User/1.0")).toBe(
      true,
    );
    expect(DEFAULT_AI_BOT_PATTERN.test("PerplexityBot/1.0")).toBe(true);
    expect(DEFAULT_AI_BOT_PATTERN.test("GPTBot/1.1")).toBe(true);
    expect(DEFAULT_AI_BOT_PATTERN.test("Googlebot/2.1")).toBe(false);
  });
});
