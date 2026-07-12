import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { extractFaqEntries, FaqItem } from "./faq";
import { faqPageSchema } from "../../seo/json-ld";

describe("extractFaqEntries", () => {
  it("collects question/answer from FaqItem children", () => {
    const children = [
      createElement(FaqItem, { question: "Q1?", answer: "A1", key: "1" }),
      createElement(FaqItem, { question: "Q2?", answer: "A2", key: "2" }),
    ];
    expect(extractFaqEntries(children)).toEqual([
      { question: "Q1?", answer: "A1" },
      { question: "Q2?", answer: "A2" },
    ]);
  });

  it("ignores children without string question/answer props", () => {
    const children = [
      createElement(FaqItem, { question: "Q1?", answer: "A1", key: "1" }),
      createElement("div", { key: "x" }, "not an faq item"),
      "plain text",
    ];
    expect(extractFaqEntries(children)).toHaveLength(1);
  });

  it("feeds a valid FAQPage schema", () => {
    const entries = extractFaqEntries([
      createElement(FaqItem, { question: "Q?", answer: "A", key: "1" }),
    ]);
    const schema = faqPageSchema(entries);
    expect(schema["@type"]).toBe("FAQPage");
    expect((schema.mainEntity as unknown[]).length).toBe(1);
  });
});
