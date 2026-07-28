import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { OnboardingForm } from "@/components/margin/auth/onboarding-form";
import { SignOutForm } from "@/components/margin/auth/sign-out-form";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getCurrentUser, isOnboarded, requireProfile } from "@/lib/auth/dal";
import { AFTER_SIGN_IN_PATH } from "@/lib/auth/routes";
import { getOnboardingLabels } from "@/lib/auth/onboarding-labels";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/auth/validation";

/**
 * The four questions, asked once.
 *
 * Blocking (ADR-0012): every other signed-in route calls
 * `requireOnboardedProfile()` and lands people here until it is done. This
 * page must therefore call `requireProfile()` and **not** the onboarded
 * variant, which would redirect to itself forever.
 *
 * The gate is split into an inner component behind `<Suspense>` because it
 * reads cookies, and under Cache Components an uncached cookie read outside a
 * boundary fails the build. The heading outside the boundary is what renders
 * instantly.
 */
export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("onboarding");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-display-sm text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Suspense fallback={null}>
        <OnboardingFrame locale={locale} />
      </Suspense>
    </div>
  );
}

async function OnboardingFrame({ locale }: { locale: string }) {
  const profile = await requireProfile();

  // Coming back to a finished onboarding is a dead end, not a form. The
  // proxy cannot catch this — it reads a cookie and never the database — so
  // the check lives here.
  if (isOnboarded(profile)) {
    redirect(getPathname({ href: AFTER_SIGN_IN_PATH, locale: asLocale(locale) }));
  }

  const t = await getTranslations("account");

  return (
    <div className="flex flex-col gap-8">
      <OnboardingForm
        labels={await getOnboardingLabels()}
        defaults={{
          displayName: await suggestedName(),
          // What they are reading right now, not `profile.locale` — the
          // profile still holds the schema default at this point, and
          // pre-selecting French for someone on an English page would be
          // answering the question wrong on their behalf.
          locale: asLocale(locale),
        }}
      />

      {/*
       * The way out.
       *
       * This screen blocks every other signed-in route (ADR-0012) and carries
       * no navigation, so without this the only exit is the logo — which leads
       * to the public site, where the account menu happens to have a sign-out.
       * Someone who signed in as the wrong account has no reason to guess
       * that. A blocking screen owes the reader a door.
       */}
      <div className="border-t border-border pt-6">
        <SignOutForm label={t("signOut")} />
      </div>
    </div>
  );
}

/**
 * A name from the identity provider, if there is one.
 *
 * `user_metadata` is **user-editable** — Supabase's own guidance is never to
 * make an authorization decision from it. Prefilling a text input is not one:
 * whatever comes out is shown back to its owner, revalidated by the action,
 * and written only to their own row. Truncated here anyway so an oversized
 * value cannot arrive pre-rejected by the length rule.
 */
async function suggestedName(): Promise<string | undefined> {
  const user = await getCurrentUser();
  const metadata = user?.user_metadata ?? {};

  const candidate =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : undefined;

  return candidate?.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) || undefined;
}

function asLocale(value: string): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}
