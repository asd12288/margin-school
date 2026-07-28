"use client";

import { UserRound } from "lucide-react";

import { SignOutForm } from "@/components/margin/auth/sign-out-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";

export interface AccountMenuLabels {
  menu: string;
  account: string;
  myCourses: string;
  admin: string;
  signOut: string;
}

/**
 * The signed-in control. Client, because it opens.
 *
 * Sign-out is a submit button in its own form rather than a
 * `DropdownMenuItem`. Radix's item calls `preventDefault` to close the menu,
 * which cancels the submit before it reaches the action — the menu closes and
 * nothing else happens. `SignOutForm` carries the item's styling instead; see
 * the note there for why it is a POST and not a link.
 */
function AccountMenu({
  labels,
  isStaff,
}: {
  labels: AccountMenuLabels;
  isStaff: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.menu}
        className="flex size-8 items-center justify-center rounded-4xl border border-border bg-muted text-muted-foreground outline-none transition-colors duration-fast ease-quiet hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserRound className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/learn">{labels.myCourses}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">{labels.account}</Link>
        </DropdownMenuItem>
        {isStaff ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">{labels.admin}</Link>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />
        <SignOutForm variant="menuitem" label={labels.signOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AccountMenu };
