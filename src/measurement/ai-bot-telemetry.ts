/**
 * AI-bot fetch telemetry.
 *
 * Counting requests from AI crawlers/assistants shows when your content is being
 * pulled for answers. `ChatGPT-User` / `Perplexity-User` hits are the closest
 * proxy for "used in a live answer" (vs `GPTBot` = model training). Wire
 * `trackAiBotFetch` into your server middleware (fire-and-forget).
 */

import { DEFAULT_AI_BOT_PATTERN } from "../config";

/** Return the matched AI-bot name for a user-agent, or null. */
export function matchAiBot(
  userAgent: string | null | undefined,
  pattern: RegExp = DEFAULT_AI_BOT_PATTERN,
): string | null {
  if (!userAgent) return null;
  const match = pattern.exec(userAgent);
  return match ? (match[1] ?? match[0]) : null;
}

export interface TrackAiBotFetchOptions {
  userAgent: string | null | undefined;
  path: string;
  /** Your analytics capture. Called only when an AI bot is detected. */
  track: (event: string, props: Record<string, unknown>) => void;
  pattern?: RegExp;
}

/**
 * Emit an `ai_bot_fetch` event when the request is from an AI bot. Returns the
 * bot name (or null). Never throws — telemetry must not affect serving.
 */
export function trackAiBotFetch(options: TrackAiBotFetchOptions): string | null {
  const bot = matchAiBot(options.userAgent, options.pattern);
  if (!bot) return null;
  try {
    options.track("ai_bot_fetch", {
      bot,
      path: options.path,
      user_agent: options.userAgent,
    });
  } catch {
    // swallow — never let telemetry break the request
  }
  return bot;
}
