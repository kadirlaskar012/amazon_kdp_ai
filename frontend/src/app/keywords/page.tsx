'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { KeyRound, Search, Sparkles, Filter, Download, ArrowRight, Loader2, Bookmark, Check } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { Keyword } from '@/lib/types';

export default function KeywordResearchPage() {
  const [seedKeyword, setSeedKeyword] = useState('mindfulness coloring book');
  const [marketplace, setMarketplace] = useState('US');
  const [expandDepth, setExpandDepth] = useState(1);
  const [includeQuestions, setIncludeQuestions] = useState(true);
  const [includeBuyerIntent, setIncludeBuyerIntent] = useState(true);

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [topOpportunities, setTopOpportunities] = useState<Keyword[]>([]);
  const [dataStatus, setDataStatus] = useState('LIVE');
  const [isLoading, setIsLoading] = useState(false);
  const [savedKeyword, setSavedKeyword] = useState<string | null>(null);

  useEffect(() => {
    handleResearch();
  }, []);

  const handleResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!seedKeyword.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.researchKeywords({
        seed_keyword: seedKeyword,
        marketplace,
        expand_depth: expandDepth,
        include_questions: includeQuestions,
        include_buyer_intent: includeBuyerIntent,
      });

      setKeywords(res.keywords || []);
      setTopOpportunities(res.top_opportunities || []);
      setDataStatus(res.data_status || 'LIVE');
    } catch (err) {
      setKeywords([]);
      setDataStatus('UNAVAILABLE');
    }
    setIsLoading(false);
  };

  const handleSaveToWatchlist = async (kw: Keyword) => {
    try {
      await api.addToWatchlist({
        item_type: 'KEYWORD',
        item_id: kw.keyword,
        marketplace,
        label: `Keyword: ${kw.keyword}`
      });
      setSavedKeyword(kw.keyword);
      setTimeout(() => setSavedKeyword(null), 2000);
    } catch (e) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Keyword Research Engine</h1>
            <StatusBadge status={dataStatus} source="Amazon Live Autocomplete" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Expand seed terms with real Amazon search suggestions and calculate KDP Keyword Opportunity Scores.
          </p>
        </div>

        <Link
          href={`/easy-rank?seed=${encodeURIComponent(seedKeyword)}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>View Easy-Rank Gems</span>
        </Link>
      </div>

      {/* Input Search Form */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <form onSubmit={handleResearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter seed keyword (e.g. coloring book, word search, planner)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Expand Keywords</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeBuyerIntent}
              onChange={(e) => setIncludeBuyerIntent(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500"
            />
            <span>Include Buyer-Intent Expansions (&quot;best&quot;, &quot;gift&quot;, &quot;2026&quot;)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeQuestions}
              onChange={(e) => setIncludeQuestions(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500"
            />
            <span>Include Question Queries (&quot;how to&quot;, &quot;guide&quot;)</span>
          </label>
        </div>
      </div>

      {/* Top Opportunities Highlight */}
      {topOpportunities.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Top 5 High-Opportunity Keyword Targets</h3>
            </div>
            <span className="text-[10px] text-slate-400">Score based on demand vs competition</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topOpportunities.slice(0, 5).map((top, idx) => (
              <div key={idx} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase">Target #{idx + 1}</span>
                <p className="font-bold text-xs text-white line-clamp-2">{top.keyword}</p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Score:</span>
                  <span className="font-bold text-emerald-400 font-mono">{top.opportunity_score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Keyword Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Retrieving real-time search suggestions from Amazon endpoint...</p>
          </div>
        ) : keywords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Keyword Suggestion</th>
                  <th className="py-3 px-3">Cluster</th>
                  <th className="py-3 px-3">Opportunity Score</th>
                  <th className="py-3 px-3">Competition</th>
                  <th className="py-3 px-3">Search Demand</th>
                  <th className="py-3 px-3">Recommended Use</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {keywords.map((k, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {k.keyword}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                        {k.cluster_group || 'Long-Tail'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`font-mono font-bold ${
                        k.opportunity_score >= 75 ? 'text-emerald-400' :
                        k.opportunity_score >= 60 ? 'text-sky-400' : 'text-amber-400'
                      }`}>
                        {k.opportunity_score.toFixed(1)} / 100
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {k.competition_score.toFixed(0)} / 100
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        k.search_volume_indicator === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                      }`}>
                        {k.search_volume_indicator}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {k.recommended_use || 'Backend Keyword'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSaveToWatchlist(k)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Save to Watchlist"
                        >
                          {savedKeyword === k.keyword ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                        </button>
                        <Link
                          href={`/competition?niche=${encodeURIComponent(k.keyword)}`}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-medium transition-all"
                        >
                          Analyze
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            Live data unavailable.
          </div>
        )}
      </div>

      <EvidencePanel
        evidence={{
          seed_keyword: seedKeyword,
          marketplace,
          total_suggestions_generated: keywords.length,
          source_endpoint: 'completion.amazon.com/api/2017/suggestions'
        }}
        methodology="Score = 40% (100 - Competition Score) + 35% Search Demand Signal + 25% Trend."
        source="Amazon Completion Service"
        dataStatus={dataStatus}
      />
    </div>
  );
}
