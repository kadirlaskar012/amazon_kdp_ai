'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Gem, Search, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { Keyword } from '@/lib/types';

function EasyRankContent() {
  const searchParams = useSearchParams();
  const seedParam = searchParams.get('seed') || 'puzzle book';

  const [seed, setSeed] = useState(seedParam);
  const [marketplace, setMarketplace] = useState('US');
  const [gems, setGems] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState('LIVE');

  useEffect(() => {
    loadEasyRankGems();
  }, []);

  const loadEasyRankGems = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!seed.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.getEasyRankKeywords({
        seed_keyword: seed,
        marketplace,
        expand_depth: 2
      });
      setGems(res.gems || []);
      setDataStatus(res.data_status || 'LIVE');
    } catch (e) {
      setGems([]);
      setDataStatus('UNAVAILABLE');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gem className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Easy-Rank Keyword Finder</h1>
            <StatusBadge status={dataStatus} source="Amazon Live Autocomplete" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Isolates low-competition keyword gems with maximum algorithmic entry opportunity.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={loadEasyRankGems} className="flex gap-3">
          <div className="relative flex-1">
            <Gem className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed niche (e.g. word search, journal for teens)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Find Gems</span>
          </button>
        </form>
      </div>

      {/* Gems Cards Grid */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Discovered Low-Competition Opportunities ({gems.length})</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Competition ≤ 45/100
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Filtering Amazon suggestion tree for low-barrier terms...</p>
          </div>
        ) : gems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gems.map((g, idx) => (
              <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">OPPORTUNITY #{idx + 1}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    Score: {g.opportunity_score}/100
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{g.keyword}</h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400">Competition:</span>
                    <p className="font-semibold text-emerald-400 font-mono">{g.competition_score}/100 (Low)</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Recommended Placement:</span>
                    <p className="font-semibold text-sky-400">{g.recommended_use || 'Subtitle'}</p>
                  </div>
                </div>
                <Link
                  href={`/competition?niche=${encodeURIComponent(g.keyword)}`}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                >
                  <span>Analyze Competitors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            No gems found matching current threshold. Try expanding a different seed term.
          </div>
        )}
      </div>

      <EvidencePanel
        evidence={{
          seed,
          marketplace,
          filter_threshold: 'Competition <= 45/100 and Opportunity >= 65/100',
          total_gems: gems.length
        }}
        methodology="Alpha-expanded Amazon autocomplete suggestions filtered against competition barrier proxy."
        source="Amazon Completion Service"
        dataStatus={dataStatus}
      />
    </div>
  );
}

export default function EasyRankPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-slate-400">Loading Easy-Rank Finder...</div>}>
      <EasyRankContent />
    </Suspense>
  );
}
