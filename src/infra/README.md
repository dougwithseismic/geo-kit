# Portable infra

## In-process cron scheduler (`scheduler.ts`)

Run scheduled jobs inside your always-on server instead of a separate cron
service. It POSTs your existing `/cron/*` endpoints on localhost with a shared
secret, so job logic is unchanged. No cloud-cron minimum-interval floor, so
every-minute jobs work.

Wire it into any Node HTTP server after it starts listening:

```ts
import { startScheduler, stopScheduler } from "geo-kit/infra/scheduler";
import { myConfig } from "./geo.config";

const port = Number(process.env.PORT ?? 3000);
// ... start your server on `port` ...

startScheduler({
  jobs: myConfig.cronJobs ?? [],
  port,
  secret: process.env.CRON_SECRET!,
  // enabled defaults to process.env.ENABLE_IN_PROCESS_CRON === "true"
});

process.on("SIGTERM", () => stopScheduler());
```

- Set `ENABLE_IN_PROCESS_CRON=true` on **exactly one** always-on instance.
- Your endpoints must require the `x-cron-secret` header.
- Make endpoints idempotent (atomic claims) so a future multi-instance scale-up
  only causes redundant no-op ticks, never double-processing.

## IndexNow (`indexnow.ts`)

`submitUrls(config, urls)` or `pingFromSitemap(config)` push URLs to Bing (which
grounds ChatGPT search). Run `pingFromSitemap` on a daily schedule via the
scheduler above, pointing a `/cron/indexnow-ping` endpoint at it. Requires
`config.indexNowKey`, served as `${siteUrl}/${indexNowKey}.txt`.
