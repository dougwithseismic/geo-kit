/**
 * schema.org JSON-LD builders, config-driven and framework-free.
 *
 * Each returns a plain object; render it in a
 * `<script type="application/ld+json">` (see `JsonLd` in
 * `src/components/json-ld.tsx`). AI engines and Google consume Organization,
 * WebSite, BreadcrumbList, FAQPage, Article and domain schema; there is no
 * evidence any engine consumes `speakable`, so it's intentionally omitted.
 */

import type { GeoConfig } from "../config";
import { toAbsoluteUrl } from "../config";

export type JsonLdObject = Record<string, unknown>;

/** Organization schema from config. Enrich with founder/areaServed/knowsAbout/sameAs when present. */
export function organizationSchema(config: GeoConfig): JsonLdObject {
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.brandName,
    url: config.siteUrl,
    description: config.description,
  };
  if (config.founder) {
    schema.founder = { "@type": "Person", name: config.founder };
  }
  if (config.foundingDate) schema.foundingDate = config.foundingDate;
  if (config.contactEmail) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: config.contactEmail,
    };
  }
  if (config.areaServed?.length) {
    schema.areaServed = config.areaServed.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    }));
  }
  if (config.knowsAbout?.length) schema.knowsAbout = config.knowsAbout;
  if (config.sameAs?.length) schema.sameAs = config.sameAs;
  return schema;
}

/**
 * WebSite schema. Deliberately omits a `SearchAction` unless a real search URL
 * is passed — advertising a dead search endpoint is worse than omitting it.
 */
export function websiteSchema(
  config: GeoConfig,
  opts?: { searchUrlTemplate?: string },
): JsonLdObject {
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.brandName,
    url: config.siteUrl,
    description: config.description,
    inLanguage: config.locale,
  };
  if (opts?.searchUrlTemplate) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: opts.searchUrlTemplate,
      "query-input": "required name=search_term_string",
    };
  }
  return schema;
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute or site-relative URL. */
  url: string;
}

export function breadcrumbSchema(
  config: GeoConfig,
  items: BreadcrumbItem[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: toAbsoluteUrl(config, item.url),
    })),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqPageSchema(items: FaqEntry[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface ArticleInput {
  title: string;
  description: string;
  /** Site-relative or absolute canonical path. */
  path: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  /** Site-relative or absolute image URL. */
  image?: string;
  /** Use NewsArticle for time-sensitive content. */
  news?: boolean;
}

export function articleSchema(
  config: GeoConfig,
  article: ArticleInput,
): JsonLdObject {
  const url = toAbsoluteUrl(config, article.path);
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": article.news ? "NewsArticle" : "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    inLanguage: config.locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    publisher: {
      "@type": "Organization",
      name: config.brandName,
      url: config.siteUrl,
    },
  };
  if (article.image) schema.image = toAbsoluteUrl(config, article.image);
  if (article.authorName) {
    schema.author = {
      "@type": "Person",
      name: article.authorName,
      ...(article.authorUrl
        ? { url: toAbsoluteUrl(config, article.authorUrl) }
        : {}),
    };
  }
  return schema;
}

export interface EventInput {
  name: string;
  description?: string;
  /** ISO datetime. If absent, no schema is returned (never fabricate a date). */
  startDate?: string;
  endDate?: string;
  path: string;
  locationName?: string;
  status?: "EventScheduled" | "EventCancelled" | "EventPostponed";
}

/**
 * Event schema — returns `null` when `startDate` is missing. Emitting an event
 * with a fabricated (e.g. render-time) start date is false structured data.
 */
export function eventSchema(
  config: GeoConfig,
  event: EventInput,
): JsonLdObject | null {
  if (!event.startDate) return null;
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.startDate,
    url: toAbsoluteUrl(config, event.path),
    eventStatus: `https://schema.org/${event.status ?? "EventScheduled"}`,
    organizer: { "@type": "Organization", name: config.brandName, url: config.siteUrl },
  };
  if (event.description) schema.description = event.description;
  if (event.endDate) schema.endDate = event.endDate;
  if (event.locationName) {
    schema.location = { "@type": "Place", name: event.locationName };
  }
  return schema;
}
