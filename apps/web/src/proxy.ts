import { type NextRequest, NextResponse } from 'next/server';
import { isLocale, LOCALE_COOKIE, localeFromCookie } from '@/features/i18n/locale';

// Order for US-00-02-web: the locale redirect runs first; session redirects then work on the
// locale-stripped path and keep the prefix (D-01-10).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split('/')[1])) return NextResponse.next();

  const url = request.nextUrl.clone();
  const locale = localeFromCookie(request.cookies.get(LOCALE_COOKIE)?.value);
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url, 307);
}

export const config = {
  // Page routes only: skip the BFF (`/api`), Next internals and any path with a file extension.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
