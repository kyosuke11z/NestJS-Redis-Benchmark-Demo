import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        return {
          store,
        };
      },
    }),
  ],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
