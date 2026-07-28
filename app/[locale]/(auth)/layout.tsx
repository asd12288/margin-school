import { setRequestLocale } from "next-intl/server";

/** Sign-in and sign-up. Deliberately no navigation: one job per screen. */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="measure-narrow w-full">{children}</div>
    </main>
  );
}
