import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DatabaseModule } from './database.module.js';
import { DatabaseConfigError } from './database-config.js';

const BAD_URL =
  'postgresql://postgres:change-me-app@localhost:5432/archipelago?schema=app';

describe('DatabaseModule bootstrap', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('aborts startup on an invalid DATABASE_URL without exposing it (AC-4, F1)', async () => {
    vi.stubEnv('DATABASE_URL', BAD_URL);

    const compiling = Test.createTestingModule({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), DatabaseModule],
    }).compile();

    const error = await compiling.then(
      () => undefined,
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(DatabaseConfigError);
    expect((error as Error).message).not.toContain('change-me-app');
    expect((error as Error).message).not.toContain(BAD_URL);
  });
});
