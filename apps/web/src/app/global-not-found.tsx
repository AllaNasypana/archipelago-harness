import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { defaultLocale } from '@/features/i18n/locale';
import { getMessages } from '@/features/i18n/messages';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
});

// No locale is known for an unmatched URL, so the page renders in the default locale.
const { common, notFound } = getMessages(defaultLocale);

export const metadata: Metadata = { title: `${notFound.title} — ${common.appName}` };

export default function GlobalNotFound() {
  return (
    <html lang={defaultLocale} className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <main className="mx-auto w-full max-w-3xl p-6">
          <h1 className="page-title">{notFound.title}</h1>
          <Link href={`/${defaultLocale}`} className="mt-4 inline-block underline">
            {notFound.backHome}
          </Link>
        </main>
      </body>
    </html>
  );
}
