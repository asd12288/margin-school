import { getTranslations, setRequestLocale } from "next-intl/server";
import { KeyRound } from "lucide-react";

import { EmptyState } from "@/components/margin/states";

/**
 * Frame only. The form — email/password, magic link, Google — is Phase 4.
 * The route exists now because the proxy already redirects here, and a
 * redirect to a 404 is worse than no redirect at all.
 */
export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("frames.signIn");

  return (
    <EmptyState icon={KeyRound} title={t("title")} description={t("description")} />
  );
}
