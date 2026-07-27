import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, type Locale } from "./routing";

/**
 * Resolves the locale for a server render and loads its messages.
 *
 * **Nothing dynamic is read here, and that is the point.**
 *
 * The obvious interim move — resolve the locale from a cookie until URL
 * routing lands — was built and reverted. Reading cookies opts every render
 * into dynamic rendering: it turned `/` and `/design-system` from `○` to `ƒ`
 * in the build output, which breaks Tier 1 in docs/ux-architecture.md
 * ("a skeleton in Tier 1 is a bug… this is also what makes SEO work") for a
 * mechanism docs/content-model.md rule 4 rejects anyway, because a cookie
 * gives Google one URL for two languages.
 *
 * So until PRO-152 adds the `[locale]` segment, everything renders in the
 * default locale and stays static. `requestLocale` is already read, so the
 * moment that segment exists this file needs no change: the segment populates
 * it, each locale prerenders separately, and locale switching becomes a link
 * rather than a cookie write.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Populated by a `[locale]` route segment. Undefined until PRO-152.
  const requested = await requestLocale;
  const locale: Locale = isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Explicit rather than inherited from the host: a build machine in UTC and
    // a reader in Paris must format the same date identically.
    timeZone: "Europe/Paris",
  };
});
