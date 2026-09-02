'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, Sparkles, Trophy, KeyRound, BookOpen, ShieldCheck, 
  ExternalLink, Copy, Check, ArrowRight, Loader2, Star, 
  DollarSign, BarChart3, Layers, Zap, Info, RotateCcw, Download,
  Globe2, CheckCircle2, TrendingUp, FolderPlus, FolderKanban,
  Compass, Award, Lightbulb, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { ScoutedWinningTopic } from '@/lib/types';

const QUICK_SUGGESTIONS = [
  'kids book',
  'dinosaur coloring book',
  'activity book for toddlers',
  'mindfulness journal for women',
  'sudoku puzzle books for adults',
  'kids handwriting practice workbook'
];

export default function DashboardPage() {
  const [keyword, setKeyword] = useState('');
  const [marketplace, setMarketplace] = useState('GLOBAL');
  const [isLoading, setIsLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'territories' | 'books' | 'keywords' | 'concepts' | 'seo'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isProjectAdded, setIsProjectAdded] = useState(false);

  // AI Golden Opportunity Scout States
  const [isScoutOpen, setIsScoutOpen] = useState(true);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutedTopics, setScoutedTopics] = useState<ScoutedWinningTopic[]>([]);
  const [scoutCategory, setScoutCategory] = useState('ALL');
  const [detailedTopicModal, setDetailedTopicModal] = useState<ScoutedWinningTopic | null>(null);
  const [savedScoutId, setSavedScoutId] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleScoutWinningTopics = async (category: string = 'ALL') => {
    setIsScouting(true);
    setScoutCategory(category);
    try {
      const res = await api.scoutWinningTopics(category, marketplace === 'GLOBAL' ? 'US' : marketplace);
      setScoutedTopics(res.topics || []);
      setIsScoutOpen(true);
    } catch (e) {
      console.error('Failed to scout topics:', e);
    }
    setIsScouting(false);
  };

  const handleSaveScoutToProject = async (topic: ScoutedWinningTopic) => {
    try {
      await api.createProject({
        title: topic.title,
        niche: topic.niche,
        marketplace: marketplace === 'GLOBAL' ? 'US' : marketplace,
        target_audience: topic.target_audience,
        status: 'PENDING',
        seo_data_json: JSON.stringify({
          keyword: topic.niche,
          seo_title: topic.title,
          recommended_price_sweetspot: topic.recommended_price,
          feasibility_verdict: topic.competition_level,
          feasibility_title: `${topic.competition_level === 'VERY_EASY' ? 'Very Easy to Rank' : 'Easy to Rank'} (${topic.competition_score}/100)`,
          avg_reviews: topic.avg_competitor_reviews,
          concepts: [{
            title_concept: topic.title,
            target_audience: topic.target_audience,
            differentiation_hook: topic.why_suggested
          }],
          why_points: topic.why_points,
          how_to_rank_steps: topic.how_to_rank_steps
        }),
        cover_prompt_json: JSON.stringify({
          tip: topic.cover_design_tip,
          interior_spec: topic.interior_spec
        }),
        ranking_strategy_json: JSON.stringify({
          steps: topic.how_to_rank_steps,
          profit: topic.profit_potential_monthly,
          royalty: topic.estimated_royalty_per_sale
        }),
        notes: `AI Scout Recommendation for "${topic.niche}".\nProfit Potential: ${topic.profit_potential_monthly} (${topic.estimated_royalty_per_sale} royalty/copy).\n\nWhy Suggested: ${topic.why_suggested}\n\nHow to Rank:\n${topic.how_to_rank_steps.join('\n')}`
      });
      setSavedScoutId(topic.id);
      setTimeout(() => setSavedScoutId(null), 4000);
    } catch (e) {
      console.error('Failed to save scouted project:', e);
    }
  };

  const handleResearchScoutTopic = (topic: ScoutedWinningTopic) => {
    setKeyword(topic.niche);
    handleRunMasterResearch(topic.niche);
  };

  const handleAddToUpcomingProject = async () => {
    if (!blueprint) return;
    setIsAddingProject(true);
    try {
      await api.createProject({
        title: blueprint.seo_title || `${blueprint.keyword.charAt(0).toUpperCase() + blueprint.keyword.slice(1)} KDP Project`,
        niche: blueprint.keyword,
        marketplace: blueprint.marketplace || 'US',
        target_audience: blueprint.concepts?.[0]?.target_audience || 'KDP Readers',
        status: 'PENDING',
        seo_data_json: JSON.stringify(blueprint),
        cover_prompt_json: JSON.stringify({
          angle: blueprint.concepts?.[0]?.angle || '',
          hook: blueprint.concepts?.[0]?.differentiation_hook || ''
        }),
        ranking_strategy_json: JSON.stringify({
          verdict: blueprint.feasibility_verdict,
          avg_reviews: blueprint.avg_reviews,
          recommended_price: blueprint.recommended_price_sweetspot
        }),
        notes: `Saved from Master Research for "${blueprint.keyword}". Feasibility: ${blueprint.feasibility_title}.`
      });
      setIsProjectAdded(true);
      setTimeout(() => setIsProjectAdded(false), 5000);
    } catch (e) {
      console.error('Failed to add project:', e);
    }
    setIsAddingProject(false);
  };

  const handleRunMasterResearch = async (searchKw?: string) => {
    const targetKw = searchKw || keyword;
    if (!targetKw.trim()) return;

    if (searchKw) setKeyword(searchKw);
    setIsLoading(true);
    setErrorMsg(null);
    setBlueprint(null);

    try {
      const res = await api.runMasterBlueprint(targetKw.trim(), marketplace);
      setBlueprint(res);
      setActiveTab('overview');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not complete research. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* MASTER 1-CLICK HERO RESEARCH BAR */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-sky-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
            <Globe2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>1-Click Worldwide &amp; Multi-Marketplace KDP Intelligence</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            KDP One-Click Master Research
          </h1>
          <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed">
            Sirf ek keyword daalo (jaise <b>&quot;kids book&quot;</b>) — <b>Worldwide</b> mode select karne se system ek sath <b>US, UK, Germany (EU), aur Canada</b> se live data nikal kar pura Global KDP Blueprint bana dega!
          </p>

          {/* Master Search Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleRunMasterResearch(); }}
            className="mt-6 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter any book keyword (e.g. kids book, adult coloring book, journal)..."
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="bg-slate-950/90 border border-sky-500/40 rounded-2xl px-4 py-3 text-xs text-white font-bold focus:border-sky-400 focus:outline-none cursor-pointer"
              >
                <option value="GLOBAL">🌍 Worldwide (US, UK, DE, CA)</option>
                <option value="US">🇺🇸 US ($)</option>
                <option value="UK">🇬🇧 UK (£)</option>
                <option value="DE">🇩🇪 DE (€)</option>
                <option value="CA">🇨🇦 CA ($)</option>
                <option value="AU">🇦🇺 AU ($)</option>
                <option value="IN">🇮🇳 IN (₹)</option>
              </select>

              <button
                type="submit"
                disabled={isLoading || !keyword.trim()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs md:text-sm transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing World...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Run Full Research</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Click Suggestions */}
          <div className="mt-4 flex items-center gap-2 flex-wrap text-[11px]">
            <span className="text-slate-400 font-medium">Try clicking:</span>
            {QUICK_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => handleRunMasterResearch(sug)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ✨ AI GOLDEN OPPORTUNITY SCOUT (AUTOMATIC WINNING TOPIC ADVISOR) */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-indigo-950/20 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-extrabold text-white">
                  ✨ AI Golden Niche Scout: What Book Should I Publish Right Now?
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  Easy Rank + High Profit
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                কী বই বানাবেন বুঝতে পারছেন না? AI সম্পূর্ণ অ্যামাজন ডেটা ও সার্চ ট্রেন্ড এনালাইজ করে এমন টপিক সাজেস্ট করবে—যেখানে <b>কম্পিটিটরদের রিভিউ কম (সহজে ১ম পেজে র‍্যাঙ্ক)</b> এবং <b>মুনাফা সর্বোচ্চ ($1,500 - $4,500+/মাসিক)</b>।
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => handleScoutWinningTopics(scoutCategory)}
            disabled={isScouting}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02] shrink-0 disabled:opacity-50"
          >
            {isScouting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>AI Scouting Amazon Trends...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-slate-950" />
                <span>Scout Winning Topics Now ✨</span>
              </>
            )}
          </button>
        </div>

        {/* Categories Bar & Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Category Filter:</span>
            {[
              { id: 'ALL', label: '🌟 All High-Profit Niches' },
              { id: 'ACTIVITY', label: '🧩 Activity Books' },
              { id: 'COLORING', label: '🎨 Coloring Books' },
              { id: 'JOURNAL', label: '📖 Guided Journals' },
              { id: 'LOGBOOK', label: '📊 Logbooks & Ledgers' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setScoutCategory(cat.id);
                  handleScoutWinningTopics(cat.id);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                  scoutCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {scoutedTopics.length > 0 && (
            <button
              onClick={() => setIsScoutOpen(!isScoutOpen)}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{isScoutOpen ? 'Hide Scouted Books' : `Show ${scoutedTopics.length} Scouted Books`}</span>
              {isScoutOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* SCOUTED TOPICS GRID */}
        {isScouting ? (
          <div className="py-16 text-center space-y-3 bg-slate-950/60 rounded-2xl border border-slate-800">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">
              AI scanning live Amazon completions, low review barriers (&lt;50 reviews), and royalty profit margins...
            </p>
          </div>
        ) : isScoutOpen && scoutedTopics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 animate-in fade-in">
            {scoutedTopics.map((topic) => {
              const isSaved = savedScoutId === topic.id;
              return (
                <div
                  key={topic.id}
                  className="glass-panel rounded-3xl p-5 border border-amber-500/20 bg-slate-950/80 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                >
                  <div className="space-y-3">
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-slate-700">
                        {topic.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Award className="w-3 h-3 text-emerald-400" />
                        <span>{topic.competition_level.replace('_', ' ')}</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                      {topic.title}
                    </h3>

                    {/* Target Audience */}
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      Target: <b className="text-slate-300">{topic.target_audience}</b>
                    </p>

                    {/* Profit & Review metrics */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Earning Potential</span>
                        <span className="font-extrabold text-emerald-400">{topic.profit_potential_monthly}</span>
                        <span className="text-[9px] text-slate-400 block">{topic.recommended_price} ({topic.estimated_royalty_per_sale}/sale)</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Review Barrier</span>
                        <span className="font-extrabold text-amber-400">Avg {topic.avg_competitor_reviews} reviews</span>
                        <span className="text-[9px] text-emerald-400 block font-semibold">Easy to Beat</span>
                      </div>
                    </div>

                    {/* 2 Key Proof Points */}
                    <div className="space-y-1 text-[11px] text-slate-300">
                      {topic.why_points.slice(0, 2).map((pt, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ACTION BUTTONS (3 Clear Actions) */}
                  <div className="space-y-2 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => setDetailedTopicModal(topic)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Why This &amp; How to Rank (বিস্তারিত)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleResearchScoutTopic(topic)}
                        className="py-2 px-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <Search className="w-3 h-3 text-indigo-400" />
                        <span>Run Research</span>
                      </button>

                      <button
                        onClick={() => handleSaveScoutToProject(topic)}
                        disabled={isSaved}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                          isSaved
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-slate-950" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <FolderPlus className="w-3 h-3 text-slate-950" />
                            <span>Add Project</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* LOADING STATE INDICATOR */}
      {isLoading && (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 text-center space-y-4 animate-in fade-in">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
            <Globe2 className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {marketplace === 'GLOBAL' ? 'Scanning Global Amazon Matrix (US, UK, DE, CA)...' : `Querying Live Amazon catalog for "${keyword}"...`}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Extracting Live Competitor Books, Autocomplete Keywords, Worldwide Winability Verdict, and Generating Ready-to-Publish SEO Package...
            </p>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => handleRunMasterResearch()} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* BLUEPRINT MASTER RESULTS VIEW */}
      {blueprint && !isLoading && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* EXECUTIVE VERDICT HEADER CARD */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 bg-gradient-to-r from-slate-900/90 to-indigo-950/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Target Niche:</span>
                  <span className="text-lg font-extrabold text-white">&quot;{blueprint.keyword}&quot;</span>
                  <StatusBadge status="LIVE" source={blueprint.is_global ? "Worldwide Matrix" : `Amazon ${blueprint.marketplace}`} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    blueprint.feasibility_verdict === 'EASY_TO_RANK' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : blueprint.feasibility_verdict === 'MODERATE'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {blueprint.feasibility_title}
                  </span>
                  <span className="text-xs text-slate-400">Marketplace: <b>{blueprint.marketplace}</b></span>
                </div>
              </div>

              {/* Quick Key Metrics & Add to Upcoming Project */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Review Barrier</span>
                  <span className="text-base font-extrabold text-amber-400">{blueprint.avg_reviews ? blueprint.avg_reviews.toLocaleString() : '0'} avg</span>
                </div>
                <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {blueprint.is_global ? 'US Benchmark Price' : 'Price Sweetspot'}
                  </span>
                  <span className="text-base font-extrabold text-emerald-400">
                    {blueprint.is_global ? `$${blueprint.avg_price?.toFixed(2)}` : blueprint.recommended_price_sweetspot}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleAddToUpcomingProject}
                    disabled={isAddingProject || isProjectAdded}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                      isProjectAdded
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20 hover:scale-[1.02]'
                    } disabled:opacity-80`}
                  >
                    {isProjectAdded ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Saved to Upcoming Projects!</span>
                      </>
                    ) : isAddingProject ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Saving Blueprint...</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4 text-slate-950" />
                        <span>📌 Add to Upcoming Projects</span>
                      </>
                    )}
                  </button>

                  {isProjectAdded && (
                    <Link
                      href="/projects"
                      className="text-[11px] text-sky-400 hover:underline flex items-center justify-center gap-1 font-semibold"
                    >
                      <span>Open Upcoming Projects</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Verdict Explanation Box */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <b className="text-white">Can I Rank? (Competitor &amp; Rank Verdict): </b>
                <span>{blueprint.feasibility_explanation}</span>
              </div>
            </div>

            {/* NAVIGATION TABS */}
            <div className="flex items-center gap-2 border-b border-slate-800 pt-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'overview' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Overview Summary</span>
              </button>
              
              {blueprint.is_global && (
                <button
                  onClick={() => setActiveTab('territories')}
                  className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'territories' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe2 className="w-4 h-4 text-amber-400" />
                  <span>🌍 Worldwide Matrix (4 Markets)</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('books')}
                className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'books' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Competitor Books ({blueprint.books?.length || 0})</span>
              </button>
              
              <button
                onClick={() => setActiveTab('keywords')}
                className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'keywords' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Suggested Keywords ({blueprint.suggested_keywords?.length || 0})</span>
              </button>
              
              <button
                onClick={() => setActiveTab('concepts')}
                className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'concepts' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>AI Book Concepts ({blueprint.concepts?.length || 0})</span>
              </button>
              
              <button
                onClick={() => setActiveTab('seo')}
                className={`pb-3 px-3 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'seo' ? 'text-sky-400 border-b-2 border-sky-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span>Ready-to-Publish SEO</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW ALL-IN-ONE */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* WORLDWIDE TERRITORY OVERVIEW CARDS (When GLOBAL is active) */}
              {blueprint.is_global && blueprint.global_territories && (
                <div className="glass-panel rounded-3xl p-5 border border-sky-500/30 space-y-3 bg-gradient-to-br from-slate-900/90 to-sky-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-sky-400" />
                      <h3 className="text-sm font-bold text-white">Worldwide Market Comparison (Live Multi-Territory Matrix)</h3>
                    </div>
                    <span className="text-[11px] text-slate-400">Sampled US, UK, DE, and CA simultaneously</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {blueprint.global_territories.map((t: any) => (
                      <div key={t.territory} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{t.flag}</span>
                            <span className="text-xs font-bold text-white">{t.country_name}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.barrier === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {t.barrier} Barrier
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Recommended Price:</span>
                            <b className="text-emerald-400">{t.recommended_price}</b>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Median Reviews:</span>
                            <b className="text-white">{t.median_reviews} revs</b>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 italic pt-1">{t.opportunity_verdict}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Visual Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Competitor Books Preview */}
                <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      <h3 className="text-sm font-bold text-white">
                        {blueprint.is_global ? 'Top Global Books across Marketplaces' : 'Live Competitor Books on Amazon'}
                      </h3>
                    </div>
                    <button onClick={() => setActiveTab('books')} className="text-xs text-sky-400 hover:underline">
                      View all {blueprint.books?.length} books →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {blueprint.books?.slice(0, 4).map((b: any, idx: number) => (
                      <div key={b.asin || idx} className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 flex items-center gap-3">
                        <div className="w-12 h-16 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                          {b.cover_image_url ? (
                            <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500">No Cover</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {b.territory_flag && <span className="text-xs">{b.territory_flag}</span>}
                            <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="font-bold text-xs text-white hover:text-sky-400 line-clamp-1">
                              {b.title}
                            </a>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">By {b.author || 'Unknown'}</p>
                          <div className="flex items-center gap-3 mt-1 text-[11px]">
                            <span className="font-extrabold text-emerald-400">
                              {b.currency === 'GBP' ? '£' : b.currency === 'EUR' ? '€' : '$'}{b.price ? b.price.toFixed(2) : 'N/A'} {b.currency}
                            </span>
                            <span className="text-amber-400">★ {b.current_rating || '4.5'}</span>
                            <span className="text-slate-400">({b.current_review_count?.toLocaleString() || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Keywords Preview */}
                <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-white">Live Autocomplete Keywords</h3>
                    </div>
                    <button onClick={() => setActiveTab('keywords')} className="text-xs text-amber-400 hover:underline">
                      View all keywords →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {blueprint.suggested_keywords?.slice(0, 5).map((kw: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                          <span className="text-xs font-bold text-white">{kw.keyword}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Score {kw.opportunity_score}
                          </span>
                          <button
                            onClick={() => handleCopy(kw.keyword, `kw_${idx}`)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            {copiedKey === `kw_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ready-to-Publish SEO Snippet */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Recommended Global SEO Title &amp; Subtitle</h3>
                      <p className="text-[11px] text-slate-400">Crafted for Amazon A9 algorithm conversion across all English marketplaces</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('seo')} className="text-xs text-sky-400 hover:underline font-medium">
                    View Full 7-Box Slots &amp; Description →
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                      <span>Book Title</span>
                      <button
                        onClick={() => handleCopy(blueprint.seo_title, 'seo_t')}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copiedKey === 'seo_t' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Title</span>
                      </button>
                    </div>
                    <p className="text-sm font-bold text-white">{blueprint.seo_title}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold mb-1">
                      <span>Book Subtitle</span>
                      <button
                        onClick={() => handleCopy(blueprint.seo_subtitle, 'seo_st')}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        {copiedKey === 'seo_st' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Subtitle</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-300">{blueprint.seo_subtitle}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORLDWIDE TERRITORIES (When GLOBAL) */}
          {activeTab === 'territories' && blueprint.is_global && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Worldwide Market Matrix &amp; Pricing Breakdown</h3>
                  <p className="text-xs text-slate-400">Live competitor benchmarks across Amazon&apos;s 4 largest publishing markets</p>
                </div>
              </div>

              {/* Grid of 4 Territories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blueprint.global_territories?.map((t: any) => (
                  <div key={t.territory} className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{t.flag}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{t.country_name}</h4>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Amazon {t.territory} ({t.currency})</span>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        t.barrier === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.barrier} Review Barrier
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Recommended Price</span>
                        <p className="text-base font-extrabold text-emerald-400">{t.recommended_price}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Median Reviews</span>
                        <p className="text-base font-extrabold text-white">{t.median_reviews} reviews</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                      <b>Market Opportunity: </b>
                      <span>{t.opportunity_verdict}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* KDP Global Pricing Cheat Sheet Card */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">KDP Dashboard Multi-Currency Pricing Cheat Sheet</h4>
                      <p className="text-xs text-slate-400">Copy these prices directly into your KDP Royalty Dashboard for maximum profit</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {blueprint.global_territories?.map((t: any) => (
                    <div key={t.territory} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center space-y-1">
                      <span className="text-xs font-bold text-slate-300 flex items-center justify-center gap-1">
                        <span>{t.flag}</span>
                        <span>{t.currency}</span>
                      </span>
                      <p className="text-lg font-extrabold text-emerald-400">{t.recommended_price}</p>
                      <button
                        onClick={() => handleCopy(t.recommended_price.replace(/[^\d.]/g, ''), `price_${t.territory}`)}
                        className="text-[10px] text-sky-400 hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        {copiedKey === `price_${t.territory}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LIVE COMPETITOR BOOKS */}
          {activeTab === 'books' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">
                  {blueprint.is_global ? `Worldwide Competitor Books (${blueprint.books?.length || 0} books across US, UK, DE, CA)` : `Live Competitor Books on Amazon (${blueprint.books?.length || 0})`}
                </h3>
                <span className="text-xs text-slate-400">All prices and ratings verified from live Amazon catalogs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {blueprint.books?.map((b: any, idx: number) => (
                  <div key={b.asin || idx} className="glass-panel rounded-2xl p-4 border border-slate-800 flex gap-4 hover:border-slate-700 transition-all">
                    <div className="w-20 h-28 bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-slate-800 relative">
                      {b.territory_flag && (
                        <span className="absolute top-1 left-1 text-xs bg-slate-950/80 px-1 rounded shadow">
                          {b.territory_flag}
                        </span>
                      )}
                      {b.cover_image_url ? (
                        <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No Cover</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="font-bold text-xs text-white hover:text-sky-400 line-clamp-2">
                          {b.title}
                        </a>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">By {b.author || 'Unknown'}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="font-extrabold text-emerald-400">
                            {b.currency === 'GBP' ? '£' : b.currency === 'EUR' ? '€' : '$'}{b.price ? b.price.toFixed(2) : 'N/A'} {b.currency}
                          </span>
                          {b.current_rating && <span className="text-amber-400">★ {b.current_rating.toFixed(1)}</span>}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
                        <span>{b.current_review_count ? b.current_review_count.toLocaleString() : '0'} reviews</span>
                        <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SUGGESTED KEYWORDS */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Amazon Live Autocomplete Suggestions</h3>
                <span className="text-xs text-slate-400">Real customer search terms from Amazon A9 completion engine</span>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Suggested Keyword</th>
                      <th className="p-3">Opportunity Score</th>
                      <th className="p-3">Competition</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {blueprint.suggested_keywords?.map((kw: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">#{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{kw.keyword}</td>
                        <td className="p-3">
                          <span className="font-extrabold text-emerald-400">{kw.opportunity_score}/100</span>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {kw.competition}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleCopy(kw.keyword, `tbl_kw_${idx}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            {copiedKey === `tbl_kw_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>Copy</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AI BOOK CONCEPTS */}
          {activeTab === 'concepts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Differentiated Book Concepts &amp; Angles</h3>
                <span className="text-xs text-slate-400">Created to outperform competitors by solving customer complaints</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blueprint.concepts?.map((c: any, idx: number) => (
                  <div key={idx} className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Concept #{idx + 1}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          Score {c.opportunity_score || 88}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{c.title_concept}</h4>
                        <p className="text-xs text-slate-300 mt-1">{c.subtitle_concept}</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-[11px] space-y-1.5">
                        <span className="text-slate-400 font-bold block uppercase text-[9px]">Differentiation Hook:</span>
                        <p className="text-slate-300">{c.differentiation_hook}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopy(`${c.title_concept}: ${c.subtitle_concept}`, `c_copy_${idx}`)}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copiedKey === `c_copy_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Full Title Angle</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: READY-TO-PUBLISH SEO PACKAGE */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              
              {/* Title & Subtitle Card */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Recommended Listing Title &amp; Subtitle</h3>
                  <span className="text-xs text-emerald-400 font-bold">A9 SEO Score: {blueprint.seo_score || 94}/100</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Optimized Title</span>
                      <p className="text-sm font-bold text-white">{blueprint.seo_title}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(blueprint.seo_title, 'p_title')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === 'p_title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Benefit-Driven Subtitle</span>
                      <p className="text-xs text-slate-200">{blueprint.seo_subtitle}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(blueprint.seo_subtitle, 'p_sub')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === 'p_sub' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 7 KDP Backend Slots Card */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">7 KDP Backend Keyword Slots (249 Bytes Each)</h3>
                    <p className="text-[11px] text-slate-400">Zero duplicate terms, maximized for Amazon search coverage</p>
                  </div>
                  <button
                    onClick={() => handleCopy(blueprint.backend_boxes?.join('\n') || '', 'all_boxes')}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    {copiedKey === 'all_boxes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy All 7 Slots</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {blueprint.backend_boxes?.map((slot: string, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-bold text-sky-400 uppercase shrink-0">Slot #{idx + 1}</span>
                        <p className="text-xs text-white font-mono truncate">{slot}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400">{slot.length}/249</span>
                        <button
                          onClick={() => handleCopy(slot, `slot_${idx}`)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                        >
                          {copiedKey === `slot_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KDP HTML Description Card */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">KDP Allowed HTML Description</h3>
                  <button
                    onClick={() => handleCopy(blueprint.book_description, 'p_desc')}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                  >
                    {copiedKey === 'p_desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy HTML Description</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-60">
                  {blueprint.book_description}
                </pre>
              </div>

            </div>
          )}

        </div>
      )}

      {/* QUICK ACCESS TO SPECIALIZED DEEP-DIVE TOOLS */}
      <div className="pt-4 border-t border-slate-800/80 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Specialized Research Modules (Optional Deep Dives)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/books" className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Book Finder</p>
              <p className="text-[10px] text-slate-400">Live Amazon Search</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/bestsellers" className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Best Sellers</p>
              <p className="text-[10px] text-slate-400">Live Charts</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/seo" className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">SEO Studio</p>
              <p className="text-[10px] text-slate-400">7-Box Builder</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
          <Link href="/what-to-publish" className="glass-card rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">What To Publish?</p>
              <p className="text-[10px] text-slate-400">Niche Discovery</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* DETAILED TOPIC STRATEGY MODAL ("কেন সাজেস্ট করা হলো এবং কীভাবে র‍্যাঙ্ক করবো") */}
      {detailedTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white line-clamp-1">{detailedTopicModal.title}</h2>
                  <span className="text-[11px] text-amber-400 font-medium">Niche: {detailedTopicModal.niche} • {detailedTopicModal.category}</span>
                </div>
              </div>
              <button
                onClick={() => setDetailedTopicModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Monthly Profit Est.</span>
                  <span className="text-sm font-black text-emerald-400">{detailedTopicModal.profit_potential_monthly}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Recommended Price</span>
                  <span className="text-sm font-black text-white">{detailedTopicModal.recommended_price}</span>
                  <span className="text-[10px] text-slate-400 block">{detailedTopicModal.estimated_royalty_per_sale} royalty/copy</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Competitor Barrier</span>
                  <span className="text-sm font-black text-amber-400">Avg {detailedTopicModal.avg_competitor_reviews} reviews</span>
                  <span className="text-[10px] text-emerald-400 block font-semibold">{detailedTopicModal.competition_level}</span>
                </div>
              </div>

              {/* WHY THIS WAS SUGGESTED */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/40">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Why This Book Was Suggested (কেন এই বইটি সাজেস্ট করা হলো?):</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {detailedTopicModal.why_suggested}
                </p>
                <div className="space-y-1.5 pt-1">
                  {detailedTopicModal.why_points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HOW TO RANK #1 STEP BY STEP ROADMAP */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 bg-slate-950/40">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>How to Rank #1 on Amazon (কীভাবে ১ম পেজে র‍্যাঙ্ক করবেন?):</span>
                </div>
                <div className="space-y-2">
                  {detailedTopicModal.how_to_rank_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-200 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOOK SPECS & COVER PSYCHOLOGY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">🎨 Cover Design Psychology</span>
                  <p className="text-[11px] text-slate-200 leading-relaxed">{detailedTopicModal.cover_design_tip}</p>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">📐 Recommended Interior Specs</span>
                  <p className="text-[11px] text-slate-200 leading-relaxed">{detailedTopicModal.interior_spec}</p>
                </div>
              </div>

              {/* HIGH-VALUE TARGET KEYWORDS */}
              {detailedTopicModal.target_keywords && detailedTopicModal.target_keywords.length > 0 && (
                <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-white block">🔑 High-Search Target Keywords (কপি করে ব্যবহার করুন):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedTopicModal.target_keywords.map((kw, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopy(kw, `kw_${idx}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-200 flex items-center gap-1.5 transition-colors"
                      >
                        <span>{kw}</span>
                        {copiedKey === `kw_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setDetailedTopicModal(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = detailedTopicModal;
                    setDetailedTopicModal(null);
                    handleResearchScoutTopic(t);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Run Live Master Research</span>
                </button>

                <button
                  onClick={() => {
                    handleSaveScoutToProject(detailedTopicModal);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
                >
                  {savedScoutId === detailedTopicModal.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                      <span>Saved to Upcoming Projects!</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3.5 h-3.5 text-slate-950" />
                      <span>Save to Upcoming Projects</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
