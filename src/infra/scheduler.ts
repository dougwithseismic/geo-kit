/**
 * In-process cron scheduler — run scheduled jobs inside an already-always-on
 * server instead of paying for a separate cron service.
 *
 * It triggers your existing HTTP job endpoints on localhost with a shared
 * secret header, so the job logic (and its tests) stay exactly as they are. An
 * in-process timer also has no cloud-cron minimum-interval floor, so
 * every-minute jobs keep working.
 *
 * Safe on a single instance. Under multi-instance scale-up, make your job
 * endpoints idempotent (atomic claims) — the worst case is redundant no-op ticks.
 * Gate with `ENABLE_IN_PROCESS_CRON=true` so it runs on exactly one instance.
 */

import { Cron } from "croner";
import type { CronJob } from "../config";

export interface StartSchedulerOptions {
  /** Jobs to schedule, e.g. `config.cronJobs ?? []`. */
  jobs: CronJob[];
  /** Port the server listens on (localhost trigger target). */
  port: number;
  /** Shared secret sent as `x-cron-secret` (your endpoints must require it). */
  secret: string;
  /** Defaults to `process.env.ENABLE_IN_PROCESS_CRON === "true"`. */
  enabled?: boolean;
  /** Trigger host (default `http://127.0.0.1`). */
  host?: string;
  /** Timezone for cron expressions (default `UTC`). */
  timezone?: string;
  /** Injectable fetch (for tests). */
  fetchImpl?: typeof fetch;
}

let scheduled: Cron[] = [];

/**
 * Start the scheduler. No-op (returns 0) when disabled, when `secret` is
 * missing, or when there are no jobs. Returns the number of jobs registered.
 */
export function startScheduler(options: StartSchedulerOptions): number {
  const enabled =
    options.enabled ?? process.env.ENABLE_IN_PROCESS_CRON === "true";
  if (!enabled) return 0;
  if (!options.secret) return 0;
  if (!options.jobs.length) return 0;

  const host = (options.host ?? "http://127.0.0.1").replace(/\/$/, "");
  const timezone = options.timezone ?? "UTC";
  const fetchImpl = options.fetchImpl ?? fetch;

  scheduled = options.jobs.map(
    (job) =>
      new Cron(
        job.cron,
        { name: job.path, timezone, protect: true },
        async () => {
          const url = `${host}:${options.port}${job.path}`;
          try {
            const res = await fetchImpl(url, {
              method: "POST",
              headers: { "x-cron-secret": options.secret },
            });
            if (!res.ok) {
              const body = await res.text().catch(() => "");
              console.error(
                `[Scheduler] ${job.path} -> ${res.status} ${body.slice(0, 200)}`,
              );
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.error(`[Scheduler] ${job.path} failed: ${message}`);
          }
        },
      ),
  );
  return scheduled.length;
}

/** Stop all scheduled jobs (call on graceful shutdown). */
export function stopScheduler(): void {
  for (const job of scheduled) job.stop();
  scheduled = [];
}
