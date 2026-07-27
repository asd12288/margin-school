"use client";

import { ErrorState } from "@/components/margin/states";

/**
 * The only interactive part of the states section, kept in its own client
 * module so the rest of the showcase stays a server component. `onRetry` is a
 * function, and functions do not cross the server/client boundary as props.
 */
function ErrorStateDemo() {
  return (
    <ErrorState
      title="We could not load your courses"
      description="Your progress is safe. This is usually momentary."
      retryLabel="Try again"
      onRetry={() => {}}
    />
  );
}

export { ErrorStateDemo };
