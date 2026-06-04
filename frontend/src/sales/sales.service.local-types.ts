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
