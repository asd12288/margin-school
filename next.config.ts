import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points the plugin at i18n/request.ts, which resolves the locale and loads
// its messages for every server render.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * PPR by default, `use cache` opt-in, React <Activity> preserving state
   * across navigation — and the prerequisite for `unstable_instant`, which is
   * what turns "never read personal data above the Suspense boundary" from a
   * convention into a build failure. See docs/ux-architecture.md.
   */
  cacheComponents: true,
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "baziloo",
  project: "margin-school",

  // Source map upload runs only in CI, where SENTRY_AUTH_TOKEN exists.
  // Locally it is skipped so `npm run build` never fails on a missing token.
  silent: !process.env.CI,

  // Strip uploaded source maps from the client bundle so application
  // source is not publicly served.
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Proxy Sentry requests through our own domain so ad blockers do not
  // silently drop error reports.
  tunnelRoute: "/monitoring",
});
