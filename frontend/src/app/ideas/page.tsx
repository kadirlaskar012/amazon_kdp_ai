'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Lightbulb, Sparkles, Search, Loader2, ArrowRight, Check, 
  FolderPlus, ShieldCheck, ArrowUpDown, Filter, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { BookConcept } from '@/lib/types';

function BookIdeaContent() {
  const searchParams = useSearchParams();
  const initialNiche = searchParams.get('niche') || 'dinosaur coloring book';

  const [niche, setNiche] = useState(initialNiche);
  const [targetAudience, setTargetAudience] = useState('Kids Ages 4-8');
  const [bookType, setBookType] = useState('Coloring Book');
  const [marketplace, setMarketplace] = useState('US');
  const [ideas, setIdeas] = useState<BookConcept[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  // Sorting & Filtering States
  const [filterQuery, setFilterQuery] = useState('');
  const [competitionFilter, setCompetitionFilter] = useState('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'title_asc' | 'title_desc'>('score_desc');

  useEffect(() => {
    generateConcepts();
  }, []);

  const generateConcepts = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!niche.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.generateBookIdeas({
        niche,
        target_audience: targetAudience,
        book_type: bookType,
        marketplace,
      });
      setIdeas(res.ideas || []);
    } catch (e) {
      setIdeas([]);
    }
    setIsLoading(false);
  };

  const handleSaveToProject = async (idea: BookConcept, idx: number) => {
    try {
      await api.createProject({
        title: idea.title_concept,
        niche: idea.primary_keyword,
        target_audience: idea.target_audience,
        marketplace
      });
      setSavedIndex(idx);
      setTimeout(() => setSavedIndex(null), 2500);
    } catch (e) {}
  };

  // Filtered and Sorted Concepts
  const filteredAndSortedIdeas = useMemo(() => {
    let list = [...ideas];

    // Search query filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(idea => 
        idea.title_concept.toLowerCase().includes(q) ||
        idea.subtitle_concept.toLowerCase().includes(q) ||
        (idea.differentiation_hook && idea.differentiation_hook.toLowerCase().includes(q)) ||
        (idea.primary_keyword && idea.primary_keyword.toLowerCase().includes(q)) ||
        (idea.target_audience && idea.target_audience.toLowerCase().includes(q))
      );
    }

    // Competition filter
    if (competitionFilter !== 'ALL') {
      list = list.filter(idea => idea.competition_level.toUpperCase() === competitionFilter);
    }

    // Min score filter
    if (minScoreFilter > 0) {
      list = list.filter(idea => idea.opportunity_score >= minScoreFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'score_desc') return b.opportunity_score - a.opportunity_score;
      if (sortBy === 'score_asc') return a.opportunity_score - b.opportunity_score;
      if (sortBy === 'title_asc') return a.title_concept.localeCompare(b.title_concept);
      if (sortBy === 'title_desc') return b.title_concept.localeCompare(a.title_concept);
      return 0;
    });

    return list;
  }, [ideas, filterQuery, competitionFilter, minScoreFilter, sortBy]);

  const hasActiveFilters = filterQuery || competitionFilter !== 'ALL' || minScoreFilter > 0 || sortBy !== 'score_desc';

  const resetFilters = () => {
    setFilterQuery('');
    setCompetitionFilter('ALL');
    setMinScoreFilter(0);
    setSortBy('score_desc');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Book Idea Generator</h1>
            <StatusBadge status="AI_ANALYSIS" source="Grounded Market Signals" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data-grounded book concepts crafted around live search demand and competitor gaps.
          </p>
        </div>
      </div>

      {/* Input Parameters */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <form onSubmit={generateConcepts} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Target Niche</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. dinosaur coloring book"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Target Audience / Age</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Kids 4-8, Teens, Seniors"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Book Type</label>
            <select
              value={bookType}
              onChange={(e) => setBookType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="Coloring Book">Coloring Book</option>
              <option value="Activity Book">Activity Book</option>
              <option value="Puzzle / Word Search">Puzzle / Word Search</option>
              <option value="Guided Journal">Guided Journal</option>
              <option value="Habit Tracker / Planner">Habit Tracker / Planner</option>
              <option value="Log Book / Ledger">Log Book / Ledger</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generate Concepts</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sort & Filter Toolbar */}
      {ideas.length > 0 && !isLoading && (
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Filter & Sort AI Concepts:</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                Showing {filteredAndSortedIdeas.length} of {ideas.length}
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
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter keywords, hooks..."
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
                <option value="score_desc">Opportunity Score (Highest)</option>
                <option value="score_asc">Opportunity Score (Lowest)</option>
                <option value="title_asc">Title (A to Z)</option>
                <option value="title_desc">Title (Z to A)</option>
              </select>
            </div>

            {/* Competition Level Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Competition Levels</option>
                <option value="EASY">Easy Competition Only</option>
                <option value="MODERATE">Moderate Competition</option>
                <option value="DIFFICULT">Difficult Competition</option>
              </select>
            </div>

            {/* Min Score Filter */}
            <div className="flex items-center gap-2">
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value={0}>All Opportunity Scores</option>
                <option value={75}>Min Score 75+ (Viable)</option>
                <option value={80}>Min Score 80+ (High Potential)</option>
                <option value={85}>Min Score 85+ (Prime Opportunity)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Concept Cards */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing live Amazon search keywords and competitor gaps into concepts...</p>
        </div>
      ) : filteredAndSortedIdeas.length > 0 ? (
        <div className="space-y-6">
          {filteredAndSortedIdeas.map((idea, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Concept #{idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      idea.competition_level === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      idea.competition_level === 'MODERATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {idea.competition_level} COMPETITION
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mt-1.5">{idea.title_concept}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 italic">{idea.subtitle_concept}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Opportunity</span>
                    <span className="text-2xl font-black text-amber-400">{idea.opportunity_score}</span>
                    <span className="text-[10px] text-slate-400">/100</span>
                  </div>

                  <button
                    onClick={() => handleSaveToProject(idea, idx)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all border border-slate-700"
                  >
                    {savedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Saved!</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                        <span>Save to Project</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hook & Differentiation */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Differentiation Hook (Solves Competitor Pain Point):</span>
                <p className="text-xs text-slate-200 leading-relaxed">{idea.differentiation_hook}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Audience & Keywords</span>
                  <p className="text-white font-semibold">{idea.target_audience}</p>
                  <p className="text-slate-400 text-[11px] pt-1">Primary: <span className="text-sky-300 font-mono">{idea.primary_keyword}</span></p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {idea.secondary_keywords?.map((kw, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Cover & Visual Style</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{idea.cover_concept}</p>
                  <Link
                    href={`/cover?prompt=${encodeURIComponent(idea.title_concept + ' ' + (idea.cover_concept || ''))}`}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 pt-1"
                  >
                    <span>Generate Midjourney Prompt</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Interior Specifications</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{idea.interior_concept}</p>
                  <p className="text-[11px] text-emerald-400 font-medium pt-1">Launch Window: {idea.recommended_publishing_window}</p>
                </div>
              </div>

              {/* Evidence Panel */}
              <EvidencePanel
                evidence={{
                  niche,
                  primary_keyword: idea.primary_keyword,
                  opportunity_score: idea.opportunity_score,
                  competition_level: idea.competition_level,
                  evidence_signals: idea.evidence_basis?.join('; ') || 'Live search volume and competitor gap analysis'
                }}
                methodology="Grounded Amazon keyword frequency and competitor review barrier assessment"
                source="Amazon Live & Groq Cloud AI"
                dataStatus="AI_ANALYSIS"
              />
            </div>
          ))}
        </div>
      ) : ideas.length > 0 ? (
        <div className="py-16 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
          <p className="text-sm font-bold text-white">No concepts match your filter criteria.</p>
          <p className="text-xs text-slate-400">Try loosening your search term, competition filter, or minimum score.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="py-20 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
          <Lightbulb className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Enter a publishing niche above to generate AI concepts.</p>
        </div>
      )}
    </div>
  );
}

export default function BookIdeasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Book Idea Generator...</div>}>
      <BookIdeaContent />
    </Suspense>
  );
}
