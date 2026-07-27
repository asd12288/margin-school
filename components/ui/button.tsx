import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Adapted from the shadcn default. Owning this file is the whole reason we
 * install components instead of a library, and the button is where it pays.
 *
 * What changed and why:
 *
 * - **Taller.** shadcn ships `h-8`, which reads cramped next to a 15px UI
 *   font. Default is `h-9`, large is `h-10`.
 * - **The primary action is lit.** A coloured shadow (`--shadow-brand`) plus a
 *   one-pixel inset highlight (`--highlight`) gives it a lift nothing else in
 *   the interface has, so the main action on a page is unmistakable without
 *   being bigger or louder than its neighbours.
 * - **Trailing icons nudge on hover.** A 2px travel on `data-icon="inline-end"`
 *   — enough to feel responsive, small enough that nobody consciously notices.
 * - **Press is physical.** One pixel down plus a collapsed shadow, so the
 *   button reads as depressed rather than merely recoloured.
 *
 * Every one of those is a token. There is no raw colour or duration here.
 */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center",
    "rounded-lg border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap select-none",
    // Buttons look clickable, so they should feel clickable. shadcn leaves
    // this off by default (native buttons show an arrow); we opt in.
    "cursor-pointer",
    "transition-[background-color,border-color,box-shadow,transform,color] duration-fast ease-quiet",
    "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // The nudge. Scoped to trailing icons so a leading icon never drifts away
    // from its label.
    "[&_[data-icon=inline-end]]:transition-transform [&_[data-icon=inline-end]]:duration-base [&_[data-icon=inline-end]]:ease-quiet",
    "hover:[&_[data-icon=inline-end]]:translate-x-0.5",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground shadow-brand",
          "ring-1 ring-highlight ring-inset",
          "hover:bg-primary/90",
          "active:shadow-card",
        ],
        outline: [
          "border-border bg-card text-foreground shadow-card",
          "hover:border-border-strong hover:bg-muted",
          "aria-expanded:border-border-strong aria-expanded:bg-muted",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ],
        ghost: [
          "text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground shadow-card",
          "ring-1 ring-highlight ring-inset",
          "hover:bg-destructive/90",
          "focus-visible:border-destructive focus-visible:ring-destructive/30",
        ],
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-md px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[0.8125rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 text-[0.9375rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs":
          "size-7 rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-md in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
