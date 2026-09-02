'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Search, Loader2, ArrowRight, ShieldCheck, CheckCircle2, Trophy, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';

export default function WhatToPublishPage() {
  const [themePrompt, setThemePrompt] = useState('kids activity and coloring books');
  const [marketplace, setMarketplace] = useState('US');
  const [rankedOpportunities, setRankedOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runRecommendationPipeline();
  }, []);

  const runRecommendationPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!themePrompt.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.whatShouldIPublish(themePrompt, marketplace);
      setRankedOpportunities(res.opportunities || []);
    } catch (e) {
      setRankedOpportunities([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              &quot;What Should I Publish?&quot; Engine
            </h1>
            <StatusBadge status="CALCULATED" source="Multi-Factor Opportunity Engine" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated 10-step market research pipeline generating top ranked publishing opportunities.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={runRecommendationPipeline} className="flex gap-3">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={themePrompt}
              onChange={(e) => setThemePrompt(e.target.value)}
              placeholder="e.g. 'I want to create a puzzle book for seniors' or 'guided gratitude journal'..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Run 10-Step Analysis</span>
          </button>
        </form>
      </div>

      {/* Pipeline Status Cards */}
      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Running 10-Step Intelligence Pipeline...</p>
            <p className="text-xs text-slate-400">Sampling Amazon demand, competitor review barriers, seasonal calendars, and content gaps...</p>
          </div>
        </div>
      ) : rankedOpportunities.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Top Ranked Publishing Opportunities for &quot;{themePrompt}&quot;</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {rankedOpportunities.map((opp) => (
              <div key={opp.rank} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                      #{opp.rank}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">{opp.niche}</h3>
                      <p className="text-xs text-slate-400">{opp.why}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs font-mono">
                      Opportunity: {opp.opportunity_score}/100
                    </div>
                    <Link
                      href={`/ideas?niche=${encodeURIComponent(opp.niche)}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-all"
                    >
                      <span>Create Concepts</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Demand Signal</span>
                    <p className="text-slate-200">{opp.demand_signals}</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Competition Barrier</span>
                    <p className="text-emerald-400 font-semibold">{opp.competition_level} ({opp.competition_score}/100)</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Content Gap</span>
                    <p className="text-slate-200">{opp.content_gap}</p>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Recommended Timing</span>
                    <p className="text-slate-200">{opp.recommended_timing}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          No opportunities calculated.
        </div>
      )}

      <EvidencePanel
        evidence={{
          theme_prompt: themePrompt,
          marketplace,
          total_opportunities: rankedOpportunities.length
        }}
        methodology="Multi-factor algorithmic ranking weighting real autocomplete search volume, review barrier thresholds, and content differentiators."
        source="OpportunityEngine & Amazon Completion"
        dataStatus="CALCULATED"
      />
    </div>
  );
}
