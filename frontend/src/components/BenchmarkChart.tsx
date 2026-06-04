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
import { BarChart3, TrendingUp, Globe } from 'lucide-react';
import { DashboardData } from '../sales/sales.service.local-types';

interface BenchmarkChartProps {
  data: DashboardData | null;
  loading: boolean;
}

type TabType = 'category' | 'monthly' | 'region';

export const BenchmarkChart: React.FC<BenchmarkChartProps> = ({ data, loading }) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('category');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[420px] w-full shimmer-bg rounded-2xl border border-white/5" />;
  }

  if (loading) {
    return (
      <div className="glass-card p-6 h-[420px] flex flex-col justify-between mt-8">
        <div className="flex gap-4">
          <div className="h-9 w-32 rounded shimmer-bg" />
          <div className="h-9 w-32 rounded shimmer-bg" />
          <div className="h-9 w-32 rounded shimmer-bg" />
        </div>
        <div className="h-[300px] w-full rounded shimmer-bg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center border-dashed border-white/10 flex flex-col items-center justify-center min-h-[300px] mt-8">
        <p className="text-text-secondary text-sm font-semibold mb-2 font-mono">Telemetry Data Empty</p>
        <p className="text-xs text-text-muted max-w-sm">
          Run PostgreSQL or Redis cache queries to populate the analytic metrics and display interactive Recharts.
        </p>
      </div>
    );
  }

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

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1524] border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-bold text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-black text-emerald-400 font-mono">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.items && (
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5 font-mono">
              Items: {new Intl.NumberFormat().format(payload[0].payload.items)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 flex flex-col mt-8 min-h-[440px]">
      
      {/* Tab Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-text-secondary">
            Sales Analysis Analytics
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Aggregated dashboard visualization for 500k Postgres records
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Categories Tab */}
          <button
            onClick={() => setActiveTab('category')}
            className={`chart-tab-button flex items-center gap-2 ${activeTab === 'category' ? 'active' : ''}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Categories
          </button>
          
          {/* Timeline Tab */}
          <button
            onClick={() => setActiveTab('monthly')}
            className={`chart-tab-button flex items-center gap-2 ${activeTab === 'monthly' ? 'active' : ''}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Monthly Timeline
          </button>

          {/* Region Tab */}
          <button
            onClick={() => setActiveTab('region')}
            className={`chart-tab-button flex items-center gap-2 ${activeTab === 'region' ? 'active' : ''}`}
          >
            <Globe className="w-3.5 h-3.5" />
            Geographies
          </button>
        </div>
      </div>

      {/* Render Selected Chart Panel */}
      <div className="h-[300px] w-full flex-grow">
        
        {activeTab === 'category' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.salesByCategory}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortCurrency}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
              <Bar 
                dataKey="value" 
                fill="#3b82f6" 
                radius={[6, 6, 0, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'monthly' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.monthlySales}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="glowingGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
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
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#glowingGreen)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'region' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data.salesByRegion}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={false} />
              <XAxis
                type="number"
                stroke="rgba(255,255,255,0.3)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortCurrency}
              />
              <YAxis
                type="category"
                dataKey="region"
                stroke="rgba(255,255,255,0.3)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
              <Bar 
                dataKey="value" 
                fill="#f59e0b" 
                radius={[0, 6, 6, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

      </div>
    </div>
  );
};
