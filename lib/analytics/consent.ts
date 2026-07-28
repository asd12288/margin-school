/**
 * Analytics consent, CNIL-style: nothing loads, and no identifier is
 * written, until the visitor actively agrees.
 *
 * This is why PostHog is initialised lazily rather than configured with
 * `opt_out_capturing_by_default` — opting out still loads the library and
 * can still touch storage. Not loading it at all is unambiguous.
 *
 * See docs/environments.md and docs/product.md (compliance posture).
 */

export const CONSENT_STORAGE_KEY = "ms-analytics-consent";
export const CONSENT_CHANGE_EVENT = "ms-analytics-consent-change";

export type ConsentState = "granted" | "denied" | "unset";

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unset";

  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : "unset";
  } catch {
    // Storage can throw in private mode or when blocked. Treat as no consent.
    return "unset";
  }
}

function writeConsent(state: Exclude<ConsentState, "unset">) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, state);
  } catch {
    // Non-fatal: consent simply will not persist across reloads.
  }

  window.dispatchEvent(
    new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }),
  );
}

export function grantAnalyticsConsent() {
  writeConsent("granted");
}

export function denyAnalyticsConsent() {
  writeConsent("denied");
}

/**
 * Withdraws whatever choice was made and returns state to "unset", which is
 * what brings `ConsentBanner` back. CNIL requires withdrawal to be exactly as
 * easy as consent — this is the footer's "cookie preferences" control, the
 * only way a visitor has to change their mind after the first decision.
 *
 * Same shape as `writeConsent`: clear storage, then dispatch the event
 * `useConsent`'s subscribers are listening for. Skipping the dispatch would
 * leave every open tab showing the old state until the next reload.
 */
export function resetAnalyticsConsent() {
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Non-fatal, same as writeConsent: the choice simply won't persist.
  }

  window.dispatchEvent(
    new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: "unset" }),
  );
}
