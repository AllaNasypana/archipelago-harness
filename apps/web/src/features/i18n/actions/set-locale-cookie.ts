'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE } from '../constants';
import { isLocale } from '../utils/locale';

/** Remembers the chosen locale for unprefixed URLs. Ignores anything that is not a locale. */
export async function setLocaleCookie(locale: unknown): Promise<void> {
  if (!isLocale(locale)) return;

  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
}
