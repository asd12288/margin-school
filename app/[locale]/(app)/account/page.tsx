import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  DeleteAccountForm,
  PasswordForm,
  ProfileForm,
} from "@/components/margin/auth/account-forms";
import { SignOutForm } from "@/components/margin/auth/sign-out-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser, isStaff, requireOnboardedProfile } from "@/lib/auth/dal";
import {
  getDeleteAccountLabels,
  getPasswordFormLabels,
  getProfileFormLabels,
} from "@/lib/auth/account-labels";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Everything a person can change about themselves.
 *
 * Billing is not here — `/account/billing` is Phase 10 and has nothing to show
 * until Stripe exists. Neither is changing the email address: it needs a
 * double confirmation (old address and new), and shipping half of that is
 * worse than saying it is not available yet, which the section does.
 *
 * The gate is split behind `<Suspense>` for the usual Cache Components reason
 * — see docs/ux-architecture.md. The heading renders instantly; everything
 * personal streams.
 */
export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("account");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-display-sm text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Suspense fallback={null}>
        <AccountFrame />
      </Suspense>
    </main>
  );
}

async function AccountFrame() {
  const profile = await requireOnboardedProfile();
  const user = await getCurrentUser();

  const t = await getTranslations("account");

  return (
    <div className="mt-10 flex flex-col gap-10">
      {/* Email + role. Read-only facts, so no form. */}
      <Section title={t("email.title")} description={t("email.description")}>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-foreground">{user?.email}</p>
          {/*
           * The role badge appears only for staff. A student seeing "Student"
           * learns nothing and invites the question of what else there is —
           * and roles are not a status ladder (no gamification, per
           * docs/design-system.md).
           */}
          {isStaff(profile) ? (
            <Badge variant="secondary">{t(`role.${profile.role}`)}</Badge>
          ) : null}
        </div>
      </Section>

      <Separator />

      <Section title={t("profile.title")} description={t("profile.description")}>
        <ProfileForm
          labels={await getProfileFormLabels()}
          defaults={{
            displayName: profile.displayName ?? "",
            locale: profile.locale,
            experienceLevel: profile.experienceLevel ?? undefined,
            goal: profile.goal ?? undefined,
          }}
        />
      </Section>

      <Separator />

      <Section title={t("password.title")} description={t("password.description")}>
        <PasswordForm labels={await getPasswordFormLabels()} />
      </Section>

      <Separator />

      <SignOutForm label={t("signOut")} />

      <Separator />

      {/*
       * Deletion last, and visually separated. It is the one thing on this
       * page that cannot be undone, and putting it above the password form
       * would mean brushing past it on the way to something routine.
       */}
      <Section
        title={t("danger.title")}
        description={t("danger.description")}
        tone="destructive"
      >
        <DeleteAccountForm labels={await getDeleteAccountLabels()} />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  tone = "neutral",
  children,
}: {
  title: string;
  description: string;
  tone?: "neutral" | "destructive";
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2
          className={
            tone === "destructive"
              ? "font-heading text-base font-semibold text-destructive-text"
              : "font-heading text-base font-semibold text-foreground"
          }
        >
          {title}
        </h2>
        <p className="measure-prose text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
