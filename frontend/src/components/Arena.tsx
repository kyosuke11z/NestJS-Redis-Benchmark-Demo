'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, Zap, Timer, Server, Activity } from 'lucide-react';

interface ArenaProps {
  onFetchDb: () => Promise<{ executionTimeMs: number; networkTimeMs: number }>;
  onFetchRedis: () => Promise<{ executionTimeMs: number; networkTimeMs: number }>;
  dbLoading: boolean;
  redisLoading: boolean;
  postgresStatus: string;
  redisStatus: string;
}

interface BenchmarkStats {
  backendMs: number;
  networkMs: number;
}

export const Arena: React.FC<ArenaProps> = ({
  onFetchDb,
  onFetchRedis,
  dbLoading,
  redisLoading,
  postgresStatus,
  redisStatus,
}) => {
  const [dbStats, setDbStats] = useState<BenchmarkStats | null>(null);
  const [redisStats, setRedisStats] = useState<BenchmarkStats | null>(null);

  const [dbTimer, setDbTimer] = useState<number>(0);
  const [redisTimer, setRedisTimer] = useState<number>(0);

  const dbIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // PostgreSQL Timer
  useEffect(() => {
    if (dbLoading) {
      setDbTimer(0);
      setDbStats(null);
      const startTime = Date.now();
      dbIntervalRef.current = setInterval(() => {
        setDbTimer(Date.now() - startTime);
      }, 10);
    } else {
      if (dbIntervalRef.current) {
        clearInterval(dbIntervalRef.current);
        dbIntervalRef.current = null;
      }
    }
    return () => {
      if (dbIntervalRef.current) clearInterval(dbIntervalRef.current);
    };
  }, [dbLoading]);

  // Redis Timer
  useEffect(() => {
    if (redisLoading) {
      setRedisTimer(0);
      setRedisStats(null);
      const startTime = Date.now();
      redisIntervalRef.current = setInterval(() => {
        setRedisTimer(Date.now() - startTime);
      }, 10);
    } else {
      if (redisIntervalRef.current) {
        clearInterval(redisIntervalRef.current);
        redisIntervalRef.current = null;
      }
    }
    return () => {
      if (redisIntervalRef.current) clearInterval(redisIntervalRef.current);
    };
  }, [redisLoading]);

  const handleFetchDb = async () => {
    try {
      const stats = await onFetchDb();
      setDbStats({ backendMs: stats.executionTimeMs, networkMs: stats.networkTimeMs });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchRedis = async () => {
    try {
      const stats = await onFetchRedis();
      setRedisStats({ backendMs: stats.executionTimeMs, networkMs: stats.networkTimeMs });
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimerValue = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms} ms`;
  };

  const hasBothStats = dbStats !== null && redisStats !== null;
  const speedMultiplier = hasBothStats
    ? (dbStats.backendMs / Math.max(redisStats.backendMs, 1)).toFixed(1)
    : '0';

  // Calculate percentage faster for standard SaaS communication
  const pctFaster = hasBothStats
    ? (((dbStats.backendMs - redisStats.backendMs) / dbStats.backendMs) * 100).toFixed(2)
    : '0';

  return (
    <section className="flex flex-col gap-8 mb-8">
      
      {/* Side-by-side comparison panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PostgreSQL Database Panel */}
        <div className="glass-card p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Database className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-red-500">
                  Primary Storage
                </span>
              </div>
              <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                PostgreSQL DB
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight mb-3">Database Aggregation Engine</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-8">
              Queries the relational database directly. Performs raw SQL aggregations over the entire dataset of 500,000 sales transactions on the physical storage layer.
            </p>

            {/* Spec list */}
            <div className="flex flex-col gap-3 mb-8 border-t border-b border-white/5 py-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-text-muted" /> Target Rows
                </span>
                <span className="text-white font-bold">500,000 records</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-text-muted" /> Aggregation Type
                </span>
                <span className="text-white font-bold">GROUP BY (Category, Region)</span>
              </div>
            </div>
          </div>

          <div>
            {/* SaaS style Latency readout */}
            <div className="flex flex-col gap-1.5 mb-6">
              <span className="text-xs uppercase text-text-secondary font-bold tracking-wider">
                Response Latency
              </span>
              <div className="text-4xl font-extrabold text-white timer-text">
                {dbLoading ? (
                  <span className="text-red-500 animate-pulse">{formatTimerValue(dbTimer)}</span>
                ) : dbStats ? (
                  <span className="text-red-500">{formatTimerValue(dbStats.backendMs)}</span>
                ) : (
                  <span className="text-text-muted">-- ms</span>
                )}
              </div>
              {dbStats && (
                <span className="text-[10px] text-text-secondary font-mono">
                  Query: {dbStats.backendMs}ms | Network roundtrip: {dbStats.networkMs}ms
                </span>
              )}
            </div>

            {/* Flat design primary button */}
            <button
              onClick={handleFetchDb}
              disabled={dbLoading || redisLoading || postgresStatus !== 'Online'}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {dbLoading ? (
                <>
                  <Timer className="w-4 h-4 spinner" />
                  Querying Postgres...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Run Raw PostgreSQL Query
                </>
              )}
            </button>
          </div>
        </div>

        {/* Redis Cache Panel */}
        <div className="glass-card p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-emerald-500">
                  In-Memory Cache
                </span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Redis Cache
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white tracking-tight mb-3">Memory Cache Layer</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-8">
              Bypasses SQL compilation and disk reads. Retrieves pre-compiled dashboard structures directly from memory cache, resolving response queries instantly.
            </p>

            {/* Spec list */}
            <div className="flex flex-col gap-3 mb-8 border-t border-b border-white/5 py-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-text-muted" /> Cache Medium
                </span>
                <span className="text-white font-bold">L1 RAM Storage</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-secondary flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-text-muted" /> Expiration Strategy
                </span>
                <span className="text-white font-bold">60-Second TTL Window</span>
              </div>
            </div>
          </div>

          <div>
            {/* SaaS style Latency readout */}
            <div className="flex flex-col gap-1.5 mb-6">
              <span className="text-xs uppercase text-text-secondary font-bold tracking-wider">
                Response Latency
              </span>
              <div className="text-4xl font-extrabold text-white timer-text">
                {redisLoading ? (
                  <span className="text-emerald-400 animate-pulse">{formatTimerValue(redisTimer)}</span>
                ) : redisStats ? (
                  <span className="text-emerald-400">{formatTimerValue(redisStats.backendMs)}</span>
                ) : (
                  <span className="text-text-muted">-- ms</span>
                )}
              </div>
              {redisStats && (
                <span className="text-[10px] text-text-secondary font-mono">
                  Readout: {redisStats.backendMs}ms | Network roundtrip: {redisStats.networkMs}ms
                </span>
              )}
            </div>

            {/* Flat design success button */}
            <button
              onClick={handleFetchRedis}
              disabled={dbLoading || redisLoading || redisStatus !== 'Online'}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {redisLoading ? (
                <>
                  <Timer className="w-4 h-4 spinner" />
                  Reading Redis...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Read from Redis Cache
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Visual Performance Metrics Bar & Text (SaaS Comparison Widget) */}
      {hasBothStats && (
        <div className="glass-card p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-base font-bold text-white">
                Cache Optimization Delta
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Performance evaluation comparing raw disk queries vs in-memory reads.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-bold">Performance Gain</span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                -{pctFaster}% Latency
              </div>
            </div>
          </div>

          {/* Visual Horizontal Tracks comparing duration */}
          <div className="flex flex-col gap-2 mt-1">
            {/* PostgreSQL bar */}
            <div className="flex items-center gap-4">
              <span className="w-24 text-[10px] font-mono text-text-secondary font-semibold">PostgreSQL</span>
              <div className="flex-grow bg-white/5 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: '100%' }}
                />
              </div>
              <span className="w-16 text-right text-xs font-bold text-red-400 font-mono">{dbStats.backendMs}ms</span>
            </div>

            {/* Redis bar */}
            <div className="flex items-center gap-4">
              <span className="w-24 text-[10px] font-mono text-text-secondary font-semibold">Redis Cache</span>
              <div className="flex-grow bg-white/5 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${Math.max((redisStats.backendMs / dbStats.backendMs) * 100, 1.5)}%` 
                  }}
                />
              </div>
              <span className="w-16 text-right text-xs font-bold text-emerald-400 font-mono">{redisStats.backendMs}ms</span>
            </div>
          </div>

          <div className="text-xs text-text-secondary font-semibold leading-relaxed border-t border-white/5 pt-3.5 font-mono">
            💡 <span className="text-white">Analysis:</span> Redis responded in <span className="text-emerald-400 font-bold">{redisStats.backendMs}ms</span> compared to PostgreSQL's <span className="text-red-400 font-bold">{dbStats.backendMs}ms</span>. This represents a <span className="text-emerald-400 font-bold">{speedMultiplier}x</span> increase in transaction analysis speed.
          </div>
        </div>
      )}
    </section>
  );
};
