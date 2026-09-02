'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lightbulb, Sparkles, Search, Loader2, ArrowRight, Check, FolderPlus, ShieldCheck } from 'lucide-react';
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

      {/* Concept Cards */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing live Amazon search keywords and competitor gaps into concepts...</p>
        </div>
      ) : ideas.length > 0 ? (
        <div className="space-y-6">
          {ideas.map((idea, idx) => (
            <div key={idx} className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Concept #{idx + 1}</span>
                  <h2 className="text-xl font-bold text-white mt-1">{idea.title_concept}</h2>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">{idea.subtitle_concept}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                    Opportunity: {idea.opportunity_score}/100
                  </div>
                  <button
                    onClick={() => handleSaveToProject(idea, idx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-all"
                  >
                    {savedIndex === idx ? <Check className="w-3.5 h-3.5" /> : <FolderPlus className="w-3.5 h-3.5" />}
                    <span>{savedIndex === idx ? 'Saved to Project' : 'Create Project'}</span>
                  </button>
                </div>
              </div>

              {/* Grid breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Content Concept</span>
                  <p className="text-slate-200 leading-relaxed">{idea.content_concept}</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Differentiation Hook</span>
                  <p className="text-slate-200 leading-relaxed">{idea.differentiation_hook}</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-sky-400">Cover & Interior Specs</span>
                  <p className="text-slate-200 leading-relaxed"><b>Cover:</b> {idea.cover_concept}</p>
                  <p className="text-slate-300 text-[11px]"><b>Interior:</b> {idea.interior_concept}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Target Keywords:</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[11px]">
                  {idea.primary_keyword}
                </span>
                {idea.secondary_keywords?.map((sk, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          No concepts generated yet.
        </div>
      )}

      <EvidencePanel
        evidence={{
          niche,
          targetAudience,
          bookType,
          marketplace,
          concepts_count: ideas.length
        }}
        methodology="Local AI / Hybrid heuristic synthesis anchored to live Amazon keyword autocomplete and competitor title gap analysis."
        source="Amazon Live Data + Local AI Engine"
        dataStatus="AI_ANALYSIS"
      />
    </div>
  );
}

export default function BookIdeaGeneratorPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-slate-400">Loading Idea Generator...</div>}>
      <BookIdeaContent />
    </Suspense>
  );
}
