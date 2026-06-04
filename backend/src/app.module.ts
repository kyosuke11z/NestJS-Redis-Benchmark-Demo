import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // Limit each IP to 100 requests per ttl by default
      },
    ]),
    DatabaseModule,
    SalesModule,
  ],
})
export class AppModule {}
