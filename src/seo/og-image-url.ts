import type { GeoConfig } from "../config";
import { toAbsoluteUrl } from "../config";

/**
 * Params for a dynamic OG image generator (e.g. a Next `/api/og` route using
 * `next/og`). Mirror these in your route's `searchParams` parsing.
 */
export interface OgImageParams {
  title: string;
  subtitle?: string;
  type?: "default" | "event" | "blog" | "venue" | "company";
  date?: string;
  location?: string;
  author?: string;
  category?: string;
}

/**
 * Build an absolute URL for a branded, dynamically-generated OG image. Use as
 * the OpenGraph/Twitter image for pages without a bespoke photo so share
 * previews stay consistent (and never 404).
 */
export function buildOgImageUrl(
  config: GeoConfig,
  params: OgImageParams,
  route = "/api/og",
): string {
  const sp = new URLSearchParams();
  sp.set("title", params.title);
  if (params.type && params.type !== "default") sp.set("type", params.type);
  if (params.subtitle) sp.set("subtitle", params.subtitle);
  if (params.date) sp.set("date", params.date);
  if (params.location) sp.set("location", params.location);
  if (params.author) sp.set("author", params.author);
  if (params.category) sp.set("category", params.category);
  return toAbsoluteUrl(config, `${route}?${sp.toString()}`);
}
