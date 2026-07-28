"use client";

import { UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
 * Sign-out is a link to a route that does not exist until Phase 4; it is
 * rendered disabled rather than omitted so the menu's shape does not change
 * when Phase 4 lands.
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
        <DropdownMenuItem disabled>{labels.signOut}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AccountMenu };
