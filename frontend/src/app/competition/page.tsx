'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Swords, Search, ShieldCheck, AlertTriangle, CheckCircle, 
  Sparkles, ExternalLink, Loader2, ArrowRight 
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';

function CompetitionContent() {
  const searchParams = useSearchParams();
  const initialNiche = searchParams.get('niche') || 'mandala coloring book for adults';

  const [keyword, setKeyword] = useState(initialNiche);
  const [marketplace, setMarketplace] = useState('US');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.analyzeCompetition({
        keyword,
        marketplace,
        sample_size: 20
      });
      setAnalysis(res);
    } catch (e) {
      setAnalysis(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-rose-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Competition Analyzer</h1>
            <StatusBadge status={analysis?.data_status || 'LIVE'} source="Amazon Live Search" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculate empirical entry barriers, review distributions, and discover underserved content gaps.
          </p>
        </div>

        <Link
          href={`/strategy?niche=${encodeURIComponent(keyword)}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all"
        >
          <span>Generate Ranking Blueprint</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={runAnalysis} className="flex gap-3">
          <div className="relative flex-1">
            <Swords className="w-4 h-4 text-rose-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter niche or target keyword to analyze competitors..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Analyze Niche</span>
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Sampling top 20 Amazon competitors and calculating barrier scores...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                KDP Competition Score
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-white font-mono">{analysis.competition_score}/100</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                  analysis.competition_level === 'VERY_EASY' ? 'bg-emerald-500/20 text-emerald-400' :
                  analysis.competition_level === 'EASY' ? 'bg-emerald-500/20 text-emerald-400' :
                  analysis.competition_level === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-rose-500/20 text-rose-400'
                }`}>
                  {analysis.competition_level?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {analysis.score_breakdown?.methodology || 'Calculated from review and sales velocity barriers.'}
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                KDP Opportunity Score
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">{analysis.opportunity_score}/100</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                  {analysis.opportunity_level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Combines inverted competition barriers with observed autocomplete search signals.
              </p>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                Competitor Review Distribution
              </span>
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">&lt; 100 Reviews (Accessible):</span>
                  <b className="text-emerald-400">{analysis.metrics?.low_review_competitors_count} books</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">100 - 500 Reviews:</span>
                  <b className="text-amber-400">{analysis.metrics?.mid_review_competitors_count} books</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">&gt; 500 Reviews (Established):</span>
                  <b className="text-rose-400">{analysis.metrics?.high_review_competitors_count} books</b>
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column: Content Gaps & Cover Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Identified Market & Content Gaps</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.content_gaps?.map((gap: string, idx: number) => (
                  <li key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Cover Visual Differentiation Angles</h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysis.cover_differentiation_opportunities?.map((opp: string, idx: number) => (
                  <li key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top Competitor Books Sample Table */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Top 20 Competitor Breakdown</h3>
              <span className="text-xs text-slate-400">
                Median Reviews: <b className="text-white">{analysis.metrics?.median_reviews}</b> | Avg Price: <b className="text-white">${analysis.metrics?.avg_price?.toFixed(2)}</b>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Reviews</th>
                    <th className="py-2.5 px-3">Est. Sales</th>
                    <th className="py-2.5 px-3 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysis.top_books?.map((b: any) => (
                    <tr key={b.asin} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-slate-200 truncate max-w-xs">{b.title}</td>
                      <td className="py-2.5 px-3 text-white font-semibold">{b.price ? `$${b.price.toFixed(2)}` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-amber-400">★ {b.current_rating ? b.current_rating.toFixed(1) : 'N/A'}</td>
                      <td className="py-2.5 px-3 font-mono">{b.current_review_count?.toLocaleString() || '0'}</td>
                      <td className="py-2.5 px-3 font-mono text-sky-400">{b.estimated_monthly_sales ? `~${b.estimated_monthly_sales.toLocaleString()}` : 'N/A'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                          <ExternalLink className="w-3.5 h-3.5 inline" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          Live competitor data unavailable.
        </div>
      )}

      {analysis && (
        <EvidencePanel
          evidence={analysis.evidence || {}}
          methodology="KDP Intelligence Competition Score Formula: 50% Review Barrier + 35% BSR Sales Barrier + 15% Rating Barrier."
          source="Amazon Live Catalog Connector"
          dataStatus={analysis.data_status}
        />
      )}
    </div>
  );
}

export default function CompetitionAnalyzerPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-slate-400">Loading Competition Analyzer...</div>}>
      <CompetitionContent />
    </Suspense>
  );
}
