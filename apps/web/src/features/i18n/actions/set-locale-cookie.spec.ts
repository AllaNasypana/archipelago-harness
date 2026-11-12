// @vitest-environment node
import { setLocaleCookie } from './set-locale-cookie';

const set = vi.fn();

vi.mock('next/headers', () => ({ cookies: async () => ({ set }) }));

afterEach(() => {
  set.mockReset();
  vi.unstubAllEnvs();
});

describe('setLocaleCookie', () => {
  it('sets locale=uk for a year on the whole site, SameSite=Lax (AC-2, AC-3)', async () => {
    await setLocaleCookie('uk');

    expect(set).toHaveBeenCalledOnce();
    expect(set).toHaveBeenCalledWith(
      'locale',
      'uk',
      expect.objectContaining({ path: '/', sameSite: 'lax', maxAge: 31_536_000 }),
    );
  });

  it.each([
    ['test', false],
    ['development', false],
    ['production', true],
  ])('sets Secure=%s→%s from NODE_ENV (AC-2)', async (nodeEnv, secure) => {
    vi.stubEnv('NODE_ENV', nodeEnv);

    await setLocaleCookie('en');

    expect(set).toHaveBeenCalledWith('locale', 'en', expect.objectContaining({ secure }));
  });

  it.each([['fr'], [''], [undefined], ['UK'], [' uk'], [null], [{}]])(
    'sets nothing for untrusted value %j (AC-3)',
    async (value) => {
      await expect(setLocaleCookie(value)).resolves.toBeUndefined();
      expect(set).not.toHaveBeenCalled();
    },
  );
});
