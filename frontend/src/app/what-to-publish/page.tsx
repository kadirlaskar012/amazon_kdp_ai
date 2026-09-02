'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Search, Loader2, ArrowRight, ShieldCheck, CheckCircle2, 
  Trophy, ArrowUpRight, ArrowUpDown, Filter, SlidersHorizontal, RotateCcw 
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';

export default function WhatToPublishPage() {
  const [themePrompt, setThemePrompt] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [marketplace, setMarketplace] = useState('US');
  const [rankedOpportunities, setRankedOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sort & Filter States
  const [searchFilter, setSearchFilter] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState<'rank_asc' | 'score_desc' | 'score_asc' | 'comp_asc'>('rank_asc');

  const runRecommendationPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!themePrompt.trim()) return;

    setHasSearched(true);
    setIsLoading(true);
    try {
      const res = await api.whatShouldIPublish(themePrompt, marketplace);
      setRankedOpportunities(res.opportunities || []);
    } catch (e) {
      setRankedOpportunities([]);
    }
    setIsLoading(false);
  };

  const filteredAndSortedOpportunities = useMemo(() => {
    let list = [...rankedOpportunities];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(opp => 
        opp.niche.toLowerCase().includes(q) ||
        (opp.why && opp.why.toLowerCase().includes(q)) ||
        (opp.content_gap && opp.content_gap.toLowerCase().includes(q)) ||
        (opp.demand_signals && opp.demand_signals.toLowerCase().includes(q))
      );
    }

    if (competitionFilter !== 'ALL') {
      list = list.filter(opp => (opp.competition_level || '').toUpperCase() === competitionFilter);
    }

    if (minScoreFilter > 0) {
      list = list.filter(opp => (opp.opportunity_score || 0) >= minScoreFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'rank_asc') return (a.rank || 0) - (b.rank || 0);
      if (sortBy === 'score_desc') return (b.opportunity_score || 0) - (a.opportunity_score || 0);
      if (sortBy === 'score_asc') return (a.opportunity_score || 0) - (b.opportunity_score || 0);
      if (sortBy === 'comp_asc') return (a.competition_score || 0) - (b.competition_score || 0);
      return 0;
    });

    return list;
  }, [rankedOpportunities, searchFilter, competitionFilter, minScoreFilter, sortBy]);

  const hasActiveFilters = searchFilter || competitionFilter !== 'ALL' || minScoreFilter > 0 || sortBy !== 'rank_asc';

  const resetFilters = () => {
    setSearchFilter('');
    setCompetitionFilter('ALL');
    setMinScoreFilter(0);
    setSortBy('rank_asc');
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

      {/* Sort & Filter Controls */}
      {rankedOpportunities.length > 0 && !isLoading && (
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Filter & Sort Opportunities:</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                Showing {filteredAndSortedOpportunities.length} of {rankedOpportunities.length}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors self-start md:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter niches or content gaps..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="rank_asc">Overall Rank (#1 to #10)</option>
                <option value="score_desc">Opportunity Score (Highest)</option>
                <option value="score_asc">Opportunity Score (Lowest)</option>
                <option value="comp_asc">Competition (Lowest First)</option>
              </select>
            </div>

            {/* Competition Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Competition Levels</option>
                <option value="VERY EASY">Very Easy Only</option>
                <option value="EASY">Easy Only</option>
                <option value="MODERATE">Moderate</option>
              </select>
            </div>

            {/* Min Score Filter */}
            <div className="flex items-center gap-2">
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value={0}>All Scores</option>
                <option value={75}>Min Score 75+</option>
                <option value={80}>Min Score 80+</option>
                <option value={85}>Min Score 85+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Status Cards */}
      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Running 10-Step Intelligence Pipeline...</p>
            <p className="text-xs text-slate-400">Sampling Amazon demand, competitor review barriers, seasonal calendars, and content gaps...</p>
          </div>
        </div>
      ) : filteredAndSortedOpportunities.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Top Ranked Opportunities for &quot;{themePrompt}&quot;</span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedOpportunities.map((opp) => (
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
      ) : rankedOpportunities.length > 0 ? (
        <div className="py-16 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
          <p className="text-sm font-bold text-white">No opportunities match your filter criteria.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
          >
            Reset Filters
          </button>
        </div>
      ) : !hasSearched ? (
        <div className="py-20 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
          <Sparkles className="w-12 h-12 text-amber-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-white">Ready to Rank Top Publishing Opportunities</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Type your broad niche, theme, or category above and click &quot;Run Opportunity Ranking Pipeline&quot; to discover top gaps.
          </p>
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
