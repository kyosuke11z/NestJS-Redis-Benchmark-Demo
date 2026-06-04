'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Activity } from 'lucide-react';
import { Header } from '../components/Header';
import { Arena } from '../components/Arena';
import { StatCard } from '../components/StatCard';
import { BenchmarkChart } from '../components/BenchmarkChart';
import { DashboardData } from '../sales/sales.service.local-types';

export default function Dashboard() {
  const [postgresStatus, setPostgresStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');
  const [redisStatus, setRedisStatus] = useState<'Online' | 'Offline' | 'Checking'>('Checking');
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [redisLoading, setRedisLoading] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

  const checkHealth = async () => {
    setPostgresStatus('Checking');
    setRedisStatus('Checking');
    try {
      const res = await fetch(`${API_URL}/sales/health`);
      if (res.ok) {
        const status = await res.json();
        setPostgresStatus(status.postgres === 'Online' ? 'Online' : 'Offline');
        setRedisStatus(status.redis === 'Online' ? 'Online' : 'Offline');
      } else {
        setPostgresStatus('Offline');
        setRedisStatus('Offline');
      }
    } catch (e) {
      console.error('Health check connection failed:', e);
      setPostgresStatus('Offline');
      setRedisStatus('Offline');
    }
  };

  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetCache = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_URL}/sales/reset-cache`, { method: 'POST' });
      if (res.ok) {
        console.log('Cache successfully invalidated.');
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleFetchDb = async () => {
    setDbLoading(true);
    const requestStart = Date.now();
    try {
      const res = await fetch(`${API_URL}/sales/raw`);
      const networkTimeMs = Date.now() - requestStart;
      
      if (!res.ok) throw new Error('Postgres query failed');
      
      const payload = await res.json();
      setDashboardData(payload.data);
      
      return {
        executionTimeMs: payload.executionTimeMs,
        networkTimeMs,
      };
    } catch (e) {
      console.error(e);
      alert('Error: Aggregation failed. Check PostgreSQL container connection.');
      throw e;
    } finally {
      setDbLoading(false);
    }
  };

  const handleFetchRedis = async () => {
    setRedisLoading(true);
    const requestStart = Date.now();
    try {
      const res = await fetch(`${API_URL}/sales/cached`);
      const networkTimeMs = Date.now() - requestStart;
      
      if (!res.ok) throw new Error('Redis query failed');
      
      const payload = await res.json();
      setDashboardData(payload.data);
      
      return {
        executionTimeMs: payload.executionTimeMs,
        networkTimeMs,
      };
    } catch (e) {
      console.error(e);
      alert('Error: Redis request failed. Check cache manager status.');
      throw e;
    } finally {
      setRedisLoading(false);
    }
  };

  const globalLoading = dbLoading || redisLoading;

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 md:py-12">
      {/* Upper Navigation & Status Indicators */}
      <Header
        postgresStatus={postgresStatus}
        redisStatus={redisStatus}
        onResetCache={handleResetCache}
        isResetting={isResetting}
        onRefreshHealth={checkHealth}
      />

      {/* Professional SaaS Hero Header Section */}
      <section className="mb-10 text-left border-b border-white/5 pb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Sales Analytics Latency Benchmark
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-2.5 max-w-3xl leading-relaxed">
          Evaluate backend system response times by comparing raw SQL analytical aggregations directly executed on **PostgreSQL** against an in-memory readout cache layer managed with **Redis**. The database contains **500,000** mock sales transaction rows to simulate a realistic production workload.
        </p>
      </section>

      {/* Central Arena Container */}
      <Arena
        onFetchDb={handleFetchDb}
        onFetchRedis={handleFetchRedis}
        dbLoading={dbLoading}
        redisLoading={redisLoading}
        postgresStatus={postgresStatus}
        redisStatus={redisStatus}
      />

      {/* Data Summary Metrics Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <StatCard
          title="Total Revenue"
          value={dashboardData?.summary.totalRevenue ?? 0}
          icon={DollarSign}
          iconColor="#f59e0b"
          loading={globalLoading}
          isCurrency={true}
        />
        <StatCard
          title="Items Volume"
          value={dashboardData?.summary.totalQuantity ?? 0}
          icon={ShoppingBag}
          iconColor="#3b82f6"
          loading={globalLoading}
        />
        <StatCard
          title="Total Transactions"
          value={dashboardData?.summary.transactionCount ?? 0}
          icon={TrendingUp}
          iconColor="#a855f7"
          loading={globalLoading}
        />
        <StatCard
          title="Average Order Value"
          value={dashboardData?.summary.averageTransactionValue ?? 0}
          icon={Activity}
          iconColor="#ec4899"
          loading={globalLoading}
          isCurrency={true}
        />
      </section>

      {/* Chart Visualizations */}
      <BenchmarkChart data={dashboardData} loading={globalLoading} />

      {/* Footer Details */}
      <footer className="mt-16 text-center text-xs text-text-muted border-t border-white/5 pt-8 font-mono">
        NestJS Redis Performance Benchmark Demo • Developed by Allen
      </footer>
    </main>
  );
}
