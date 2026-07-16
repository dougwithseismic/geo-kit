# geo-kit

A portable **AI-citation / GEO (Generative Engine Optimization) user-acquisition
kit**. It packages the reusable pieces for getting a website cited by AI search
engines — **ChatGPT search, Google AI Overviews / AI Mode, Perplexity, Claude** —
into one repo you drop into any project: a framework-agnostic playbook, agent
skills, Next.js/MDX components, portable infra, a measurement toolkit, and
go-to-market templates.

Everything brand- and domain-specific lives in **one config** (`GeoConfig`);
nothing else hard-codes a brand or URL.

- [What's inside](#whats-inside)
- [Install](#install)
- [Configure](#configure)
- [The workflow](#the-workflow)
- [Usage](#usage) — [robots](#robotstxt) · [sitemap](#sitemap) · [JSON-LD](#json-ld) · [OG images](#og-images) · [RSS](#rss-feed) · [MDX components](#mdx-content-components) · [scheduler](#in-process-cron-scheduler) · [IndexNow](#indexnow) · [measurement](#measurement)
- [Skills](#agent-skills)
- [Templates](#go-to-market-templates)
- [Non-Next / other stacks](#non-next-stacks)
- [Config reference](#geoconfig-reference)
- [Develop](#develop)
- [The evidence](#the-evidence)

## What's inside

| Path | What | How you use it |
| --- | --- | --- |
| [`playbook/`](./playbook) | Evidence base + decision rules + plan template | Read first; drive work from it |
| [`skills/`](./skills) | `geo-audit`, `geo-content`, `geo-measure` | Copy into `.claude/skills/` |
| [`src/config.ts`](./src/config.ts) | `GeoConfig` contract + defaults | Create your `geo.config.ts` |
| [`src/seo/`](./src/seo) | JSON-LD builders, OG-image URL, robots, sitemap | Import from `@withseismic/geo-kit` |
| [`src/components/`](./src/components) | `KeyAnswer`, `Faq`/`FaqItem`, `StatCallout`, `JsonLd`, `AiReferralTracker` | Import from `@withseismic/geo-kit/react` |
| [`src/feed/`](./src/feed) | RSS renderer | Import `renderRssFeed` |
| [`src/infra/`](./src/infra) | In-process cron scheduler, IndexNow | Import + wire |
| [`src/measurement/`](./src/measurement) | GSC pull, AI-referral + AI-bot telemetry | Import + run |
| [`templates/`](./templates) | Listings, PR targets, citation checks, Wikidata | Fill placeholders |

## Install

```bash
pnpm add @withseismic/geo-kit
```

Two entry points keep React out of server code — the core is framework-free; the
`react` entry needs React (an **optional** peer dependency):

```ts
import { buildRobots, faqPageSchema } from "@withseismic/geo-kit";        // core
import { Faq, FaqItem, KeyAnswer } from "@withseismic/geo-kit/react";     // components
```

Ships **dual ESM/CJS with type declarations**. Every asset is also copy-paste
friendly — if you'd rather not add a dependency, copy the files you need from
`src/`. A `geo-kit-gsc-pull` bin is included for the Search Console pull.

## Configure

Create `geo.config.ts` in your app (copy from
[`src/config.example.ts`](./src/config.example.ts)). This is the only
brand-specific file:

```ts
import { defineGeoConfig } from "@withseismic/geo-kit";

export const geoConfig = defineGeoConfig({
  siteUrl: "https://yoursite.com",        // no trailing slash
  brandName: "Your Brand",
  description: "One sentence about you.",
  locale: "en-GB",
  // Optional but recommended:
  founder: "Jane Doe",
  foundingDate: "2024",
  areaServed: ["Exeter", "Devon"],        // local entity signals
  knowsAbout: ["social dining", "community events"],
  sameAs: ["https://instagram.com/you", "https://linkedin.com/company/you"],
  contactEmail: "hello@yoursite.com",
  targetIntents: ["things to do in Exeter", "how to meet people in Exeter"],
  ogImagePath: "/og-image.jpg",
  indexNowKey: "your-indexnow-key",       // served at /your-indexnow-key.txt
  cronJobs: [{ path: "/api/cron/indexnow", cron: "15 6 * * *" }],
});
```

See the [full field reference](#geoconfig-reference).

## The workflow

Work these in order (skipping #1 makes the rest worthless). Grounded in
[`playbook/README.md`](./playbook/README.md):

1. **Get in the index** — allow AI crawlers ([robots](#robotstxt)), server-render,
   verify Bing + automate [IndexNow](#indexnow). Run the [`geo-audit`](#agent-skills)
   skill first; it checks crawler access, the #1 failure mode.
2. **Be the clearest answer** — [answer-first / FAQ / stat components](#mdx-content-components)
   and [JSON-LD](#json-ld) on every page you want cited.
3. **Be a known entity** — enriched Organization schema, a Wikidata entity, and
   earned mentions (see [templates](#go-to-market-templates)).
4. **Measure the right thing** — most citations are zero-click, so
   [triangulate](#measurement).

## Usage

All examples assume `import { geoConfig } from "@/geo.config"`. Snippets show
**Next.js App Router** glue where relevant; the [core is framework-free](#non-next-stacks).

### robots.txt

Emit one robots file with an AI-crawler allow-list and the correct sitemap URL:

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { buildRobots } from "@withseismic/geo-kit";
import { geoConfig } from "@/geo.config";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(geoConfig, {
    disallow: ["/api/", "/admin/"],
    allow: ["/api/og"], // keep the OG route fetchable despite /api/ disallow
  });
}
```

`buildRobots` allows the retrieval + user-fetch agents that gate citations
(`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, `ChatGPT-User`, …) plus
training crawlers by default. Pass `aiCrawlers` to override. Delete any static
`public/robots.txt` so it can't shadow this.

> **Check the edge, not just robots.** The #1 failure is a CDN (e.g. Cloudflare
> "Block AI Scrapers") silently 403-ing these agents:
> `for ua in GPTBot OAI-SearchBot ClaudeBot PerplexityBot; do curl -s -o /dev/null -w "$ua %{http_code}\n" -A "$ua" https://yoursite.com/; done` — expect `200`.

### Sitemap

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { sitemapEntry } from "@withseismic/geo-kit";
import { geoConfig } from "@/geo.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts(); // your data
  return [
    sitemapEntry(geoConfig, "/", { changeFrequency: "weekly", priority: 1 }),
    sitemapEntry(geoConfig, "/blog", { changeFrequency: "daily", priority: 0.8 }),
    ...posts.map((p) =>
      sitemapEntry(geoConfig, `/blog/${p.slug}`, {
        lastModified: p.updatedAt,
        priority: 0.6,
      }),
    ),
  ];
}
```

Cover **every** citable route — AI crawlers waste ~35% of fetches on 404s, so
clean sitemaps help them disproportionately.

### JSON-LD

Builders return plain objects; render them with `JsonLd`:

```tsx
import { organizationSchema, articleSchema, breadcrumbSchema } from "@withseismic/geo-kit";
import { JsonLd } from "@withseismic/geo-kit/react";
import { geoConfig } from "@/geo.config";

export default function ArticlePage({ post }) {
  return (
    <>
      <JsonLd schema={organizationSchema(geoConfig)} />
      <JsonLd
        schema={articleSchema(geoConfig, {
          title: post.title,
          description: post.description,
          path: `/blog/${post.slug}`,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          authorName: post.author,
          authorUrl: `/blog/author/${post.authorId}`,
          image: post.coverImage,
          news: post.category === "news", // → NewsArticle
        })}
      />
      <JsonLd
        schema={breadcrumbSchema(geoConfig, [
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ])}
      />
    </>
  );
}
```

Also available: `websiteSchema(config, { searchUrlTemplate? })`,
`faqPageSchema(items)` (usually emitted by the [`Faq`](#mdx-content-components)
component), and `eventSchema(config, event)` — which returns **`null`** when
`startDate` is missing rather than fabricate a date.

### OG images

`buildOgImageUrl` builds the URL; you implement the image route with
[`next/og`](https://nextjs.org/docs/app/api-reference/functions/image-response):

```ts
// in generateMetadata for a page
import { buildOgImageUrl } from "@withseismic/geo-kit";

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  const ogImage = post.coverImage ?? buildOgImageUrl(geoConfig, {
    title: post.title,
    type: "blog",
    author: post.author,
  });
  return { openGraph: { images: [{ url: ogImage, width: 1200, height: 630 }] } };
}
```

Ensure a real default OG image exists at `geoConfig.ogImagePath` (a missing
default = broken share previews sitewide).

### RSS feed

`renderRssFeed` returns an XML string (framework-free):

```ts
// app/feed.xml/route.ts
import { renderRssFeed } from "@withseismic/geo-kit";
import { geoConfig } from "@/geo.config";

export const revalidate = 3600;

export async function GET() {
  const posts = await getAllPosts();
  const xml = renderRssFeed(
    geoConfig,
    posts.map((p) => ({
      title: p.title,
      path: `/blog/${p.slug}`,
      description: p.description,
      publishedAt: p.publishedAt,
      author: p.author,
      category: p.category,
    })),
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

Add `<link rel="alternate" type="application/rss+xml" href="/feed.xml">` sitewide
(in Next, via `metadata.alternates.types`).

### MDX content components

Register the components in your MDX map, then author with them:

```ts
import { KeyAnswer, Faq, FaqItem, StatCallout } from "@withseismic/geo-kit/react";
export const mdxComponents = { KeyAnswer, Faq, FaqItem, StatCallout };
```

```mdx
<KeyAnswer>
  The best afternoon tea near Exeter is Lympstone Manor (£50, estuary views);
  the best value is Wear Park at £5.50.
</KeyAnswer>

## Where should I go for a cheap option?

<StatCallout
  value="1 in 14"
  label="UK adults feel lonely often or always"
  source="ONS"
  sourceUrl="https://www.ons.gov.uk/…"
/>

<Faq>
  <FaqItem question="Where is the best afternoon tea in Exeter?" answer="…" />
  <FaqItem question="What is the cheapest option?" answer="…" />
</Faq>
```

`Faq` collects its `FaqItem` children and emits **FAQPage JSON-LD** automatically.
**String props only** — many MDX pipelines don't evaluate `items={[…]}`
attributes, hence nested `<FaqItem question="…" answer="…" />` children.

Components are unstyled (a `data-geo` hook + `className` passthrough) — style them
with your design system. `KeyAnswer`, `StatCallout`, `Faq`, `FaqItem`, `JsonLd`
are server-safe; only `AiReferralTracker` is a client component.

### In-process cron scheduler

Run scheduled jobs inside your always-on server (no separate cron service, no
cloud-cron minimum-interval floor). It POSTs your existing job endpoints on
localhost with a shared secret:

```ts
import { startScheduler, stopScheduler } from "@withseismic/geo-kit";
import { geoConfig } from "./geo.config";

const port = Number(process.env.PORT ?? 3000);
// ...start your HTTP server on `port`, then:
startScheduler({
  jobs: geoConfig.cronJobs ?? [],
  port,
  secret: process.env.CRON_SECRET!,
  // `enabled` defaults to process.env.ENABLE_IN_PROCESS_CRON === "true"
});
process.on("SIGTERM", () => stopScheduler());
```

- Set `ENABLE_IN_PROCESS_CRON=true` on **exactly one** always-on instance.
- Your job endpoints must require the `x-cron-secret` header.
- Make them idempotent (atomic claims) so a future multi-instance scale-up only
  causes redundant no-op ticks. `protect` + UTC are on by default.

### IndexNow

Push URLs to Bing (which grounds ChatGPT search). Wire `pingFromSitemap` behind a
secret-guarded endpoint and schedule it daily:

```ts
// app/api/cron/indexnow/route.ts
import { pingFromSitemap } from "@withseismic/geo-kit";
import { geoConfig } from "@/geo.config";

export async function POST(req: Request) {
  if (req.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await pingFromSitemap(geoConfig)); // ?dryRun handled by you
}
```

Then add `{ path: "/api/cron/indexnow", cron: "15 6 * * *" }` to
`geoConfig.cronJobs`. Requires `geoConfig.indexNowKey`, served as a text file at
`${siteUrl}/${indexNowKey}.txt`. Also `submitUrls(config, urls)` for ad-hoc
submits and `parseSitemapUrls(xml)`.

### Measurement

Most AI exposure is zero-click — triangulate several signals.

**AI-referral events** (client) — fire once per session when a visitor arrives
from an AI assistant:

```tsx
"use client";
import { AiReferralTracker } from "@withseismic/geo-kit/react";
import posthog from "posthog-js";

export function Analytics() {
  return <AiReferralTracker track={(e, props) => posthog.capture(e, props)} />;
}
```

**AI-bot fetch telemetry** (server/middleware) — `ChatGPT-User` / `Perplexity-User`
hits ≈ being used in a live answer:

```ts
// middleware.ts
import { NextResponse } from "next/server";
import { trackAiBotFetch } from "@withseismic/geo-kit";

export function middleware(req) {
  trackAiBotFetch({
    userAgent: req.headers.get("user-agent"),
    path: req.nextUrl.pathname,
    track: (event, props) => {
      // fire-and-forget to your analytics ingest
    },
  });
  return NextResponse.next();
}
```

**Search Console deltas** — run the bundled script (ADC auth with the
`webmasters.readonly` scope):

```bash
gcloud auth application-default login \
  --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform

GEO_GSC_SITE="sc-domain:yoursite.com" \
GEO_GSC_QUOTA_PROJECT="your-gcp-project" \
npx geo-kit-gsc-pull 28        # writes dated JSON to ./data, prints totals
```

For custom reporting, import the pure helpers: `sumTotals`, `pctChange`,
`formatPct`, `findQuery` (in `@withseismic/geo-kit`). Also run the monthly
[citation spot-checks](./templates/ai-citation-checks.md) — the ground truth —
and check the GSC generative-AI report + Bing Webmaster Tools AI Performance.

## Agent skills

Copy the skills into your project so Claude Code / agents can drive the work:

```bash
cp -r node_modules/@withseismic/geo-kit/skills/* .claude/skills/
```

- **`geo-audit`** — audits crawler access, indexability, structured data, on-page
  structure, and off-site/entity signals; emits a prioritized gap report.
- **`geo-content`** — writes/retrofits pages with answer-first structure,
  question headings, sourced stats, and FAQ schema.
- **`geo-measure`** — pulls the five measurement signals and reports deltas vs a
  baseline.

Each is self-contained (embeds the rules) so it works standalone.

## Go-to-market templates

Copy and fill the `{{placeholders}}`:

```bash
cp node_modules/@withseismic/geo-kit/templates/*.md docs/seo/
```

- `listings-pack.md` — GBP / Bing Places / Yelp / Foursquare details (local).
- `pr-targets.md` — digital-PR tiers, angles, and a placements log.
- `ai-citation-checks.md` — the monthly citation spot-check runbook.
- `wikidata-entity.md` — Wikidata item + statements, ready to publish.

## Non-Next stacks

The playbook, skills, templates, and all pure utilities transfer to any stack.
For non-Next apps, serializers turn the builder output into strings:

```ts
import { buildRobots, robotsToText, sitemapEntry, sitemapToXml } from "@withseismic/geo-kit";

const robotsTxt = robotsToText(buildRobots(geoConfig, { disallow: ["/api/"] }));
const sitemapXml = sitemapToXml([sitemapEntry(geoConfig, "/", { priority: 1 })]);
// renderRssFeed(...) already returns a string.
```

Serve `robotsTxt` / `sitemapXml` / the RSS string from any route handler. The
React components become reference implementations you copy and adapt.

## GeoConfig reference

| Field | Type | Required | Purpose |
| --- | --- | --- | --- |
| `siteUrl` | string | ✓ | Canonical site URL, no trailing slash |
| `brandName` | string | ✓ | Brand / Organization name |
| `description` | string | ✓ | One-line description (metadata + schema) |
| `locale` | string | ✓ | BCP-47, e.g. `en-GB` |
| `founder` | string | | Organization `founder` |
| `foundingDate` | string | | Founding year |
| `areaServed` | string[] | | Cities/regions (local + `areaServed`) |
| `knowsAbout` | string[] | | Authority topics (`knowsAbout`) |
| `sameAs` | string[] | | Social/profile URLs (`sameAs`) |
| `contactEmail` | string | | Public contact email |
| `targetIntents` | string[] | | Intents to win citations for |
| `ogImagePath` | string | | Default OG image path |
| `indexNowKey` | string | | IndexNow key |
| `aiReferrerSources` | AiReferrerSource[] | | Override referral sources (has a default) |
| `aiBotUserAgentPattern` | RegExp | | Override AI-bot UA match (has a default) |
| `cronJobs` | CronJob[] | | Scheduled jobs (`{ path, cron }`) |

Defaults `DEFAULT_AI_REFERRER_SOURCES` and `DEFAULT_AI_BOT_PATTERN` are exported
if you want to extend rather than replace them.

## Develop

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest (52 tests)
pnpm build       # tsup → dist/ (ESM + CJS + .d.ts for `.` and `./react`)
```

`dist/` is gitignored and built on install via the `prepare` script, so
`github:`-installs work without committing build output.

## The evidence

Every tactic is grounded in [`playbook/evidence.md`](./playbook/evidence.md),
which also flags the folklore to **skip**: `llms.txt` (no engine consumes it),
`speakable` schema, mass thin programmatic pages, and Reddit-seeding. Verify
against current sources — the landscape moves fast.
