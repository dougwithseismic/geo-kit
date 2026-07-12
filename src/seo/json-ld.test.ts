import { describe, it, expect } from "vitest";
import {
  organizationSchema,
  websiteSchema,
  breadcrumbSchema,
  faqPageSchema,
  articleSchema,
  eventSchema,
} from "./json-ld";
import type { GeoConfig } from "../config";

const config: GeoConfig = {
  siteUrl: "https://example.com",
  brandName: "Acme",
  description: "Acme does things.",
  locale: "en-GB",
  founder: "Jane Doe",
  foundingDate: "2024",
  areaServed: ["Exampleton"],
  knowsAbout: ["social dining"],
  sameAs: ["https://instagram.com/acme"],
  contactEmail: "hi@example.com",
};

describe("organizationSchema", () => {
  it("includes enrichment fields when present", () => {
    const s = organizationSchema(config);
    expect(s["@type"]).toBe("Organization");
    expect(s.founder).toEqual({ "@type": "Person", name: "Jane Doe" });
    expect(s.areaServed).toEqual([
      { "@type": "AdministrativeArea", name: "Exampleton" },
    ]);
    expect(s.knowsAbout).toEqual(["social dining"]);
    expect(s.sameAs).toEqual(["https://instagram.com/acme"]);
  });

  it("omits optional fields when absent", () => {
    const s = organizationSchema({
      siteUrl: "https://x.com",
      brandName: "X",
      description: "d",
      locale: "en",
    });
    expect(s.founder).toBeUndefined();
    expect(s.sameAs).toBeUndefined();
  });
});

describe("websiteSchema", () => {
  it("omits SearchAction by default", () => {
    expect(websiteSchema(config).potentialAction).toBeUndefined();
  });
  it("adds SearchAction when a template is given", () => {
    const s = websiteSchema(config, {
      searchUrlTemplate: "https://example.com/search?q={search_term_string}",
    });
    expect((s.potentialAction as Record<string, unknown>)["@type"]).toBe(
      "SearchAction",
    );
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions and absolutises URLs", () => {
    const s = breadcrumbSchema(config, [
      { name: "Home", url: "/" },
      { name: "Blog", url: "/blog" },
    ]);
    const items = s.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].position).toBe(1);
    expect(items[1].item).toBe("https://example.com/blog");
  });
});

describe("faqPageSchema", () => {
  it("builds Question/Answer entities", () => {
    const s = faqPageSchema([{ question: "Q?", answer: "A." }]);
    expect(s["@type"]).toBe("FAQPage");
    const q = (s.mainEntity as Array<Record<string, unknown>>)[0];
    expect(q["@type"]).toBe("Question");
    expect((q.acceptedAnswer as Record<string, unknown>).text).toBe("A.");
  });
});

describe("articleSchema", () => {
  it("uses NewsArticle for news and absolutises url/image", () => {
    const s = articleSchema(config, {
      title: "T",
      description: "d",
      path: "/blog/x",
      datePublished: "2026-01-01",
      image: "/cover.jpg",
      authorName: "Jane",
      authorUrl: "/author/jane",
      news: true,
    });
    expect(s["@type"]).toBe("NewsArticle");
    expect(s.url).toBe("https://example.com/blog/x");
    expect(s.image).toBe("https://example.com/cover.jpg");
    expect((s.author as Record<string, unknown>).url).toBe(
      "https://example.com/author/jane",
    );
  });
});

describe("eventSchema", () => {
  it("returns null without a startDate (never fabricate)", () => {
    expect(eventSchema(config, { name: "E", path: "/e" })).toBeNull();
  });
  it("builds an Event when a startDate is present", () => {
    const s = eventSchema(config, {
      name: "E",
      path: "/e",
      startDate: "2026-09-04T18:00:00Z",
      status: "EventScheduled",
    });
    expect(s?.["@type"]).toBe("Event");
    expect(s?.eventStatus).toBe("https://schema.org/EventScheduled");
  });
});
