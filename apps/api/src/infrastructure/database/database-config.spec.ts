import {
  DatabaseConfigError,
  parseDatabaseConfig,
  pgSettings,
} from './database-config.js';

const VALID_URL =
  'postgresql://app_user:change-me-app@localhost:5432/archipelago?schema=app';
const UNICODE_PASSWORD = 'pässwörd';
const UNICODE_URL = `postgresql://app_user:${encodeURIComponent(UNICODE_PASSWORD)}@localhost:5432/archipelago?schema=app`;

function captureError(env: Record<string, string | undefined>): Error {
  try {
    parseDatabaseConfig(env);
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected parseDatabaseConfig to throw');
}

describe('parseDatabaseConfig', () => {
  it('accepts a URL for app_user and schema app (AC-1)', () => {
    expect(parseDatabaseConfig({ DATABASE_URL: VALID_URL })).toEqual({
      url: VALID_URL,
      user: 'app_user',
      schema: 'app',
    });
  });

  it('accepts a Unicode password (AC-1)', () => {
    expect(parseDatabaseConfig({ DATABASE_URL: UNICODE_URL }).user).toBe(
      'app_user',
    );
  });

  it.each([
    ['missing', undefined, /DATABASE_URL is missing/],
    ['empty', '', /DATABASE_URL is missing/],
    [
      'not a URL',
      'not a url :: change-me-app',
      /DATABASE_URL is not a valid URL/,
    ],
    [
      'user postgres',
      'postgresql://postgres:change-me-app@localhost:5432/archipelago?schema=app',
      /DATABASE_URL user must be app_user/,
    ],
    [
      'user bff_user',
      'postgresql://bff_user:change-me-app@localhost:5432/archipelago?schema=app',
      /DATABASE_URL user must be app_user/,
    ],
    [
      'user with malformed percent-encoding',
      'postgresql://app%ZZ:change-me-app@localhost:5432/archipelago?schema=app',
      /DATABASE_URL user must be app_user/,
    ],
    [
      'schema missing',
      'postgresql://app_user:change-me-app@localhost:5432/archipelago',
      /DATABASE_URL schema must be app/,
    ],
    [
      'schema bff',
      'postgresql://app_user:change-me-app@localhost:5432/archipelago?schema=bff',
      /DATABASE_URL schema must be app/,
    ],
    [
      'schema public',
      'postgresql://app_user:change-me-app@localhost:5432/archipelago?schema=public',
      /DATABASE_URL schema must be app/,
    ],
  ])(
    'rejects %s, naming the failed check without secrets (AC-4)',
    (_case, url, message) => {
      const error = captureError({ DATABASE_URL: url });

      expect(error).toBeInstanceOf(DatabaseConfigError);
      expect(error.message).toMatch(message);
      expect(error.message).not.toContain('change-me-app');
      if (url) expect(error.message).not.toContain(url);
    },
  );

  it('never puts a Unicode password into the message (AC-4)', () => {
    const url = UNICODE_URL.replace('schema=app', 'schema=bff');
    const error = captureError({ DATABASE_URL: url });

    expect(error).toBeInstanceOf(DatabaseConfigError);
    expect(error.message).not.toContain(UNICODE_PASSWORD);
    expect(error.message).not.toContain(encodeURIComponent(UNICODE_PASSWORD));
  });
});

describe('pgSettings', () => {
  it('sets schema app explicitly on the adapter and on every connection (AC-1, F2)', () => {
    const settings = pgSettings(
      parseDatabaseConfig({ DATABASE_URL: VALID_URL }),
    );

    expect(settings.adapterOptions).toEqual({ schema: 'app' });
    expect(settings.poolConfig.options).toBe('-c search_path=app');
    expect(settings.poolConfig.connectionString).toBe(VALID_URL);
  });

  it('takes the schema from the parsed config, not a second constant (AC-1)', () => {
    const settings = pgSettings({
      url: VALID_URL,
      user: 'app_user',
      schema: 'probe',
    });

    expect(settings.adapterOptions.schema).toBe('probe');
    expect(settings.poolConfig.options).toBe('-c search_path=probe');
  });
});
