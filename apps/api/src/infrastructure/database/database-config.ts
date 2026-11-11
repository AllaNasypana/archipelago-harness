import type { PoolConfig } from 'pg';

export const APP_DB_USER = 'app_user';
export const APP_DB_SCHEMA = 'app';

/** DI token for the validated configuration. */
export const DATABASE_CONFIG = Symbol('DATABASE_CONFIG');

export interface DatabaseConfig {
  url: string;
  user: string;
  schema: string;
}

export interface PgSettings {
  poolConfig: PoolConfig;
  adapterOptions: { schema: string };
}

/** Its message names the failed check only, never the URL or the password (AGENTS.md §7). */
export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigError';
  }
}

export function parseDatabaseConfig(
  env: Record<string, string | undefined>,
): DatabaseConfig {
  const url = env.DATABASE_URL;
  if (!url) throw new DatabaseConfigError('DATABASE_URL is missing');

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // The URL parser's own error carries the input, so it is not attached as a cause.
    throw new DatabaseConfigError('DATABASE_URL is not a valid URL');
  }

  // Compared as written: `app_user` needs no percent-encoding, and decoding could throw.
  if (parsed.username !== APP_DB_USER) {
    throw new DatabaseConfigError(`DATABASE_URL user must be ${APP_DB_USER}`);
  }
  if (parsed.searchParams.get('schema') !== APP_DB_SCHEMA) {
    throw new DatabaseConfigError(
      `DATABASE_URL schema must be ${APP_DB_SCHEMA}`,
    );
  }

  return { url, user: APP_DB_USER, schema: APP_DB_SCHEMA };
}

/**
 * Applies the schema explicitly instead of relying on the role's default `search_path`: the
 * adapter qualifies generated queries, the session `search_path` covers raw queries.
 */
export function pgSettings(config: DatabaseConfig): PgSettings {
  return {
    poolConfig: {
      connectionString: config.url,
      options: `-c search_path=${config.schema}`,
    },
    adapterOptions: { schema: config.schema },
  };
}
