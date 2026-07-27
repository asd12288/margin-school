import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation.
 *
 * **Import `Link` from here, never from `next/link`.** These wrappers carry
 * the active locale into every href, so a French reader clicking a link stays
 * in French. A bare `next/link` to `/catalog` drops them onto the default
 * locale, which is the kind of bug that only shows up for the half of your
 * users you are not.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
