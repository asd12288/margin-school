import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UserRound } from "lucide-react";

import { requireProfile } from "@/lib/auth/dal";
import { EmptyState } from "@/components/margin/states";

/**
 * Frame. Profile, language and delete-account are Phase 4.
 *
 * The gate is split into `AccountFrame` and wrapped in `<Suspense>` because
 * `requireProfile` reads cookies, and under Cache Components an uncached
 * read outside `<Suspense>` blocks the whole route and fails the build.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <AccountFrame />
      </Suspense>
    </main>
  );
}

async function AccountFrame() {
  await requireProfile();

  const t = await getTranslations("frames.account");

  return (
    <EmptyState
      className="measure-narrow"
      icon={UserRound}
      title={t("title")}
      description={t("description")}
    />
  );
}
