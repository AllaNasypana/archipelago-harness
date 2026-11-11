import type { TransactionContext } from '../../common/unit-of-work.js';
import type { Prisma } from './generated/prisma/client.js';
import { PrismaTransaction, prismaClientOf } from './prisma-unit-of-work.js';

describe('prismaClientOf', () => {
  it('returns the transaction client of a context opened by the Unit of Work (AC-2)', () => {
    const client = {} as Prisma.TransactionClient;

    expect(prismaClientOf(new PrismaTransaction(client))).toBe(client);
  });

  it('rejects a context the Unit of Work did not create (AC-3)', () => {
    const foreign: TransactionContext = { kind: 'transaction' };

    expect(() => prismaClientOf(foreign)).toThrow(
      /not created by PrismaUnitOfWork/,
    );
  });
});
