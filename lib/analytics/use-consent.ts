"use client";

import { useSyncExternalStore } from "react";

import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  type ConsentState,
} from "@/lib/analytics/consent";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  // `storage` fires in *other* tabs, so a decision made in one tab is
  // respected everywhere without a reload.
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** The server cannot know the visitor's choice, so it always renders as unset. */
const getServerSnapshot = (): ConsentState => "unset";

/**
 * Consent is an external store — a localStorage value plus an event to
 * subscribe to — so it is read with the hook designed for exactly that,
 * rather than mirrored into component state inside an effect.
 *
 * `readConsent` returns a string, compared by value, so repeated snapshots are
 * stable and this cannot loop.
 */
export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, readConsent, getServerSnapshot);
}
