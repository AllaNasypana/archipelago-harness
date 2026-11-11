import { parseDatabaseConfig } from './database-config.js';
import { PrismaService } from './prisma.service.js';

describe('PrismaService (database access point)', () => {
  let prisma: PrismaService | undefined;

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('runs every query as app_user in schema app (AC-1)', async () => {
    prisma = new PrismaService(parseDatabaseConfig(process.env));
    await prisma.$connect();

    const [row] = await prisma.$queryRaw<
      { user: string; schema: string; search_path: string }[]
    >`SELECT current_user AS "user", current_schema() AS "schema", current_setting('search_path') AS "search_path"`;

    expect(row).toEqual({
      user: 'app_user',
      schema: 'app',
      search_path: 'app',
    });
  });
});
