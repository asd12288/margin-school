import { getTranslations, setRequestLocale } from "next-intl/server";

import { GoogleButton } from "@/components/margin/auth/google-button";
import { SignUpForm } from "@/components/margin/auth/sign-up-form";
import { Link } from "@/i18n/navigation";
import { getSignUpLabels } from "@/lib/auth/labels";
import { GOOGLE_SIGN_IN_ENABLED } from "@/lib/auth/providers";

/**
 * Creating an account.
 *
 * No price anywhere on this screen, and no trial countdown. ADR-0001 puts
 * commerce on `/pricing` and nowhere else; a sign-up form that starts
 * negotiating is exactly the Udemy pattern docs/ux-architecture.md rules out.
 */
export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth.signUp");
  const labels = await getSignUpLabels();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-display-sm text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {GOOGLE_SIGN_IN_ENABLED ? <GoogleButton labels={labels} /> : null}

      <SignUpForm labels={labels} />

      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary-text underline-offset-4 hover:underline"
        >
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
