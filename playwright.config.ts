import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Chromium at a phone viewport, not WebKit. The point here is the responsive
    // layout, not engine differences, and pinning to Chromium keeps CI to one
    // browser download.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Tests run against a production build. The design system is about what
  // ships: `next dev` renders with different CSS ordering and keeps the dev
  // overlay in the tree, both of which change what an accessibility scan sees.
  webServer: {
    command: `npx next build && npx next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
