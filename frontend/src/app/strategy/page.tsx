'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Target, Search, Sparkles, CheckCircle2, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { RankingStrategyResponse } from '@/lib/types';

function RankingStrategyContent() {
  const searchParams = useSearchParams();
  const initialNiche = searchParams.get('niche') || '';

  const [niche, setNiche] = useState(initialNiche);
  const [hasSearched, setHasSearched] = useState(Boolean(initialNiche));
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [targetPrice, setTargetPrice] = useState('8.99');
  const [marketplace, setMarketplace] = useState('US');

  const [strategy, setStrategy] = useState<RankingStrategyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialNiche) {
      generateStrategy();
    }
  }, [initialNiche]);

  const generateStrategy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!niche.trim()) return;

    setHasSearched(true);
    setIsLoading(true);
    try {
      const res = await api.getRankingStrategy({
        niche,
        primary_keyword: primaryKeyword,
        marketplace,
        target_price: parseFloat(targetPrice) || 8.99,
      });
      setStrategy(res);
    } catch (e) {
      setStrategy(null);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">KDP Ranking Strategy Engine</h1>
            <StatusBadge status="CALCULATED" source="A9 Algorithmic Strategy Engine" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evidence-based 10-point launch and ranking blueprint tailored to current Amazon A9 algorithm dynamics.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={generateStrategy} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Target Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Exact Primary Keyword</label>
            <input
              type="text"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Target Price ($)</label>
            <input
              type="number"
              step="0.5"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              <span>Generate Blueprint</span>
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing 10-stage launch blueprint from market evidence...</p>
        </div>
      ) : strategy ? (
        <div className="space-y-6">
          {/* Why This Strategy Evidence Banner */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3 bg-gradient-to-r from-sky-950/20 via-slate-900 to-slate-900">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>&quot;Why This Strategy?&quot; — Factual Algorithmic Evidence</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {strategy.why_this_recommendation?.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-sky-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 10 Strategic Roadmap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">1. Keyword Indexing Strategy</span>
              <p className="text-slate-200 leading-relaxed">{strategy.keyword_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">2. Title & Subtitle Strategy</span>
              <p className="text-slate-200 leading-relaxed">{strategy.title_strategy} {strategy.subtitle_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">3. Category Selection Strategy</span>
              <p className="text-slate-200 leading-relaxed">{strategy.category_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">4. Cover Thumbnail Strategy</span>
              <p className="text-slate-200 leading-relaxed">{strategy.cover_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">5. HTML Description Strategy</span>
              <p className="text-slate-200 leading-relaxed">{strategy.description_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase">6. 14-Day Honeymoon Launch</span>
              <p className="text-slate-200 leading-relaxed">{strategy.launch_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">7. Review Acquisition (KDP Safe)</span>
              <p className="text-slate-200 leading-relaxed">{strategy.review_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">8. Pricing & Royalty Scaling</span>
              <p className="text-slate-200 leading-relaxed">{strategy.pricing_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-rose-400 uppercase">9. Competitor Defense</span>
              <p className="text-slate-200 leading-relaxed">{strategy.competitor_strategy}</p>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-sky-400 uppercase">10. Ongoing Monitoring</span>
              <p className="text-slate-200 leading-relaxed">{strategy.monitoring_strategy}</p>
            </div>
          </div>
        </div>
      ) : !hasSearched ? (
        <div className="py-20 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
          <Target className="w-12 h-12 text-sky-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-white">Ready to Build KDP Ranking Strategy</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Enter your niche and primary keyword above and click &quot;Generate Strategy&quot; to calculate launch velocity and pricing tactics.
          </p>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          Strategy blueprint unavailable.
        </div>
      )}

      {strategy && (
        <EvidencePanel
          evidence={{
            niche,
            primaryKeyword,
            marketplace,
            targetPrice: `$${targetPrice}`
          }}
          methodology="Amazon A9 Organic Ranking Dynamics: Exact match title priority + mobile thumbnail CTR + initial conversion velocity boost."
          source="Ranking Strategy Engine"
          dataStatus="CALCULATED"
        />
      )}
    </div>
  );
}

export default function RankingStrategyPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-slate-400">Loading Ranking Strategy...</div>}>
      <RankingStrategyContent />
    </Suspense>
  );
}
