import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DatabaseService } from '../database/database.service';

export interface DashboardData {
  summary: {
    totalRevenue: number;
    totalQuantity: number;
    transactionCount: number;
    averageTransactionValue: number;
  };
  salesByCategory: { category: string; value: number; items: number }[];
  salesByRegion: { region: string; value: number; items: number }[];
  monthlySales: { month: string; value: number }[];
}

export interface BenchmarkResponse {
  source: 'database' | 'cache';
  executionTimeMs: number;
  data: DashboardData;
}

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  private readonly CACHE_KEY = 'sales:benchmark:dashboard';
  private readonly CACHE_TTL = 60000; // 60 seconds (in milliseconds)

  constructor(
    private readonly database: DatabaseService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Fetches sales dashboard data directly from PostgreSQL using raw aggregation queries
   */
  async getRawDashboardData(): Promise<BenchmarkResponse> {
    const startTime = Date.now();

    try {
      const data = await this.executeAggregations();
      const executionTimeMs = Date.now() - startTime;

      return {
        source: 'database',
        executionTimeMs,
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching raw database data', error);
      throw error;
    }
  }

  /**
   * Fetches sales dashboard data, checking Redis Cache first.
   * If cache miss, aggregates from PostgreSQL and writes to Redis.
   */
  async getCachedDashboardData(): Promise<BenchmarkResponse> {
    const startTime = Date.now();

    try {
      // Check Redis cache
      const cachedData = await this.cacheManager.get<string>(this.CACHE_KEY);

      if (cachedData) {
        const executionTimeMs = Date.now() - startTime;
        const parsedData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return {
          source: 'cache',
          executionTimeMs,
          data: parsedData,
        };
      }

      // Cache miss: query PostgreSQL
      const data = await this.executeAggregations();
      
      // Save to Redis (Note: some cache-managers expect TTL in seconds, some in ms.
      // cache-manager-redis-yet expects milliseconds in v5)
      await this.cacheManager.set(this.CACHE_KEY, JSON.stringify(data), this.CACHE_TTL);

      const executionTimeMs = Date.now() - startTime;
      return {
        source: 'database',
        executionTimeMs,
        data,
      };
    } catch (error) {
      this.logger.error('Error fetching cached data', error);
      // Fallback to database on cache failure
      return this.getRawDashboardData();
    }
  }

  /**
   * Clears the Redis benchmark cache
   */
  async resetCache(): Promise<{ success: boolean; message: string }> {
    await this.cacheManager.del(this.CACHE_KEY);
    return { success: true, message: 'Benchmark cache cleared successfully.' };
  }

  /**
   * Validates services connectivity
   */
  async checkHealth(): Promise<{ postgres: string; redis: string }> {
    let postgresStatus = 'Offline';
    let redisStatus = 'Offline';

    // Check Postgres
    try {
      await this.database.$queryRaw`SELECT 1`;
      postgresStatus = 'Online';
    } catch (error) {
      this.logger.error('Database health check failed', error);
    }

    // Check Redis
    try {
      await this.cacheManager.set('health_check', 'ok', 5000);
      const val = await this.cacheManager.get('health_check');
      if (val === 'ok') {
        redisStatus = 'Online';
      }
    } catch (error) {
      this.logger.error('Redis health check failed', error);
    }

    return {
      postgres: postgresStatus,
      redis: redisStatus,
    };
  }

  /**
   * Runs analytical aggregations over all records in the database.
   * This executes multiple raw PostgreSQL aggregation queries sequentially
   * to create a realistic, CPU-intensive load.
   */
  private async executeAggregations(): Promise<DashboardData> {
    // 1. Core Summary Metrics
    const summaryResult = await this.database.$queryRaw<
      { count: bigint; total_revenue: number; avg_amount: number; total_quantity: bigint }[]
    >`
      SELECT 
        COUNT(*) as count, 
        SUM(amount) as total_revenue, 
        AVG(amount) as avg_amount,
        SUM(quantity) as total_quantity
      FROM "Sale"
    `;

    // 2. Sales by Category
    const categoryResult = await this.database.$queryRaw<
      { category: string; value: number; items: bigint }[]
    >`
      SELECT 
        category, 
        SUM(amount) as value, 
        SUM(quantity) as items 
      FROM "Sale" 
      GROUP BY category 
      ORDER BY value DESC
    `;

    // 3. Sales by Region
    const regionResult = await this.database.$queryRaw<
      { region: string; value: number; items: bigint }[]
    >`
      SELECT 
        region, 
        SUM(amount) as value, 
        SUM(quantity) as items 
      FROM "Sale" 
      GROUP BY region 
      ORDER BY value DESC
    `;

    // 4. Monthly Sales Trends (groups by month using TO_CHAR)
    const monthlyResult = await this.database.$queryRaw<
      { month: string; value: number }[]
    >`
      SELECT 
        TO_CHAR("soldAt", 'YYYY-MM') as month, 
        SUM(amount) as value 
      FROM "Sale" 
      GROUP BY TO_CHAR("soldAt", 'YYYY-MM') 
      ORDER BY month ASC
    `;

    const summary = summaryResult[0] || { count: 0n, total_revenue: 0, avg_amount: 0, total_quantity: 0n };

    return {
      summary: {
        totalRevenue: Number(summary.total_revenue || 0),
        totalQuantity: Number(summary.total_quantity || 0),
        transactionCount: Number(summary.count || 0),
        averageTransactionValue: Number(summary.avg_amount || 0),
      },
      salesByCategory: categoryResult.map((c) => ({
        category: c.category,
        value: Number(c.value || 0),
        items: Number(c.items || 0),
      })),
      salesByRegion: regionResult.map((r) => ({
        region: r.region,
        value: Number(r.value || 0),
        items: Number(r.items || 0),
      })),
      monthlySales: monthlyResult.map((m) => ({
        month: m.month,
        value: Number(m.value || 0),
      })),
    };
  }
}
