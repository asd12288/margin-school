import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ResetPasswordForm } from "@/components/margin/auth/password-forms";
import { requireUser } from "@/lib/auth/dal";
import { getResetPasswordLabels } from "@/lib/auth/labels";

/**
 * Step two of the reset: choose the new password.
 *
 * The person here is **signed in** — `/auth/confirm` exchanged the emailed
 * token for a session before redirecting them — which is why this route is not
 * in `GUEST_ONLY_PREFIXES` and why the form carries no token.
 *
 * `requireUser()` reads cookies, so it lives in an inner component behind
 * `<Suspense>`. Under Cache Components an uncached cookie read outside a
 * boundary fails the build, not just the request — see
 * docs/ux-architecture.md. The header outside the boundary is what renders
 * instantly; only the gate streams.
 */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth.resetPassword");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-display-sm text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Suspense fallback={null}>
        <ResetPasswordFrame />
      </Suspense>
    </div>
  );
}

async function ResetPasswordFrame() {
  // Someone who opens this URL without a recovery link has no session, and
  // sending them to sign-in is the honest answer: there is nothing to reset
  // without one.
  await requireUser();

  return <ResetPasswordForm labels={await getResetPasswordLabels()} />;
}
