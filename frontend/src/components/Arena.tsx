'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, Zap, Timer, Flame, ArrowRight } from 'lucide-react';

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

  // Stopwatches for real-time visual feedback
  const [dbTimer, setDbTimer] = useState<number>(0);
  const [redisTimer, setRedisTimer] = useState<number>(0);

  const dbIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // PostgreSQL Timer trigger
  useEffect(() => {
    if (dbLoading) {
      setDbTimer(0);
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

  // Redis Timer trigger
  useEffect(() => {
    if (redisLoading) {
      setRedisTimer(0);
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
    setDbStats(null);
    try {
      const stats = await onFetchDb();
      setDbStats({ backendMs: stats.executionTimeMs, networkMs: stats.networkTimeMs });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFetchRedis = async () => {
    setRedisStats(null);
    try {
      const stats = await onFetchRedis();
      setRedisStats({ backendMs: stats.executionTimeMs, networkMs: stats.networkTimeMs });
    } catch (e) {
      console.error(e);
    }
  };

  // Format timer values nicely (e.g. 1.25s or 12ms)
  const formatTimerValue = (ms: number) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms} ms`;
  };

  // Speed multiplier calculations
  const hasBothStats = dbStats !== null && redisStats !== null;
  const speedMultiplier = hasBothStats
    ? (dbStats.backendMs / Math.max(redisStats.backendMs, 1)).toFixed(1)
    : '0';

  return (
    <section className="flex flex-col gap-6 mb-8">
      {/* The Arena Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostgreSQL Raw Query Panel */}
        <div className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden border-red-500/10 ${dbLoading ? 'glow-postgres active border-red-500/30' : ''}`}>
          <div className="absolute top-0 left-0 w-1 bg-red-500 h-full" />
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-red-400 font-mono">
                  PostgreSQL
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted border border-white/5 px-2 py-0.5 rounded">
                Raw Query
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Aggregate 500,000 Records</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Forces PostgreSQL to perform a heavy calculation directly in storage. Executes multiple tables groups, counts, averages, and string formats on-the-fly.
            </p>
          </div>

          <div>
            {/* Timer Screen */}
            <div className="bg-black/40 rounded-2xl border border-white/5 p-5 mb-5 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase tracking-widest absolute top-3 font-semibold">
                Chronometer
              </span>
              
              {dbLoading ? (
                <div className="flex flex-col items-center mt-2">
                  <span className="timer-text text-4xl text-red-500 drop-shadow-[0_0_10px_rgba(255,51,85,0.4)]">
                    {formatTimerValue(dbTimer)}
                  </span>
                  <span className="text-[10px] text-red-400/80 animate-pulse uppercase tracking-wider font-semibold mt-1">
                    Calculating aggregations...
                  </span>
                </div>
              ) : dbStats ? (
                <div className="flex flex-col items-center mt-2">
                  <span className="timer-text text-4xl text-red-500 drop-shadow-[0_0_10px_rgba(255,51,85,0.3)]">
                    {formatTimerValue(dbStats.backendMs)}
                  </span>
                  <div className="flex gap-4 mt-2 text-[10px] text-text-secondary uppercase tracking-widest font-semibold font-mono">
                    <span>Query: {dbStats.backendMs}ms</span>
                    <span>Network: {dbStats.networkMs}ms</span>
                  </div>
                </div>
              ) : (
                <span className="timer-text text-4xl text-text-muted">
                  0.00s
                </span>
              )}
            </div>

            {/* Launch Trigger */}
            <button
              onClick={handleFetchDb}
              disabled={dbLoading || redisLoading || postgresStatus !== 'Online'}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 px-6 rounded-xl border border-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {dbLoading ? (
                <>
                  <Timer className="w-5 h-5 spinner" />
                  Aggregating...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5" />
                  Fetch Data (No Cache)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Redis Cache Panel */}
        <div className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden border-emerald-500/10 ${redisLoading ? 'glow-redis active border-emerald-500/30' : ''}`}>
          <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
          
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Redis Caching
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted border border-white/5 px-2 py-0.5 rounded">
                In-Memory RAM
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Read Pre-Compiled Cache</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-6">
              Retrieves the pre-compiled sales report structure from Redis memory. Skips physical database storage completely for sub-millisecond lookups.
            </p>
          </div>

          <div>
            {/* Timer Screen */}
            <div className="bg-black/40 rounded-2xl border border-white/5 p-5 mb-5 flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden">
              <span className="text-[10px] text-text-muted uppercase tracking-widest absolute top-3 font-semibold">
                Chronometer
              </span>
              
              {redisLoading ? (
                <div className="flex flex-col items-center mt-2">
                  <span className="timer-text text-4xl text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                    {formatTimerValue(redisTimer)}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 animate-pulse uppercase tracking-wider font-semibold mt-1">
                    Reading cache...
                  </span>
                </div>
              ) : redisStats ? (
                <div className="flex flex-col items-center mt-2">
                  <span className="timer-text text-4xl text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    {formatTimerValue(redisStats.backendMs)}
                  </span>
                  <div className="flex gap-4 mt-2 text-[10px] text-text-secondary uppercase tracking-widest font-semibold font-mono">
                    <span>Readout: {redisStats.backendMs}ms</span>
                    <span>Network: {redisStats.networkMs}ms</span>
                  </div>
                </div>
              ) : (
                <span className="timer-text text-4xl text-text-muted">
                  0 ms
                </span>
              )}
            </div>

            {/* Launch Trigger */}
            <button
              onClick={handleFetchRedis}
              disabled={dbLoading || redisLoading || redisStatus !== 'Online'}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl border border-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              {redisLoading ? (
                <>
                  <Timer className="w-5 h-5 spinner" />
                  Reading...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Fetch Data (Redis)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Speed Multiplier Performance Comparison Banner */}
      {hasBothStats && (
        <div className="glass-card p-5 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-red-500/10 border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
              <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">
                Redis is <span className="text-emerald-400 font-mono text-lg">{speedMultiplier}x</span> faster!
              </p>
              <p className="text-xs text-text-secondary">
                Caching bypasses expensive aggregations on 500,000 PostgreSQL records.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold font-mono">
            <div className="flex items-center gap-1 text-red-400 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-500/10">
              <Database className="w-3.5 h-3.5" />
              <span>{dbStats.backendMs}ms</span>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted" />
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-500/10">
              <Zap className="w-3.5 h-3.5" />
              <span>{redisStats.backendMs}ms</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
