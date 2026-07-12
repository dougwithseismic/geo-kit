# geo-kit

A portable **AI-citation / GEO (Generative Engine Optimization) user-acquisition
kit**. It packages the reusable pieces for getting a website cited by AI search
engines — **ChatGPT search, Google AI Overviews / AI Mode, Perplexity, Claude** —
into one repo you drop into any project: a framework-agnostic playbook, agent
skills, Next.js/MDX components, portable infra, a measurement toolkit, and
go-to-market templates.

Everything brand- and domain-specific lives in **one config** (`GeoConfig`);
nothing else hard-codes a brand or URL.

## What's inside

| Path | What | How you use it |
| --- | --- | --- |
| [`playbook/`](./playbook) | The evidence base + decision rules + plan template | Read first; drive work from it |
| [`skills/`](./skills) | `geo-audit`, `geo-content`, `geo-measure` | Copy into `.claude/skills/` |
| [`src/config.ts`](./src/config.ts) | `GeoConfig` contract + defaults | Create your `geo.config.ts` |
| [`src/seo/`](./src/seo) | JSON-LD builders, OG-image URL, robots, sitemap | Import utilities |
| [`src/components/`](./src/components) | `KeyAnswer`, `Faq`/`FaqItem`, `StatCallout`, `JsonLd` | Copy/import (React + MDX) |
| [`src/feed/`](./src/feed) | RSS renderer | Import `renderRssFeed` |
| [`src/infra/`](./src/infra) | In-process cron scheduler, IndexNow | Import + wire ([README](./src/infra/README.md)) |
| [`src/measurement/`](./src/measurement) | GSC pull, AI-referral + AI-bot telemetry | Import + run |
| [`templates/`](./templates) | Listings, PR targets, citation checks, Wikidata | Fill placeholders |

## Install

```bash
# from GitHub (private repo — builds on install via the `prepare` script)
pnpm add github:dougwithseismic/geo-kit
# or, once published to a registry
pnpm add geo-kit
```

Two entry points keep React out of server code:

```ts
import { buildRobots, faqPageSchema } from "geo-kit";        // core — framework-free
import { Faq, FaqItem, KeyAnswer } from "geo-kit/react";     // components — needs react (peer)
```

Ships dual ESM/CJS with types. `react` is an **optional peer dependency** — only
needed if you import from `geo-kit/react`. The `geo-kit-gsc-pull` bin runs the
Search Console pull. Prefer not to install it? Every asset is also copy-paste
friendly (see below).

## Quickstart

1. **Read** [`playbook/README.md`](./playbook/README.md) — the decision rules —
   then run the `geo-audit` skill on your site (it starts by checking that AI
   crawlers aren't being blocked at the edge, the #1 failure mode).
2. **Create `geo.config.ts`** in your app from
   [`src/config.example.ts`](./src/config.example.ts):
   ```ts
   import { defineGeoConfig } from "geo-kit"; // or a relative/copied path
   export const geoConfig = defineGeoConfig({
     siteUrl: "https://yoursite.com",
     brandName: "Your Brand",
     description: "One sentence about you.",
     locale: "en-GB",
     // …founder, areaServed, knowsAbout, targetIntents, indexNowKey, cronJobs
   });
   ```
3. **Use the pieces** you need — e.g. AI-crawler-safe robots + FAQ schema:
   ```ts
   import { buildRobots, faqPageSchema } from "geo-kit";
   const robots = buildRobots(geoConfig, { disallow: ["/api/", "/admin/"] });
   ```
4. **Copy the skills** into `.claude/skills/` and drive content + measurement.

## Two usage modes

- **Import the utilities.** The pure-logic modules (config, `seo/*`, `feed/*`,
  `infra/*`, `measurement/{gsc,ai-referral,ai-bot-telemetry}`) are framework-free
  TypeScript — import them directly (workspace) or copy the files.
- **Copy the reference impls.** The React/MDX components and the Next-shaped
  helpers (robots/sitemap/RSS shapes, OG route params) are typed reference
  implementations. They use web-standard types (`Response`, plain object shapes)
  so the kit typechecks without a `next` dependency; copy them into your app and
  wire the framework glue (e.g. `MetadataRoute.Robots`, `"use client"`).

## Framework notes

- Components assume **React** + **Next.js App Router + MDX**. The playbook,
  skills, and pure utilities transfer to any stack; the components become
  reference implementations elsewhere.
- MDX gotcha baked into `Faq`: many MDX pipelines don't evaluate
  brace-expression attributes, so FAQ data is authored as nested
  `<FaqItem question="…" answer="…" />` string-prop children.

## Develop

```bash
pnpm install
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest (52 tests)
pnpm build       # tsup → dist/ (ESM + CJS + .d.ts for the `.` and `./react` entries)
```

## The evidence

Every tactic is grounded in [`playbook/evidence.md`](./playbook/evidence.md),
which also flags the folklore to skip (`llms.txt`, `speakable`, mass thin pages,
Reddit-seeding). Verify against current sources — the landscape moves fast.
