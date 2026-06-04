import { Controller, Get, Post, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { SalesService, BenchmarkResponse } from './sales.service';

@Controller('sales')
@UseGuards(ThrottlerGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Endpoint forcing direct raw aggregation query to PostgreSQL database
   */
  @Get('raw')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // Strict limit on database queries (30 per min)
  async getRaw(): Promise<BenchmarkResponse> {
    return this.salesService.getRawDashboardData();
  }

  /**
   * Endpoint routing queries via Redis Cache layer
   */
  @Get('cached')
  @Throttle({ default: { limit: 120, ttl: 60000 } }) // Higher limit for cached queries (120 per min)
  async getCached(): Promise<BenchmarkResponse> {
    return this.salesService.getCachedDashboardData();
  }

  /**
   * Utility endpoint to reset/clear redis benchmark cache data
   */
  @Post('reset-cache')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async resetCache(): Promise<{ success: boolean; message: string }> {
    return this.salesService.resetCache();
  }

  /**
   * Health endpoint verifying statuses of database and Redis cache
   */
  @Get('health')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getHealth(): Promise<{ postgres: string; redis: string }> {
    return this.salesService.checkHealth();
  }
}
