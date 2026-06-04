'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Database, Zap, Timer, Flame, ArrowRight, Terminal, Server, ShieldCheck } from 'lucide-react';

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

  // Stopwatches
  const [dbTimer, setDbTimer] = useState<number>(0);
  const [redisTimer, setRedisTimer] = useState<number>(0);

  const dbIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Telemetry Console logs
  const [dbLogs, setDbLogs] = useState<string[]>(['> Idle. Awaiting execution trigger...']);
  const [redisLogs, setRedisLogs] = useState<string[]>(['> Idle. Awaiting execution trigger...']);
  
  const dbLogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redisLogIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll logs containers
  const dbConsoleRef = useRef<HTMLDivElement>(null);
  const redisConsoleRef = useRef<HTMLDivElement>(null);

  const scrollConsoleToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollConsoleToBottom(dbConsoleRef);
  }, [dbLogs]);

  useEffect(() => {
    scrollConsoleToBottom(redisConsoleRef);
  }, [redisLogs]);

  // PostgreSQL Chronometer & Telemetry Simulation
  useEffect(() => {
    if (dbLoading) {
      setDbTimer(0);
      setDbStats(null);
      
      // Reset and trigger stopwatch
      const startTime = Date.now();
      dbIntervalRef.current = setInterval(() => {
        setDbTimer(Date.now() - startTime);
      }, 10);

      // Trigger telemetry logs
      setDbLogs([
        `[${new Date().toLocaleTimeString()}] [SYS] Initializing connection to Postgres...`,
        `[${new Date().toLocaleTimeString()}] [SYS] TCP handshake established with postgres:5435`,
      ]);

      const logPool = [
        `[SQL] SELECT count(*), sum(amount) FROM "Sale" ...`,
        `[SQL] Scanning indexed columns [category_idx, soldAt_idx]`,
        `[SQL] Aggregating 500,000 records in table "Sale"...`,
        `[SQL] Grouping tuples by Category and Region`,
        `[SQL] Computing AVG(amount) and SUM(quantity)...`,
        `[SQL] Processing date TO_CHAR parsing for monthly charts`,
        `[SYS] Formatting payload JSON buffer...`,
      ];

      let poolIndex = 0;
      dbLogIntervalRef.current = setInterval(() => {
        if (poolIndex < logPool.length) {
          setDbLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${logPool[poolIndex]}`]);
          poolIndex++;
        }
      }, 250); // Append log line every 250ms
    } else {
      // Clear timers
      if (dbIntervalRef.current) {
        clearInterval(dbIntervalRef.current);
        dbIntervalRef.current = null;
      }
      if (dbLogIntervalRef.current) {
        clearInterval(dbLogIntervalRef.current);
        dbLogIntervalRef.current = null;
      }
    }
    return () => {
      if (dbIntervalRef.current) clearInterval(dbIntervalRef.current);
      if (dbLogIntervalRef.current) clearInterval(dbLogIntervalRef.current);
    };
  }, [dbLoading]);

  // Handle final Postgres stats logging
  useEffect(() => {
    if (dbStats && !dbLoading) {
      setDbLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SYS] Query successfully executed on database engine.`,
        `[${new Date().toLocaleTimeString()}] [RES] DB execution: ${dbStats.backendMs}ms | Network roundtrip: ${dbStats.networkMs}ms`,
        `> DONE.`
      ]);
    }
  }, [dbStats, dbLoading]);

  // Redis Chronometer & Telemetry Simulation
  useEffect(() => {
    if (redisLoading) {
      setRedisTimer(0);
      setRedisStats(null);
      
      const startTime = Date.now();
      redisIntervalRef.current = setInterval(() => {
        setRedisTimer(Date.now() - startTime);
      }, 10);

      setRedisLogs([
        `[${new Date().toLocaleTimeString()}] [SYS] Initializing Redis connection...`,
        `[${new Date().toLocaleTimeString()}] [SYS] Connected to redis:6379 via CacheManager`,
        `[CACHE] GET sales:benchmark:dashboard`,
      ]);

      const logPool = [
        `[CACHE] Searching active keys in RAM...`,
        `[CACHE] Key found! Resolving serialized string...`,
      ];

      let poolIndex = 0;
      redisLogIntervalRef.current = setInterval(() => {
        if (poolIndex < logPool.length) {
          setRedisLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${logPool[poolIndex]}`]);
          poolIndex++;
        }
      }, 50); // Fast log lines for Redis
    } else {
      if (redisIntervalRef.current) {
        clearInterval(redisIntervalRef.current);
        redisIntervalRef.current = null;
      }
      if (redisLogIntervalRef.current) {
        clearInterval(redisLogIntervalRef.current);
        redisLogIntervalRef.current = null;
      }
    }
    return () => {
      if (redisIntervalRef.current) clearInterval(redisIntervalRef.current);
      if (redisLogIntervalRef.current) clearInterval(redisLogIntervalRef.current);
    };
  }, [redisLoading]);

  // Handle final Redis stats logging
  useEffect(() => {
    if (redisStats && !redisLoading) {
      setRedisLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [CACHE] Cache HIT. Skipping PostgreSQL query layer.`,
        `[${new Date().toLocaleTimeString()}] [RES] Cache readout: ${redisStats.backendMs}ms | Network roundtrip: ${redisStats.networkMs}ms`,
        `> DONE.`
      ]);
    }
  }, [redisStats, redisLoading]);

  const handleFetchDb = async () => {
    try {
      const stats = await onFetchDb();
      setDbStats({ backendMs: stats.executionTimeMs, networkMs: stats.networkTimeMs });
    } catch {
      setDbLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [ERR] Error communicating with Postgres.`]);
    }
  };

  const handleFetchRedis = async () => {
    try {
      const stats = await onFetchRedis();
      setRedisStats({ backendMs: stats.executionTimeMs, networkMs: stats.networkTimeMs });
    } catch {
      setRedisLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [ERR] Error communicating with Redis.`]);
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

  return (
    <section className="flex flex-col gap-6 mb-8">
      {/* The Arena Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PostgreSQL Raw Query Panel */}
        <div className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden border-red-500/10 ${dbLoading ? 'glow-postgres active border-red-500/30' : ''}`}>
          {/* Header glowing line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-600 to-transparent" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 bg-red-950/20 px-3 py-1.5 rounded-xl border border-red-500/10">
                <Database className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
                  Engine A
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                PostgreSQL DB
              </span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight mb-2">Relational Aggregations</h3>
            
            {/* System Specs List */}
            <div className="grid grid-cols-2 gap-2 mb-6 text-[10px] font-semibold text-text-secondary font-mono">
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                <Server className="w-3 h-3 text-red-400" />
                <span>INDEXES: ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                <ShieldCheck className="w-3 h-3 text-red-400" />
                <span>CAPACITY: 500K rows</span>
              </div>
            </div>
          </div>

          <div>
            {/* Chronometer & Output Screen */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-5">
              
              {/* Chronometer display */}
              <div className="sm:col-span-2 bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center min-h-[110px] relative">
                <span className="text-[9px] text-text-muted uppercase tracking-widest absolute top-2 font-bold font-mono">
                  Stopwatch
                </span>
                
                {dbLoading ? (
                  <span className="timer-text text-2xl text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    {formatTimerValue(dbTimer)}
                  </span>
                ) : dbStats ? (
                  <span className="timer-text text-2xl text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                    {formatTimerValue(dbStats.backendMs)}
                  </span>
                ) : (
                  <span className="timer-text text-2xl text-text-muted">
                    0.00s
                  </span>
                )}
                
                <span className="text-[8px] text-text-muted font-bold font-mono absolute bottom-2">
                  PORT 5435
                </span>
              </div>

              {/* Console Logs */}
              <div className="sm:col-span-3 flex flex-col">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 font-mono">
                  <Terminal className="w-3 h-3 text-red-400" />
                  <span>SQL Telemetry Stream</span>
                </div>
                
                <div ref={dbConsoleRef} className="telemetry-console scrollbar-thin">
                  {dbLogs.map((log, index) => (
                    <div key={index} className="telemetry-line text-red-400/90 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Trigger */}
            <button
              onClick={handleFetchDb}
              disabled={dbLoading || redisLoading || postgresStatus !== 'Online'}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold py-3.5 px-6 rounded-xl border border-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 cursor-pointer text-xs uppercase tracking-wider font-mono"
            >
              {dbLoading ? (
                <>
                  <Timer className="w-4 h-4 spinner" />
                  Query executing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Execute Raw SQL query
                </>
              )}
            </button>
          </div>
        </div>

        {/* Redis Cache Panel */}
        <div className={`glass-card p-6 flex flex-col justify-between relative overflow-hidden border-emerald-500/10 ${redisLoading ? 'glow-redis active border-emerald-500/30' : ''}`}>
          {/* Header glowing line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-transparent" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  Engine B
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                Redis Cache
              </span>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight mb-2">In-Memory Readout</h3>
            
            {/* System Specs List */}
            <div className="grid grid-cols-2 gap-2 mb-6 text-[10px] font-semibold text-text-secondary font-mono">
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>STORAGE: L1 RAM</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>TTL POLICY: 60s window</span>
              </div>
            </div>
          </div>

          <div>
            {/* Chronometer & Output Screen */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-5">
              
              {/* Chronometer display */}
              <div className="sm:col-span-2 bg-black/40 rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center min-h-[110px] relative">
                <span className="text-[9px] text-text-muted uppercase tracking-widest absolute top-2 font-bold font-mono">
                  Stopwatch
                </span>
                
                {redisLoading ? (
                  <span className="timer-text text-2xl text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                    {formatTimerValue(redisTimer)}
                  </span>
                ) : redisStats ? (
                  <span className="timer-text text-2xl text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                    {formatTimerValue(redisStats.backendMs)}
                  </span>
                ) : (
                  <span className="timer-text text-2xl text-text-muted">
                    0 ms
                  </span>
                )}
                
                <span className="text-[8px] text-text-muted font-bold font-mono absolute bottom-2">
                  PORT 6379
                </span>
              </div>

              {/* Console Logs */}
              <div className="sm:col-span-3 flex flex-col">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 font-mono">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span>Cache Telemetry Stream</span>
                </div>
                
                <div ref={redisConsoleRef} className="telemetry-console scrollbar-thin">
                  {redisLogs.map((log, index) => (
                    <div key={index} className="telemetry-line text-emerald-400/90 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Trigger */}
            <button
              onClick={handleFetchRedis}
              disabled={dbLoading || redisLoading || redisStatus !== 'Online'}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold py-3.5 px-6 rounded-xl border border-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 cursor-pointer text-xs uppercase tracking-wider font-mono"
            >
              {redisLoading ? (
                <>
                  <Timer className="w-4 h-4 spinner" />
                  Cache reading...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Read from Redis cache
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Speed Multiplier Banner (redesigned like a glowing speedometer) */}
      {hasBothStats && (
        <div className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-red-500/10 border-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Neon background flare */}
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-emerald-500/10 filter blur-[40px] pointer-events-none rounded-full" />
          
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/15 p-3 rounded-2xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Flame className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white flex items-center gap-1.5">
                Speed Benchmark: Redis is <span className="text-emerald-400 font-mono text-xl font-black">{speedMultiplier}x</span> faster!
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                RAM lookup successfully bypassed un-cached physical disk sweeps over 500,000 PostgreSQL records.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-bold font-mono">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-text-muted uppercase font-semibold">Postgres raw</span>
              <div className="flex items-center gap-1 text-red-400 bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-500/10 mt-0.5">
                <Database className="w-3.5 h-3.5" />
                <span>{dbStats.backendMs}ms</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted mt-4" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] text-text-muted uppercase font-semibold">Redis RAM</span>
              <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-500/10 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{redisStats.backendMs}ms</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
