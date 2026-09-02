'use client';

import React, { useState, useEffect } from 'react';
import { TerminalSquare, Filter, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { SystemLog } from '@/lib/types';

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [levelFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSystemLogs(levelFilter || undefined, 100);
      setLogs(res || []);
    } catch (e) {
      setLogs([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TerminalSquare className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">System Audit Logs</h1>
            <StatusBadge status="LIVE" source="Engine Logger" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Structured audit trail of pipeline requests, connector dispatches, rate limits, and scheduler events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
          >
            <option value="">All Log Levels</option>
            <option value="INFO">INFO Only</option>
            <option value="WARN">WARN Only</option>
            <option value="ERROR">ERROR Only</option>
            <option value="AUDIT">AUDIT Only</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Refresh Logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Terminal Panel */}
      <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3 bg-[#060a12]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs font-mono text-slate-400 ml-2">kdp-studio-system.log</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{logs.length} Log Entries</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length > 0 ? (
          <div className="space-y-1.5 font-mono text-[11px] max-h-[550px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.id} className="p-2 rounded-lg bg-slate-950/60 border border-slate-900 flex items-start gap-3 hover:bg-slate-900/40">
                <span className="text-slate-400 flex-shrink-0">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold flex-shrink-0 ${
                  log.level === 'INFO' ? 'bg-sky-500/20 text-sky-400' :
                  log.level === 'WARN' ? 'bg-amber-500/20 text-amber-400' :
                  log.level === 'ERROR' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {log.level}
                </span>
                <span className="text-indigo-300 font-semibold flex-shrink-0">[{log.component}]</span>
                <span className="text-slate-200 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-xs text-slate-400">
            No system log records found matching current filter.
          </div>
        )}
      </div>
    </div>
  );
}
