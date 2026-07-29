import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` throws unless it is resolved under React's `react-server`
      // condition, which vitest does not set. Pointing it at the package's own
      // empty module is what lets a server-only file be unit tested at all —
      // by file path, because the package does not export that subpath.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // The token test compiles Tailwind, which is slower than a pure unit test
    // but still well under a second.
    testTimeout: 20_000,
  },
});
