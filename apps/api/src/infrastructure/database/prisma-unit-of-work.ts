import { Injectable } from '@nestjs/common';
import { TransactionContext, UnitOfWork } from '../../common/unit-of-work.js';
import { Prisma } from './generated/prisma/client.js';
import { PrismaService } from './prisma.service.js';

export class PrismaTransaction implements TransactionContext {
  readonly kind = 'transaction' as const;

  constructor(readonly client: Prisma.TransactionClient) {}
}

/** The only way an infrastructure adapter gets the client of the running transaction. */
export function prismaClientOf(
  tx: TransactionContext,
): Prisma.TransactionClient {
  if (!(tx instanceof PrismaTransaction)) {
    throw new Error('Transaction context was not created by PrismaUnitOfWork');
  }
  return tx.client;
}

/** READ COMMITTED, Prisma's default timeouts, no retry; errors are rethrown unchanged. */
@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(
      (client) => work(new PrismaTransaction(client)),
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );
  }
}
