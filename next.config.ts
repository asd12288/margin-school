import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points the plugin at i18n/request.ts, which resolves the locale and loads
// its messages for every server render.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * Cache Components: PPR by default, `use cache` to opt in, and React
   * <Activity> preserving component state across client navigation.
   *
   * It is also the enforcement mechanism this project wanted. With it on,
   * reading uncached dynamic data — cookies, headers, searchParams — outside
   * a Suspense boundary fails the build instead of silently making the route
   * dynamic. That is what stops a session read in the header quietly costing
   * Tier 1 in docs/ux-architecture.md.
   *
   * `unstable_instant` is a narrower per-route opt-in layered on top: it
   * validates that client navigation into a route is instant at every shared
   * layout boundary. It does not provide the build failure above — this flag
   * does.
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
