import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Wrench } from "lucide-react";

import { requireRole } from "@/lib/auth/dal";
import { EmptyState } from "@/components/margin/states";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Staff only. `requireRole` 404s rather than 403s for a signed-in student —
 * a 403 confirms that /admin exists, a 404 tells a probing student nothing.
 * See lib/auth/dal.ts.
 *
 * The gate is split into `AdminFrame` and wrapped in `<Suspense>` because
 * `requireRole` reads cookies, and under Cache Components an uncached read
 * outside `<Suspense>` blocks the whole route and fails the build.
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Suspense fallback={null}>
        <AdminFrame />
      </Suspense>
    </main>
  );
}

async function AdminFrame() {
  await requireRole("editor", "admin");

  const t = await getTranslations("frames.admin");

  return (
    <EmptyState
      className="measure-narrow"
      icon={Wrench}
      title={t("title")}
      description={t("description")}
    />
  );
}
