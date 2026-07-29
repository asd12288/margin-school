import { defineConfig } from "vitest/config";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * `server-only` throws unless it is resolved under React's `react-server`
 * condition, which vitest does not set. Pointing it at the package's own empty
 * module is what lets a server-only file be unit tested at all — by file path,
 * because the package does not export that subpath.
 *
 * Resolved through Node rather than as `./node_modules/…` relative to this
 * file. An agent worktree under `.claude/worktrees` has no `node_modules` of
 * its own and resolves every package upward to the main checkout, so the
 * hand-built path pointed at a file that does not exist there — and the suite
 * died with "Cannot find package 'server-only'", which reads like a missing
 * dependency rather than a config anchored to the wrong directory. Same fault
 * fe9a723 fixed in the ESLint ignore patterns.
 */
const require = createRequire(import.meta.url);
const serverOnlyEmpty = fileURLToPath(
  new URL("empty.js", pathToFileURL(require.resolve("server-only")))
);

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": serverOnlyEmpty,
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
