import { defineGeoConfig } from "./config";

/**
 * A fully-worked example config for a fictional local business. Copy this to
 * `geo.config.ts` in your app, adjust the import path, and edit the values.
 *
 * (This file is typechecked and tested so the example never rots.)
 */
export const exampleConfig = defineGeoConfig({
  siteUrl: "https://example.com",
  brandName: "Acme Supper Club",
  description:
    "Acme Supper Club hosts community dinners where strangers become friends over a shared table.",
  locale: "en-GB",
  founder: "Jane Doe",
  foundingDate: "2024",
  areaServed: ["Exampleton", "Exampleshire"],
  knowsAbout: ["social dining", "community events", "loneliness and connection"],
  sameAs: [
    "https://www.instagram.com/acmesupperclub",
    "https://www.linkedin.com/company/acme-supper-club",
  ],
  contactEmail: "hello@example.com",
  targetIntents: [
    "things to do in Exampleton",
    "how to meet people in Exampleton",
    "supper clubs Exampleshire",
  ],
  ogImagePath: "/og-image.jpg",
  indexNowKey: "REPLACE_WITH_YOUR_INDEXNOW_KEY",
  cronJobs: [
    { path: "/cron/indexnow-ping", cron: "15 6 * * *" },
  ],
});
