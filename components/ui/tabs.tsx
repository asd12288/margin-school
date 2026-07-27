"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Adapted from the shadcn default to slide the active indicator between tabs,
 * per the transitions.dev tabs recipe.
 *
 * Upstream paints the active state on the trigger itself — `data-active:bg-background`
 * for the pill variant, an `::after` underline for the line variant — so
 * switching tabs snaps: one trigger's background disappears as another's
 * appears. To make it travel, the indicator has to stop belonging to any
 * trigger and become a single element the list positions.
 *
 * That is the part CSS cannot do alone. A pill cannot tween between two
 * siblings' boxes, so JS measures the active trigger and writes its offset and
 * size onto the indicator; CSS owns the tween. This is the one component in
 * the system that genuinely needs measurement.
 *
 * Three things the recipe is explicit about, all of which are load-bearing:
 *
 * - **First paint and resize must not animate.** Otherwise the pill flies in
 *   from `translateX(0)` with `width: 0` on mount, and lurches after every
 *   resize. Handled with `data-animate="false"` plus a forced reflow rather
 *   than by mutating and restoring inline transition styles.
 * - **Re-measure when the active tab changes**, including keyboard and
 *   programmatic changes — hence a MutationObserver on `data-state` rather
 *   than a click handler.
 * - **Re-measure when the box changes.** A ResizeObserver watches the list and
 *   every trigger, so a late-loading font or a locale switch (French labels
 *   run 15–20% longer) repositions the pill instead of leaving it stranded.
 */

// useLayoutEffect warns during SSR; the measurement only means anything in a
// browser, so fall back to useEffect on the server.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const indicatorRef = React.useRef<HTMLSpanElement>(null)

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!list || !indicator) return

    const place = (animate: boolean) => {
      const active = list.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]'
      )

      // No active tab is a real state on a controlled Tabs with no value.
      // Hide rather than park the indicator at the origin.
      if (!active) {
        indicator.style.opacity = "0"
        return
      }

      const vertical =
        list.closest('[data-slot="tabs"]')?.getAttribute("data-orientation") ===
        "vertical"

      // The transition stays armed by default and is suspended only around an
      // un-animated write. Doing it the other way round — parking at
      // `animate="false"` and flipping to `"true"` alongside the new position —
      // silently kills the tween: the browser sees `transition-property` go
      // from `none` to transitionable in the same style recalculation as the
      // value change, and a transition only starts when the property was
      // already transitionable in the previous computed style.
      if (!animate) indicator.dataset.animate = "false"

      if (vertical) {
        indicator.style.transform = `translateY(${active.offsetTop}px)`
        indicator.style.height = `${active.offsetHeight}px`
        indicator.style.width = ""
      } else {
        indicator.style.transform = `translateX(${active.offsetLeft}px)`
        indicator.style.width = `${active.offsetWidth}px`
        indicator.style.height = ""
      }

      indicator.style.opacity = "1"

      if (!animate) {
        // Land the write, then re-arm, so the next change tweens from here.
        void indicator.offsetWidth
        indicator.dataset.animate = "true"
      }
    }

    place(false)

    // Covers click, keyboard and programmatic value changes alike.
    const activeObserver = new MutationObserver(() => place(true))
    activeObserver.observe(list, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    })

    const sizeObserver = new ResizeObserver(() => place(false))
    sizeObserver.observe(list)
    list
      .querySelectorAll('[data-slot="tabs-trigger"]')
      .forEach((trigger) => sizeObserver.observe(trigger))

    return () => {
      activeObserver.disconnect()
      sizeObserver.disconnect()
    }
  }, [])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      <span
        ref={indicatorRef}
        data-slot="tabs-indicator"
        data-animate="true"
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 opacity-0 will-change-transform",
          "transition-[transform,width,height] duration-base ease-quiet",
          // The escape hatch for first paint and resize.
          "data-[animate=false]:transition-none",
          variant === "default"
            ? [
                "rounded-md bg-background shadow-sm dark:bg-input/30",
                "group-data-horizontal/tabs:inset-y-[3px]",
                "group-data-vertical/tabs:inset-x-[3px]",
              ]
            : [
                "rounded-4xl bg-foreground",
                "group-data-horizontal/tabs:bottom-[-5px] group-data-horizontal/tabs:h-0.5",
                "group-data-vertical/tabs:-right-1 group-data-vertical/tabs:w-0.5",
              ]
        )}
      />
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // `z-10` keeps the label above the indicator, which is painted behind
        // it in the same stacking context.
        "relative z-10 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Only the colour changes on the trigger now. The background, shadow
        // and underline moved to the sliding indicator — leaving them here
        // would paint a second, stationary pill under the travelling one.
        "transition-colors duration-base ease-quiet",
        "data-active:text-foreground dark:data-active:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
