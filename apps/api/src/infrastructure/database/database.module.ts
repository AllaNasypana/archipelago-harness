import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UnitOfWork } from '../../common/unit-of-work.js';
import { DATABASE_CONFIG, parseDatabaseConfig } from './database-config.js';
import { PrismaService } from './prisma.service.js';
import { PrismaUnitOfWork } from './prisma-unit-of-work.js';

/** Validates the configuration at startup and exports only the Unit of Work. */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        parseDatabaseConfig({
          DATABASE_URL: config.get<string>('DATABASE_URL'),
        }),
    },
    PrismaService,
    { provide: UnitOfWork, useClass: PrismaUnitOfWork },
  ],
  exports: [UnitOfWork],
})
export class DatabaseModule {}
