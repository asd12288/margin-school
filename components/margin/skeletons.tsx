import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading states, per the skeleton rules in docs/ux-architecture.md.
 *
 * The pulse comes from the transitions.dev skeleton recipe, retimed onto
 * `--ease-quiet-in-out` and applied in `ui/skeleton.tsx` so every placeholder
 * gets it. The recipe's other half — cross-fading the placeholder into the
 * real content — is deliberately not built: nothing in the app streams real
 * data yet, and an unused reveal would just be dead CSS.
 *
 * The rules these obey, since they are easy to break by accident:
 *
 * 1. **Layout-identical.** Each skeleton matches the real component's
 *    dimensions, so nothing shifts when the content arrives. A skeleton that
 *    causes layout shift is worse than a spinner.
 * 2. **Never the shell.** There is deliberately no skeleton here for
 *    navigation, sidebar or page header — those render instantly from cache,
 *    always.
 * 3. **Component-level.** These belong inside a Suspense boundary around the
 *    one slow region, not in a `loading.tsx` that blinks the whole route.
 * 4. **Unknown-length lists get 3–6 placeholders**, never a guess at the real
 *    count. `CourseGridSkeleton` defaults to 6.
 */

function CourseCardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="course-card-skeleton"
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-5 shadow-card",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="size-[34px] rounded-4xl" />
      </div>
      <Skeleton className="mt-3 h-5 w-4/5" />
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <div className="mt-5 flex gap-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function CourseGridSkeleton({
  count = 6,
  className,
  ...props
}: React.ComponentProps<"div"> & { count?: number }) {
  return (
    <div
      data-slot="course-grid-skeleton"
      aria-busy
      className={cn(
        "grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))] gap-4",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** The reading column while a lesson streams in. Line lengths are uneven on
 *  purpose — a stack of identical bars reads as a loading bar, not as text. */
function LessonSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  const lines = [
    "w-full",
    "w-full",
    "w-11/12",
    "w-full",
    "w-4/5",
    "w-full",
    "w-full",
    "w-3/5",
  ];

  return (
    <div
      data-slot="lesson-skeleton"
      aria-busy
      className={cn("measure-prose flex flex-col", className)}
      {...props}
    >
      <Skeleton className="h-8 w-3/5" />
      <div className="mt-6 flex flex-col gap-3">
        {lines.slice(0, 4).map((w, i) => (
          <Skeleton key={i} className={cn("h-4", w)} />
        ))}
      </div>
      <Skeleton className="mt-8 h-[300px] w-full rounded-xl" />
      <div className="mt-8 flex flex-col gap-3">
        {lines.slice(4).map((w, i) => (
          <Skeleton key={i} className={cn("h-4", w)} />
        ))}
      </div>
    </div>
  );
}

function CurriculumSkeleton({
  chapters = 4,
  className,
  ...props
}: React.ComponentProps<"div"> & { chapters?: number }) {
  return (
    <div
      data-slot="curriculum-skeleton"
      aria-busy
      className={cn("flex w-full flex-col", className)}
      {...props}
    >
      {Array.from({ length: chapters }, (_, i) => (
        <div key={i} className="flex flex-col gap-2 border-b border-border py-3.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="ml-auto h-3 w-8" />
          </div>
          <Skeleton className="h-1 w-full rounded-4xl" />
        </div>
      ))}
    </div>
  );
}

export {
  CourseCardSkeleton,
  CourseGridSkeleton,
  CurriculumSkeleton,
  LessonSkeleton,
};
