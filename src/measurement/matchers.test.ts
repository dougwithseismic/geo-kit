import { describe, it, expect, vi } from "vitest";
import { matchAiReferrer } from "./ai-referral";
import { matchAiBot, trackAiBotFetch } from "./ai-bot-telemetry";

describe("matchAiReferrer", () => {
  it("identifies AI-assistant referrers", () => {
    expect(matchAiReferrer("https://chatgpt.com/")).toBe("chatgpt");
    expect(matchAiReferrer("https://www.perplexity.ai/search?q=x")).toBe(
      "perplexity",
    );
    expect(matchAiReferrer("https://claude.ai/chat/abc")).toBe("claude");
    expect(matchAiReferrer("https://gemini.google.com/app")).toBe("gemini");
  });

  it("returns null for non-AI or empty referrers", () => {
    expect(matchAiReferrer("https://www.google.com/")).toBeNull();
    expect(matchAiReferrer("")).toBeNull();
    expect(matchAiReferrer(undefined)).toBeNull();
  });
});

describe("matchAiBot", () => {
  it("matches retrieval, user-fetch and training agents", () => {
    expect(matchAiBot("Mozilla/5.0 (compatible; ChatGPT-User/1.0)")).toBe(
      "ChatGPT-User",
    );
    expect(matchAiBot("OAI-SearchBot/1.0")).toBe("OAI-SearchBot");
    expect(matchAiBot("PerplexityBot/1.0")).toBe("PerplexityBot");
    expect(matchAiBot("ClaudeBot/1.0")).toBe("ClaudeBot");
    expect(matchAiBot("GPTBot/1.1")).toBe("GPTBot");
  });

  it("returns null for search engines and empty UAs", () => {
    expect(matchAiBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBeNull();
    expect(matchAiBot("")).toBeNull();
    expect(matchAiBot(null)).toBeNull();
  });
});

describe("trackAiBotFetch", () => {
  it("fires only for AI bots", () => {
    const track = vi.fn();
    trackAiBotFetch({ userAgent: "PerplexityBot/1.0", path: "/blog", track });
    expect(track).toHaveBeenCalledWith(
      "ai_bot_fetch",
      expect.objectContaining({ bot: "PerplexityBot", path: "/blog" }),
    );

    track.mockClear();
    trackAiBotFetch({ userAgent: "Googlebot/2.1", path: "/blog", track });
    expect(track).not.toHaveBeenCalled();
  });

  it("never throws if track throws", () => {
    const track = vi.fn(() => {
      throw new Error("boom");
    });
    expect(() =>
      trackAiBotFetch({ userAgent: "GPTBot/1.1", path: "/x", track }),
    ).not.toThrow();
  });
});
