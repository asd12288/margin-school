"use client";

import type * as React from "react";

import { ErrorState } from "@/components/margin/states";

/**
 * The only interactive part of the states section, kept in its own client
 * module so the rest of the showcase stays a server component. `onRetry` is a
 * function, and functions do not cross the server/client boundary as props.
 *
 * `headingLevel` is threaded through rather than hardcoded because this demo
 * is rendered inside `StatesShowcase`'s own `<Section>`, which already owns
 * an `<h2>` — `ErrorState` cannot know that from inside this file either.
 */
function ErrorStateDemo({
  headingLevel,
}: {
  headingLevel?: React.ComponentProps<typeof ErrorState>["headingLevel"];
}) {
  return (
    <ErrorState
      title="We could not load your courses"
      description="Your progress is safe. This is usually momentary."
      headingLevel={headingLevel}
      retryLabel="Try again"
      onRetry={() => {}}
    />
  );
}

export { ErrorStateDemo };
