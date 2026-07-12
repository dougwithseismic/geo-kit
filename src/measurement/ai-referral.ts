/**
 * AI-assistant referral attribution.
 *
 * Most AI-answer exposure is zero-click, so referrals undercount true
 * visibility — but a referrer is the strongest direct signal that a citation
 * converted into a visit. App traffic strips referrers, so treat this as a
 * floor, not a total.
 */

import { useEffect } from "react";
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

const SESSION_FLAG = "geo_ai_referral_tracked";

export interface AiReferralTrackerProps {
  /** Your analytics capture, e.g. `(event, props) => posthog.capture(event, props)`. */
  track: (event: string, props: Record<string, unknown>) => void;
  sources?: AiReferrerSource[];
}

/**
 * React reference component: fires an `ai_referral` event once per session when
 * the visitor arrived from an AI assistant. In Next.js App Router add
 * `"use client"` at the top of the file you copy this into (it uses hooks +
 * browser APIs). Render it once, high in the tree.
 */
export function AiReferralTracker({
  track,
  sources,
}: AiReferralTrackerProps): null {
  useEffect(() => {
    try {
      if (typeof document === "undefined" || !document.referrer) return;
      if (sessionStorage.getItem(SESSION_FLAG)) return;
      const source = matchAiReferrer(document.referrer, sources);
      if (!source) return;
      sessionStorage.setItem(SESSION_FLAG, "1");
      track("ai_referral", {
        ai_source: source,
        referrer: document.referrer,
        landing_path: window.location.pathname,
      });
    } catch {
      // sessionStorage unavailable (private mode) — skip silently.
    }
  }, [track, sources]);

  return null;
}
