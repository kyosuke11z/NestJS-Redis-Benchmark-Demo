'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { DashboardData } from '../sales/sales.service.local-types'; // We'll create local types file

interface BenchmarkChartProps {
  data: DashboardData | null;
  loading: boolean;
}

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ data, loading }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[400px] w-full shimmer-bg rounded-2xl border border-white/5" />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="glass-card p-6 h-[350px] flex flex-col justify-between">
          <div className="h-6 w-40 rounded shimmer-bg" />
          <div className="h-[230px] w-full rounded shimmer-bg" />
        </div>
        <div className="glass-card p-6 h-[350px] flex flex-col justify-between">
          <div className="h-6 w-40 rounded shimmer-bg" />
          <div className="h-[230px] w-full rounded shimmer-bg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center border-dashed border-white/10 flex flex-col items-center justify-center min-h-[300px] mt-8">
        <p className="text-text-secondary text-sm font-semibold mb-2">Arena Uninitialized</p>
        <p className="text-xs text-text-muted max-w-sm">
          Trigger either PostgreSQL or Redis fetch triggers to pull aggregated dataset and generate visualization charts.
        </p>
      </div>
    );
  }

  // Format currency for chart labels
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  interface TooltipPayloadItem {
    value: number;
    payload: {
      items?: number;
    };
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
  }

  // Custom tooltips for premium aesthetics
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1524] border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-black text-emerald-400 font-mono">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.items && (
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Items: {new Intl.NumberFormat().format(payload[0].payload.items)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* 1. Category Chart */}
      <div className="glass-card p-6 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
            Revenue by Product Category
          </h3>
          <p className="text-[10px] text-text-muted">
            Aggregated sum of 500,000 product transactions
          </p>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.salesByCategory}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                radius={[6, 6, 0, 0]}
                maxBarSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Monthly Trend Chart */}
      <div className="glass-card p-6 flex flex-col justify-between">
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
            Monthly Revenue Analytics
          </h3>
          <p className="text-[10px] text-text-muted">
            Sales distribution timeline over the last 12 months
          </p>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.monthlySales}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.4)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Regional Chart - full width span on large screens */}
      <div className="glass-card p-6 flex flex-col justify-between lg:col-span-2">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
              Geographical Sales Distribution
            </h3>
            <p className="text-[10px] text-text-muted font-semibold">
              Revenue and items count grouped by geographical regions
            </p>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data.salesByRegion}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
              <XAxis
                type="number"
                stroke="rgba(255,255,255,0.4)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortCurrency}
              />
              <YAxis
                type="category"
                dataKey="region"
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar 
                dataKey="value" 
                fill="#f59e0b" 
                radius={[0, 6, 6, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
