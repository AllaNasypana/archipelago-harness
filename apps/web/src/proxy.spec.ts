// @vitest-environment node
import { getRedirectUrl, unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';

const origin = 'http://localhost:3000';

async function run(path: string, cookie?: string) {
  const headers = cookie === undefined ? undefined : { cookie };
  return proxy(new NextRequest(`${origin}${path}`, { headers }));
}

describe('proxy without a locale cookie', () => {
  it.each([
    ['/', '/en'],
    ['/login?returnTo=x', '/en/login?returnTo=x'],
    ['/a/b', '/en/a/b'],
  ])('redirects %s to %s with 307 (AC-1)', async (path, target) => {
    const response = await run(path);

    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe(`${origin}${target}`);
  });

  it.each([['/en'], ['/en/login'], ['/uk/login?x=1']])('passes %s through (AC-1)', async (path) => {
    const response = await run(path);

    expect(getRedirectUrl(response)).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});

describe('proxy with a locale cookie', () => {
  it('redirects under /uk when the cookie is uk (AC-3)', async () => {
    const response = await run('/login?x=1', 'locale=uk');

    expect(response.status).toBe(307);
    expect(getRedirectUrl(response)).toBe(`${origin}/uk/login?x=1`);
  });

  it.each([['locale=en'], ['locale=fr'], ['locale=UK'], ['locale=']])(
    'redirects under /en for cookie %s (AC-3)',
    async (cookie) => {
      const response = await run('/login?x=1', cookie);

      expect(getRedirectUrl(response)).toBe(`${origin}/en/login?x=1`);
    },
  );
});

describe('proxy matcher', () => {
  it('skips /api, /_next and files, and runs on page routes (AC-7)', () => {
    const paths = ['/api/v1/x', '/_next/static/a.js', '/favicon.ico', '/', '/login', '/en/login'];

    const matches = Object.fromEntries(
      paths.map((url) => [url, unstable_doesMiddlewareMatch({ config, url })]),
    );

    expect(matches).toEqual({
      '/api/v1/x': false,
      '/_next/static/a.js': false,
      '/favicon.ico': false,
      '/': true,
      '/login': true,
      '/en/login': true,
    });
  });
});
