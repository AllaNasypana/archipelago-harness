import { randomBytes } from 'node:crypto';
import pg from 'pg';
import type { TransactionContext } from '../../common/unit-of-work.js';
import { parseDatabaseConfig } from './database-config.js';
import { PrismaService } from './prisma.service.js';
import { PrismaUnitOfWork, prismaClientOf } from './prisma-unit-of-work.js';

// Two fake "module" adapters writing to test-only tables (C1): no production model or migration.
const suffix = randomBytes(4).toString('hex');
const tableA = `app.uow_probe_a_${suffix}`;
const tableB = `app.uow_probe_b_${suffix}`;

const moduleA = {
  insert: (tx: TransactionContext, id: string) =>
    prismaClientOf(tx).$executeRawUnsafe(
      `INSERT INTO ${tableA} (id) VALUES ($1)`,
      id,
    ),
};
const moduleB = {
  insert: (tx: TransactionContext, id: string) =>
    prismaClientOf(tx).$executeRawUnsafe(
      `INSERT INTO ${tableB} (id) VALUES ($1)`,
      id,
    ),
};

describe('PrismaUnitOfWork', () => {
  const observer = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  let prisma: PrismaService | undefined;
  let unitOfWork: PrismaUnitOfWork;

  const rowsIn = async (table: string, id: string) =>
    (await observer.query(`SELECT id FROM ${table} WHERE id = $1`, [id]))
      .rowCount;

  beforeAll(async () => {
    await observer.connect();
    await observer.query(`CREATE TABLE ${tableA} (id text PRIMARY KEY)`);
    await observer.query(`CREATE TABLE ${tableB} (id text PRIMARY KEY)`);
  });

  beforeEach(() => {
    prisma ??= new PrismaService(parseDatabaseConfig(process.env));
    unitOfWork = new PrismaUnitOfWork(prisma);
  });

  afterAll(async () => {
    await observer.query(`DROP TABLE IF EXISTS ${tableA}, ${tableB}`);
    await observer.end();
    await prisma?.$disconnect();
  });

  it('commits the writes of two modules together (AC-2)', async () => {
    const result = await unitOfWork.run(async (tx) => {
      await moduleA.insert(tx, 'committed');
      await moduleB.insert(tx, 'committed');
      return 'done';
    });

    expect(result).toBe('done');
    expect(await rowsIn(tableA, 'committed')).toBe(1);
    expect(await rowsIn(tableB, 'committed')).toBe(1);
  });

  it('rolls back on a failed database write and rethrows that same error (AC-3, F3)', async () => {
    await observer.query(`INSERT INTO ${tableB} (id) VALUES ('taken')`);
    let thrownByWrite: unknown;

    const outcome = await unitOfWork
      .run(async (tx) => {
        await moduleA.insert(tx, 'rolled-back-db');
        try {
          await moduleB.insert(tx, 'taken');
        } catch (error) {
          thrownByWrite = error;
          throw error;
        }
      })
      .then(
        () => 'resolved',
        (reason: unknown) => reason,
      );

    expect(thrownByWrite).toBeDefined();
    expect(outcome).toBe(thrownByWrite);
    expect(await rowsIn(tableA, 'rolled-back-db')).toBe(0);
  });

  it('rolls back on an application error and rethrows it unchanged (AC-3, F3)', async () => {
    const boom = new Error('boom');

    const outcome = await unitOfWork
      .run(async (tx) => {
        await moduleA.insert(tx, 'rolled-back-app');
        throw boom;
      })
      .then(
        () => 'resolved',
        (reason: unknown) => reason,
      );

    expect(outcome).toBe(boom);
    expect(await rowsIn(tableA, 'rolled-back-app')).toBe(0);
  });
});
