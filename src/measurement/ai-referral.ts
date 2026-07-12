/**
 * AI-assistant referral attribution (pure).
 *
 * Most AI-answer exposure is zero-click, so referrals undercount true
 * visibility — but a referrer is the strongest direct signal that a citation
 * converted into a visit. App traffic strips referrers, so treat this as a
 * floor, not a total.
 *
 * The React tracker component lives in `../components/ai-referral-tracker`
 * (exported from `geo-kit/react`) so this module stays framework-free.
 */

import {
  DEFAULT_AI_REFERRER_SOURCES,
  type AiReferrerSource,
} from "../config";

/** Return the AI source id for a referrer string, or null if it isn't one. */
export function matchAiReferrer(
  referrer: string | null | undefined,
  sources: AiReferrerSource[] = DEFAULT_AI_REFERRER_SOURCES,
): string | null {
  if (!referrer) return null;
  return sources.find((s) => s.pattern.test(referrer))?.id ?? null;
}
