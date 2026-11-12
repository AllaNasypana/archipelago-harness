'use server';

import { cookies } from 'next/headers';
import { isLocale, LOCALE_COOKIE } from './locale';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Remembers the chosen locale for unprefixed URLs. Ignores anything that is not a locale. */
export async function setLocaleCookie(locale: unknown): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_YEAR_SECONDS,
  });
}
