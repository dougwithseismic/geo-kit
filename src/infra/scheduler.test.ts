import { describe, it, expect, afterEach, vi } from "vitest";
import { Cron } from "croner";
import { startScheduler, stopScheduler } from "./scheduler";
import type { CronJob } from "../config";

const jobs: CronJob[] = [
  { path: "/cron/a", cron: "* * * * *" },
  { path: "/cron/b", cron: "*/5 * * * *" },
  { path: "/cron/c", cron: "0 6 * * *" },
];

const opts = () => ({
  jobs,
  port: 3999,
  secret: "s",
  enabled: true,
  fetchImpl: vi.fn() as unknown as typeof fetch,
});

describe("startScheduler", () => {
  afterEach(() => stopScheduler());

  it("returns 0 when disabled", () => {
    expect(startScheduler({ ...opts(), enabled: false })).toBe(0);
  });

  it("returns 0 when the secret is missing", () => {
    expect(startScheduler({ ...opts(), secret: "" })).toBe(0);
  });

  it("returns 0 when there are no jobs", () => {
    expect(startScheduler({ ...opts(), jobs: [] })).toBe(0);
  });

  it("registers every job when enabled with a secret", () => {
    expect(startScheduler(opts())).toBe(jobs.length);
  });
});

describe("job schedules", () => {
  it("are all valid cron expressions", () => {
    for (const job of jobs) {
      const c = new Cron(job.cron, { timezone: "UTC", paused: true });
      expect(c.nextRun()).toBeInstanceOf(Date);
      c.stop();
    }
  });
});
