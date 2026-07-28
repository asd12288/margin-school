import { setRequestLocale } from "next-intl/server";

import { AuthLayout } from "@/components/margin/auth/auth-layout";
import { getAuthPanelLabels } from "@/lib/auth/labels";

/**
 * Sign in, sign up, and both halves of the password reset.
 *
 * Deliberately no navigation: one job per screen. What replaced the empty
 * frame is a second column carrying the brand — see
 * `components/margin/auth/auth-layout.tsx` for what is allowed in it and why.
 *
 * `/onboarding` is **not** in this group. It is a signed-in route with its own
 * gate and its own layout, and putting it here would have meant a layout that
 * sometimes checks a session and sometimes does not.
 */
export default async function AuthGroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthLayout labels={await getAuthPanelLabels()}>{children}</AuthLayout>;
}
