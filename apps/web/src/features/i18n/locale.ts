export const locales = ['en', 'uk'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
export const LOCALE_COOKIE = 'locale';

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
