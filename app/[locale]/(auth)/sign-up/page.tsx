import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserPlus } from "lucide-react";

import { EmptyState } from "@/components/margin/states";

/** Frame only. The form is Phase 4. */
export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("frames.signUp");

  return (
    <EmptyState icon={UserPlus} title={t("title")} description={t("description")} />
  );
}
