'use client';

import React from 'react';
import { Database, Zap, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  postgresStatus: 'Online' | 'Offline' | 'Checking';
  redisStatus: 'Online' | 'Offline' | 'Checking';
  onResetCache: () => Promise<void>;
  isResetting: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  postgresStatus,
  redisStatus,
  onResetCache,
  isResetting,
  onRefreshHealth,
}) => {
  return (
    <header className="glass-card w-full p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Title & Tagline */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-500/10">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Redis vs PostgreSQL
          </h1>
          <p className="text-sm font-semibold tracking-widest text-indigo-400 uppercase mt-0.5 font-mono">
            Sales Performance Arena
          </p>
        </div>
      </div>

      {/* Connection Status & Utilities */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        {/* PostgreSQL Status */}
        <div className="flex items-center gap-2.5 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
          <Database className="w-4 h-4 text-red-500" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">PostgreSQL:</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                postgresStatus === 'Online'
                  ? 'bg-red-500 shadow-[0_0_10px_#ff3355]'
                  : postgresStatus === 'Offline'
                  ? 'bg-gray-600'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-bold text-gray-200">{postgresStatus}</span>
          </div>
        </div>

        {/* Redis Status */}
        <div className="flex items-center gap-2.5 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Redis Cache:</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                redisStatus === 'Online'
                  ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
                  : redisStatus === 'Offline'
                  ? 'bg-gray-600'
                  : 'bg-yellow-500 animate-pulse'
              }`}
            />
            <span className="text-xs font-bold text-gray-200">{redisStatus}</span>
          </div>
        </div>

        {/* Clear Cache Trigger */}
        <button
          onClick={onResetCache}
          disabled={isResetting || redisStatus !== 'Online'}
          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/25 transition-all text-xs font-bold uppercase tracking-wider"
          title="Flush cached aggregation dashboard payload in Redis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'spinner' : ''}`} />
          Clear Cache
        </button>

        {/* Refresh Health Indicators */}
        <button
          onClick={onRefreshHealth}
          className="bg-white/5 hover:bg-white/10 text-gray-300 p-2 rounded-xl border border-white/5 transition-all"
          title="Verify databases status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
