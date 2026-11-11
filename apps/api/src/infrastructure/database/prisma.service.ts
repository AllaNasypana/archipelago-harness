import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import {
  DATABASE_CONFIG,
  type DatabaseConfig,
  pgSettings,
} from './database-config.js';

/** The API's only Prisma client (schema `app`); modules reach it through the Unit of Work. */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject(DATABASE_CONFIG) config: DatabaseConfig) {
    const { poolConfig, adapterOptions } = pgSettings(config);
    super({ adapter: new PrismaPg(poolConfig, adapterOptions) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
