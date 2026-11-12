import { isLocale, localeFromCookie, swapLocale } from './locale';

describe('swapLocale', () => {
  it.each([
    ['/en', 'uk', '/uk'],
    ['/en/login', 'uk', '/uk/login'],
    ['/uk/a/b', 'en', '/en/a/b'],
  ] as const)('swaps %s to %s, keeping the rest of the path (AC-2)', (pathname, locale, expected) => {
    expect(swapLocale(pathname, locale)).toBe(expected);
  });
});

describe('localeFromCookie', () => {
  it('returns uk only for exactly "uk" (AC-3)', () => {
    expect(localeFromCookie('uk')).toBe('uk');
  });

  it.each([['en'], [undefined], [''], ['UK'], ['uk '], ['ук'], ['fr']])(
    'falls back to en for %j (AC-3)',
    (value) => {
      expect(localeFromCookie(value)).toBe('en');
    },
  );
});

describe('isLocale', () => {
  it.each([['en'], ['uk']])('accepts %j (AC-3)', (value) => {
    expect(isLocale(value)).toBe(true);
  });

  it.each([['EN'], ['UK'], [' uk'], ['fr'], [''], [undefined], [null], [1]])(
    'rejects %j (AC-3)',
    (value) => {
      expect(isLocale(value)).toBe(false);
    },
  );
});
