"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Catches failures in the root layout itself, which the segment boundaries
 * cannot reach.
 *
 * No provider, theme or translation is alive above this — the tree that would
 * have supplied them is the tree that failed. Hence its own <html>, inline
 * styles, and English-only copy: a hardcoded string here is not a rule 7
 * violation, it is the only thing that can render.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0b0b0f",
          color: "#e9e9ee",
        }}
      >
        <main style={{ maxWidth: "32rem", padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>
            The page could not be loaded. It has been reported. Please reload.
          </p>
        </main>
      </body>
    </html>
  );
}
