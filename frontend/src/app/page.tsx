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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
    <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      {/* Upper Navigation & Status Indicators */}
      <Header
        postgresStatus={postgresStatus}
        redisStatus={redisStatus}
        onResetCache={handleResetCache}
        isResetting={isResetting}
        onRefreshHealth={checkHealth}
      />

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
      <footer className="mt-12 text-center text-[10px] text-text-muted font-mono uppercase tracking-widest border-t border-white/5 pt-6">
        NestJS Redis Performance Benchmark Demo • Created by Allen
      </footer>
    </main>
  );
}
