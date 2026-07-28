"use client";

import { resetAnalyticsConsent } from "@/lib/analytics/consent";
import { cn } from "@/lib/utils";

/**
 * The footer's withdrawal control. CNIL requires that a visitor can take
 * back analytics consent as easily as they gave it — before this existed,
 * there was no way to, short of clearing site data by hand.
 *
 * `resetAnalyticsConsent` clears the stored choice and dispatches the same
 * change event `ConsentBanner` already subscribes to via `useConsent`, so
 * clicking this brings the banner straight back. No extra wiring needed here.
 */
function CookiePreferencesButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => resetAnalyticsConsent()}
      className={cn(
        "rounded-4xl text-sm text-muted-foreground outline-none",
        "underline-offset-4 transition-colors duration-fast ease-quiet",
        "hover:text-foreground hover:underline",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      {label}
    </button>
  );
}

export { CookiePreferencesButton };
