"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/**
 * Signing out.
 *
 * A `<form>` with a server action, not a link. Sign-out is a state change, and
 * a `GET` that ends a session is the classic CSRF footgun: any page anywhere
 * could sign our users out with an `<img src="/sign-out">`. It is also why
 * there is no `/sign-out` route at all — there is nothing to navigate to.
 *
 * Server actions carry Next's own origin check, so the POST cannot be forged
 * cross-site either.
 */
function SignOutForm({
  label,
  className,
  variant = "button",
}: {
  label: string;
  className?: string;
  /** `menuitem` for the account dropdown, `button` for the account page. */
  variant?: "button" | "menuitem";
}) {
  if (variant === "menuitem") {
    return (
      <form action={signOutAction} className={className}>
        {/*
         * Styled to match `DropdownMenuItem` rather than nested inside one.
         * Radix's item swallows the click to close the menu, which cancels
         * the submit — so the button *is* the item.
         */}
        <button
          type="submit"
          className={cn(
            "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
            "transition-colors duration-fast ease-quiet",
            "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent",
          )}
        >
          <LogOut className="size-4 text-muted-foreground" />
          {label}
        </button>
      </form>
    );
  }

  return (
    <form action={signOutAction} className={className}>
      <Button type="submit" variant="outline">
        <LogOut data-icon="inline-start" />
        {label}
      </Button>
    </form>
  );
}

export { SignOutForm };
