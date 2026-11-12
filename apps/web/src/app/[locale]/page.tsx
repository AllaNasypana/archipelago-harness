import { notFound } from 'next/navigation';
import { isLocale } from '@/features/i18n/locale';
import { getMessages } from '@/features/i18n/messages';

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { common, home } = getMessages(locale);

  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <h1 className="page-title">{common.appName}</h1>
      <p className="page-subtitle">{home.tagline}</p>

      <section className="card mt-6 flex items-center justify-between">
        <h2 className="section-title">{home.workspaceSetup}</h2>
        <span className="badge badge-accent">{home.inProgress}</span>
      </section>
    </main>
  );
}
