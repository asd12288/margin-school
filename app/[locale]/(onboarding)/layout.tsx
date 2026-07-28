import { setRequestLocale } from "next-intl/server";

import { AuthLayout } from "@/components/margin/auth/auth-layout";
import { getOnboardingPanelLabels } from "@/lib/auth/onboarding-labels";

/**
 * Onboarding's own group, sharing the auth screens' two-column frame but not
 * their layout file.
 *
 * `(auth)` is for signed-out screens; this route is signed in. Merging them
 * would have produced a layout that sometimes sits behind a gate and sometimes
 * does not, and its panel copy has a different job here — someone who has just
 * created an account does not need to be sold the product again.
 *
 * As everywhere else, the gate is in the page rather than here: a layout does
 * not re-run on soft navigation between siblings, so a check here would be
 * walk-past-able.
 */
export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthLayout labels={await getOnboardingPanelLabels()}>{children}</AuthLayout>
  );
}
