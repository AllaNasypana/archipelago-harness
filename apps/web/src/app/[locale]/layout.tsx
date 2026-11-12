import { getLocaleMetadata, getMessages, I18nProvider, locales, resolveLocale } from '@/features/i18n';
import { fontVariables } from '../fonts';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>) {
  return getLocaleMetadata(await resolveLocale(params));
}

export default async function RootLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await resolveLocale(params);

  return (
    <html lang={locale} className={`${fontVariables} h-full`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
