'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, ShieldCheck, ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { TrendSignal } from '@/lib/types';

export default function TrendResearchPage() {
  const [query, setQuery] = useState('coloring book');
  const [marketplace, setMarketplace] = useState('US');
  const [signal, setSignal] = useState<TrendSignal | null>(null);
  const [risingList, setRisingList] = useState<TrendSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    setIsLoading(true);
    try {
      const [singleRes, risingRes] = await Promise.all([
        api.getTrendSignals(query, marketplace),
        api.getRisingTrends(marketplace)
      ]);
      setSignal(singleRes);
      setRisingList(risingRes.trends || []);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.getTrendSignals(query, marketplace);
      setSignal(res);
    } catch (e) {}
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Trend Research</h1>
            <StatusBadge status="OBSERVED" source="Google Trends & Suggest Signals" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time search momentum, forward-looking buyer queries, and velocity indicators.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trend signals for any niche or topic..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check Trend</span>
          </button>
        </form>
      </div>

      {/* Primary Trend Signal Display */}
      {signal && (
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Topic Signal</span>
              <h2 className="text-xl font-bold text-white mt-1 capitalize">{signal.topic}</h2>
            </div>
            <StatusBadge status={signal.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Trend Velocity</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">+{signal.velocity_percent}%</p>
              <p className="text-[10px] text-slate-400 mt-1">Calculated search depth</p>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Confidence</span>
              <p className="text-2xl font-bold text-sky-400 mt-1">{signal.confidence}</p>
              <p className="text-[10px] text-slate-400 mt-1">Based on active query volume</p>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Time Range</span>
              <p className="text-2xl font-bold text-white mt-1">{signal.time_range}</p>
              <p className="text-[10px] text-slate-400 mt-1">Forward-looking indicator</p>
            </div>
          </div>

          {signal.related_queries && signal.related_queries.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-200">Active Forward-Looking Search Queries:</span>
              <div className="flex flex-wrap gap-2">
                {signal.related_queries.map((q, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rising Trend Radar */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Observed High-Velocity KDP Niches</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {risingList.map((r, idx) => (
            <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white capitalize">{r.topic}</span>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{r.evidence}</p>
              <div className="pt-2 border-t border-slate-800 text-[11px] flex justify-between text-slate-400">
                <span>Momentum: <b className="text-emerald-400">+{r.velocity_percent}%</b></span>
                <span className="font-mono text-[10px]">{r.time_range}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {signal && (
        <EvidencePanel
          evidence={{
            topic: signal.topic,
            marketplace,
            velocity_percent: signal.velocity_percent,
            evidence: signal.evidence,
            confidence: signal.confidence
          }}
          methodology="Observable search suggestion depth and forward-looking query frequency."
          source="Google Suggest Trends Connector"
          dataStatus="OBSERVED"
        />
      )}
    </div>
  );
}
