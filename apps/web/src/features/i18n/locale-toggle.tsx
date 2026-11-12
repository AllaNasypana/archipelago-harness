'use client';

import { usePathname, useRouter } from 'next/navigation';
import { type Locale, locales, swapLocale } from './locale';
import { setLocaleCookie } from './set-locale-cookie';
import { useI18n } from './use-i18n';

export function LocaleToggle() {
  const { locale: current, messages } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSelect(next: Locale) {
    if (next === current) return;
    try {
      await setLocaleCookie(next);
    } catch {
      // The URL prefix still switches the page; only the remembered choice is lost.
    }
    router.push(swapLocale(pathname, next) + window.location.search);
  }

  return (
    <div role="group" aria-label={messages.localeToggle.label} className="flex items-center gap-1 text-sm">
      {locales.map((locale) => {
        const isActive = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={isActive}
            onClick={() => handleSelect(locale)}
            className={`rounded-sm px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive ? 'font-semibold underline' : 'text-muted-foreground'
            }`}
          >
            {messages.localeToggle[locale]}
          </button>
        );
      })}
    </div>
  );
}
