'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Search, Sparkles, Copy, Check, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { CoverAnalysisResponse } from '@/lib/types';

export default function CoverIntelligencePage() {
  const [keyword, setKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [marketplace, setMarketplace] = useState('US');
  const [analysis, setAnalysis] = useState<CoverAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const runCoverAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setHasSearched(true);
    setIsLoading(true);
    try {
      const res = await api.getCoverIntelligence({ keyword, marketplace });
      setAnalysis(res);
    } catch (e) {
      setAnalysis(null);
    }
    setIsLoading(false);
  };

  const copyPrompt = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.recommended_cover_prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 text-fuchsia-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Cover Intelligence & Maker</h1>
            <StatusBadge status="OBSERVED" source="Amazon Search Cards & Computer Vision Specs" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyze competitor cover aesthetics, thumbnail readability, and generate high-converting cover prompts.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={runCoverAnalysis} className="flex gap-3">
          <div className="relative flex-1">
            <Palette className="w-4 h-4 text-fuchsia-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter niche to analyze competitor covers..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-fuchsia-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold text-xs transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Analyze Covers</span>
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Extracting competitor covers and analyzing color tendencies...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Competitor Cover Evidence Gallery */}
          {analysis.evidence_covers && analysis.evidence_covers.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-fuchsia-400" />
                  <span>Top Ranking Competitor Covers (Live Thumbnails)</span>
                </h3>
                <span className="text-[10px] text-slate-400">{analysis.evidence_covers.length} sample covers</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {analysis.evidence_covers.map((cov, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                    <img src={cov.cover_url} alt={cov.title} className="w-full h-36 object-cover" />
                    <div className="p-1.5 text-[9px] text-slate-400 truncate bg-slate-950/80">
                      {cov.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color & Typography Conventions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Dominant Color Tendencies</span>
              <ul className="space-y-1 text-slate-200">
                {analysis.dominant_color_tendencies?.map((c, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Typography & Placement</span>
              <ul className="space-y-1 text-slate-200">
                {analysis.typography_styles?.map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Trim & Specs</span>
              <p className="font-bold text-white text-sm mt-1">{analysis.recommended_trim_size}</p>
              <p className="text-[11px] text-slate-400">Standard Paperback with 0.125 inch bleed</p>
            </div>
          </div>

          {/* Visual Differentiation Strategy */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>How To Visually Outshine Competitors in Search Thumbnails</span>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              {analysis.visual_differentiation_opportunities?.map((opp, idx) => (
                <li key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{opp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prompt Maker Box */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Commercial AI Cover Generation Prompt</h3>
                <p className="text-xs text-slate-400">Copy this prompt into Midjourney, Stable Diffusion, DALL-E 3, or Flux.</p>
              </div>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white text-xs font-bold transition-all shadow-lg shadow-fuchsia-500/20"
              >
                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Copied Prompt' : 'Copy Prompt'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed">
              {analysis.recommended_cover_prompt}
            </div>
          </div>
        </div>
      ) : !hasSearched ? (
        <div className="py-20 text-center space-y-3">
          <Palette className="w-12 h-12 text-fuchsia-400/50 mx-auto" />
          <h3 className="text-sm font-bold text-white">Ready to Analyze Cover Patterns</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Enter a book keyword above and click &quot;Analyze Cover Patterns&quot; to inspect visual density, colors, and typography patterns.
          </p>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          Cover intelligence data unavailable.
        </div>
      )}

      <EvidencePanel
        evidence={{
          keyword,
          marketplace,
          analyzed_covers: analysis?.evidence_covers?.length || 0,
          trim_size: analysis?.recommended_trim_size || '8.5 x 11'
        }}
        methodology="Visual pattern recognition across top 10 search results on Amazon."
        source="Amazon Live Search & Cover Engine"
        dataStatus="OBSERVED"
      />
    </div>
  );
}
