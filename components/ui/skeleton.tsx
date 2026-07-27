import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      // `animate-skeleton-pulse` rather than Tailwind's `animate-pulse`: the
      // stock one runs a 2s `cubic-bezier(0.4,0,0.6,1)` fade to 50% opacity,
      // which reads as a slow throb. The transitions.dev pulse is shorter,
      // shallower, and eased on our own curve, so a grid of placeholders
      // shimmers rather than breathes.
      className={cn("animate-skeleton-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
