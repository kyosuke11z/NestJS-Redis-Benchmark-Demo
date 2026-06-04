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
    return <div className="h-[400px] w-full shimmer-bg rounded-xl border border-[#222a3b]" />;
  }

  if (loading) {
    return (
      <div className="glass-card p-6 h-[400px] flex flex-col justify-between mt-8">
        <div className="flex gap-4">
          <div className="h-8 w-24 rounded-lg shimmer-bg" />
          <div className="h-8 w-24 rounded-lg shimmer-bg" />
          <div className="h-8 w-24 rounded-lg shimmer-bg" />
        </div>
        <div className="h-[280px] w-full rounded-lg shimmer-bg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center border-dashed border-white/10 flex flex-col items-center justify-center min-h-[300px] mt-8">
        <p className="text-text-secondary text-sm font-semibold mb-2">Metrics Data Empty</p>
        <p className="text-xs text-text-muted max-w-sm leading-relaxed">
          Execute either PostgreSQL or Redis queries to fetch sales data and render comparison reports.
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
        <div className="bg-[#111520] border border-[#222a3b] p-3 rounded-lg shadow-xl">
          <p className="text-[10px] font-bold text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-bold text-emerald-400 font-mono">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.items && (
            <p className="text-[9px] text-gray-400 font-semibold mt-0.5 font-mono">
              Items Sold: {new Intl.NumberFormat().format(payload[0].payload.items)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-8 flex flex-col mt-8 min-h-[440px]">
      
      {/* SaaS Segment Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-6">
        <div>
          <h4 className="text-base font-bold text-white">
            Aggregated Report Analysis
          </h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Analytic breakdown compiled over the 500,000 transaction dataset.
          </p>
        </div>

        {/* Clean Segment Pill Switch */}
        <div className="flex bg-[#0d111a] p-1 rounded-lg border border-[#222a3b] gap-1">
          {/* Categories Segment */}
          <button
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'category'
                ? 'bg-[#1b212f] text-white border border-[#2c374d]'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Categories
          </button>
          
          {/* Timeline Segment */}
          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-[#1b212f] text-white border border-[#2c374d]'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Timeline
          </button>

          {/* Region Segment */}
          <button
            onClick={() => setActiveTab('region')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
              activeTab === 'region'
                ? 'bg-[#1b212f] text-white border border-[#2c374d]'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Regions
          </button>
        </div>
      </div>

      {/* Render Selected Chart Panel */}
      <div className="h-[280px] w-full flex-grow">
        
        {activeTab === 'category' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.salesByCategory}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
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
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
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
                <linearGradient id="cleanEmerald" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
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
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#cleanEmerald)"
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" horizontal={false} />
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
                radius={[0, 4, 4, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

      </div>
    </div>
  );
};
