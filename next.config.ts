import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
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
