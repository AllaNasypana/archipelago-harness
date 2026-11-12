import { defaultLocale, locales } from '../constants';
import type { Locale } from '../types';

export function isLocale(value: unknown): value is Locale {
  return locales.some((locale) => locale === value);
}

export function localeFromCookie(value: string | undefined): Locale {
  return value === 'uk' ? 'uk' : defaultLocale;
}

/** Replaces the locale segment of a `/<locale>/...` pathname and keeps the rest. */
export function swapLocale(pathname: string, locale: Locale): string {
  const [, , ...rest] = pathname.split('/');
  return ['', locale, ...rest].join('/');
}
