import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { Locale } from '../types';
import { isLocale } from './locale';
import { getMessages } from './messages';

/** Reads the `[locale]` segment; an unknown value renders the 404 page. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export function getLocaleMetadata(locale: Locale): Metadata {
  const { common } = getMessages(locale);
  return { title: common.appName, description: common.appDescription };
}
