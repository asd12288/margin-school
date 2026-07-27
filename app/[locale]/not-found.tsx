import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/margin/states";
import { Link } from "@/i18n/navigation";

/**
 * Reached by `notFound()` from a page, and by `requireRole` when a student
 * probes a staff route — which is why this reads as an ordinary missing page
 * and never mentions permissions. A 403 would confirm that /admin exists.
 */
export default async function NotFound() {
  const t = await getTranslations("errors.notFound");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <EmptyState
        className="measure-narrow"
        icon={Compass}
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild>
            <Link href="/courses">{t("action")}</Link>
          </Button>
        }
      />
    </main>
  );
}
