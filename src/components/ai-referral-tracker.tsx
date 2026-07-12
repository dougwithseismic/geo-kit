"use client";

import { useEffect } from "react";
import { matchAiReferrer } from "../measurement/ai-referral";
import type { AiReferrerSource } from "../config";

const SESSION_FLAG = "geo_ai_referral_tracked";

export interface AiReferralTrackerProps {
  /** Your analytics capture, e.g. `(event, props) => posthog.capture(event, props)`. */
  track: (event: string, props: Record<string, unknown>) => void;
  sources?: AiReferrerSource[];
}

/**
 * Fires an `ai_referral` event once per session when the visitor arrived from
 * an AI assistant. Client component (uses hooks + browser APIs). Render once,
 * high in the tree.
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
