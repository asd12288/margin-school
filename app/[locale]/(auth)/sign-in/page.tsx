import { getTranslations, setRequestLocale } from "next-intl/server";

import { GoogleButton } from "@/components/margin/auth/google-button";
import { SignInForm } from "@/components/margin/auth/sign-in-form";
import { Link } from "@/i18n/navigation";
import { getSignInLabels } from "@/lib/auth/labels";
import { GOOGLE_SIGN_IN_ENABLED } from "@/lib/auth/providers";

/**
 * Signing in.
 *
 * Fully prerendered, per docs/ux-architecture.md's route table. It reads
 * nothing from the request: the `next` and `error` query parameters this page
 * cares about are read inside the client form instead — see the note in
 * `SignInForm` for why awaiting `searchParams` here would have cost both the
 * build and the instant render.
 */
export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth.signIn");
  const labels = await getSignInLabels();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-display-sm text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {GOOGLE_SIGN_IN_ENABLED ? <GoogleButton labels={labels} /> : null}

      <SignInForm labels={labels} />

      <p className="text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary-text underline-offset-4 hover:underline"
        >
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
