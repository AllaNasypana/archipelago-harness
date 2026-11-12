'use client';

import { usePathname, useRouter } from 'next/navigation';
import { setLocaleCookie } from '../actions/set-locale-cookie';
import { locales } from '../constants';
import type { Locale, LocaleOption } from '../types';
import { swapLocale } from '../utils/locale';
import { useI18n } from './use-i18n';

export function useLocaleToggle() {
  const { locale: current, messages } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  const options: LocaleOption[] = locales.map((locale) => ({
    locale,
    label: messages.localeToggle[locale],
    isActive: locale === current,
  }));

  async function handleSelect(next: Locale) {
    if (next === current) return;
    try {
      await setLocaleCookie(next);
    } catch {
      // The URL prefix still switches the page; only the remembered choice is lost.
    }
    router.push(swapLocale(pathname, next) + window.location.search);
  }

  return { label: messages.localeToggle.label, options, handleSelect };
}
