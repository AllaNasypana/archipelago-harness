// Contract only (US-00-01-api): no Prisma or NestJS imports, so application code and
// workflows can depend on it without leaking infrastructure (AGENTS.md §3.6, §3.8).

/** Opaque handle of the running transaction; only infrastructure adapters can open it. */
export interface TransactionContext {
  readonly kind: 'transaction';
}

/** Runs `work` in one database transaction: commit on resolve, rollback and rethrow on reject. */
export abstract class UnitOfWork {
  abstract run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
