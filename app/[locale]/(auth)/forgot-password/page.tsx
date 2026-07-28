import { getTranslations, setRequestLocale } from "next-intl/server";

import { ForgotPasswordForm } from "@/components/margin/auth/password-forms";
import { Link } from "@/i18n/navigation";
import { getForgotPasswordLabels } from "@/lib/auth/labels";

/** Step one of the reset: ask for the email. */
export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth.forgotPassword");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-display-sm text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <ForgotPasswordForm labels={await getForgotPasswordLabels()} />

      <p className="text-sm text-muted-foreground">
        <Link
          href="/sign-in"
          className="font-medium text-primary-text underline-offset-4 hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </p>
    </div>
  );
}
