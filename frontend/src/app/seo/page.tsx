'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, Sparkles, Copy, Check, ShieldCheck, AlertCircle, ArrowRight,
  SlidersHorizontal, Search, ArrowUpDown, Filter, RotateCcw
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { SEOTitleOption, SEODescriptionResponse, BackendKeywordsResponse } from '@/lib/types';

export default function SEOStudioPage() {
  const [activeTab, setActiveTab] = useState<'titles' | 'description' | 'backend'>('titles');

  // Titles State
  const [niche, setNiche] = useState('Mindfulness Coloring Book');
  const [primaryKeyword, setPrimaryKeyword] = useState('mindfulness coloring book for adults');
  const [secondaryKeywords, setSecondaryKeywords] = useState('stress relief, calming patterns');
  const [targetAudience, setTargetAudience] = useState('Adults & Teens');
  const [titleOptions, setTitleOptions] = useState<SEOTitleOption[]>([]);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

  // Titles Sort & Filter
  const [titleSearchFilter, setTitleSearchFilter] = useState('');
  const [stuffingFilter, setStuffingFilter] = useState('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'readability_desc' | 'length_asc'>('score_desc');

  // Description State
  const [descTitle, setDescTitle] = useState('Mindfulness Coloring Book for Adults');
  const [descSubtitle, setDescSubtitle] = useState('50+ Calming Patterns for Relaxation & Stress Relief');
  const [descriptionResult, setDescriptionResult] = useState<SEODescriptionResponse | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  // Backend Keywords State
  const [backendNiche, setBackendNiche] = useState('Coloring Book');
  const [backendPk, setBackendPk] = useState('mindfulness coloring book');
  const [backendSec, setBackendSec] = useState('stress relief, relaxing art, anxiety relief');
  const [titleWords, setTitleWords] = useState('mindfulness coloring book for adults 50 calming patterns');
  const [backendResult, setBackendResult] = useState<BackendKeywordsResponse | null>(null);
  const [isGeneratingBackend, setIsGeneratingBackend] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateTitles = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingTitles(true);
    try {
      const secArray = secondaryKeywords.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.generateTitles({
        niche,
        primary_keyword: primaryKeyword,
        secondary_keywords: secArray,
        target_audience: targetAudience,
      });
      setTitleOptions(res || []);
    } catch (e) {}
    setIsGeneratingTitles(false);
  };

  const filteredAndSortedTitles = useMemo(() => {
    let list = [...titleOptions];

    if (titleSearchFilter.trim()) {
      const q = titleSearchFilter.toLowerCase();
      list = list.filter(opt => 
        opt.title.toLowerCase().includes(q) ||
        opt.subtitle.toLowerCase().includes(q) ||
        (opt.rationale && opt.rationale.toLowerCase().includes(q))
      );
    }

    if (stuffingFilter !== 'ALL') {
      list = list.filter(opt => opt.stuffing_risk.toUpperCase() === stuffingFilter);
    }

    if (minScoreFilter > 0) {
      list = list.filter(opt => opt.seo_score >= minScoreFilter);
    }

    list.sort((a, b) => {
      if (sortBy === 'score_desc') return b.seo_score - a.seo_score;
      if (sortBy === 'score_asc') return a.seo_score - b.seo_score;
      if (sortBy === 'readability_desc') return b.readability_score - a.readability_score;
      if (sortBy === 'length_asc') return a.character_count_title - b.character_count_title;
      return 0;
    });

    return list;
  }, [titleOptions, titleSearchFilter, stuffingFilter, minScoreFilter, sortBy]);

  const hasTitleFilters = titleSearchFilter || stuffingFilter !== 'ALL' || minScoreFilter > 0 || sortBy !== 'score_desc';

  const resetTitleFilters = () => {
    setTitleSearchFilter('');
    setStuffingFilter('ALL');
    setMinScoreFilter(0);
    setSortBy('score_desc');
  };

  const generateDescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingDesc(true);
    try {
      const res = await api.generateDescription({
        title: descTitle,
        subtitle: descSubtitle,
        niche,
        primary_keyword: primaryKeyword,
        secondary_keywords: secondaryKeywords.split(',').map((s) => s.trim()).filter(Boolean),
        target_audience: targetAudience,
      });
      setDescriptionResult(res);
    } catch (e) {}
    setIsGeneratingDesc(false);
  };

  const generateBackendKeywords = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingBackend(true);
    try {
      const res = await api.generateBackendKeywords({
        niche: backendNiche,
        primary_keyword: backendPk,
        secondary_keywords: backendSec.split(',').map((s) => s.trim()).filter(Boolean),
        title_words: titleWords.split(' ').filter(Boolean),
      });
      setBackendResult(res);
    } catch (e) {}
    setIsGeneratingBackend(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">KDP SEO Studio</h1>
            <StatusBadge status="CALCULATED" source="SEO & Compliance Engine" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Algorithmic Title Studio, structured HTML Description Builder, and deduplicated 7-box Backend Keyword optimizer.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'titles', label: 'SEO Title Studio' },
          { id: 'description', label: 'HTML Description Builder' },
          { id: 'backend', label: '7-Box Backend Keywords' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === t.id
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TITLES */}
      {activeTab === 'titles' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <form onSubmit={generateTitles} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target Niche</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Primary Keyword</label>
                <input
                  type="text"
                  value={primaryKeyword}
                  onChange={(e) => setPrimaryKeyword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Secondary Keywords</label>
                <input
                  type="text"
                  value={secondaryKeywords}
                  onChange={(e) => setSecondaryKeywords(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isGeneratingTitles}
                  className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {isGeneratingTitles ? 'Evaluating...' : 'Generate SEO Titles'}
                </button>
              </div>
            </form>
          </div>

          {/* Sort & Filter Controls for Titles */}
          {titleOptions.length > 0 && !isGeneratingTitles && (
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Filter & Sort Titles:</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                    Showing {filteredAndSortedTitles.length} of {titleOptions.length}
                  </span>
                </div>

                {hasTitleFilters && (
                  <button
                    onClick={resetTitleFilters}
                    className="flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 transition-colors self-start md:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={titleSearchFilter}
                    onChange={(e) => setTitleSearchFilter(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="score_desc">Highest SEO Score</option>
                    <option value="score_asc">Lowest SEO Score</option>
                    <option value="readability_desc">Highest Readability</option>
                    <option value="length_asc">Shortest Title Length</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={stuffingFilter}
                    onChange={(e) => setStuffingFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Stuffing Risks</option>
                    <option value="LOW">Low Risk Only (Safe)</option>
                    <option value="MODERATE">Moderate Risk</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={minScoreFilter}
                    onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>All SEO Scores</option>
                    <option value={85}>Min Score 85+</option>
                    <option value={90}>Min Score 90+ (Excellent)</option>
                    <option value={95}>Min Score 95+ (Master)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {filteredAndSortedTitles.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedTitles.map((opt, idx) => (
                <div key={idx} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-sky-400">Option #{idx + 1}</span>
                      <h3 className="text-base font-bold text-white mt-1">{opt.title}</h3>
                      <p className="text-xs text-slate-300 mt-0.5">{opt.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs font-mono">
                        SEO Score: {opt.seo_score}/100
                      </div>
                      <button
                        onClick={() => handleCopy(`${opt.title}: ${opt.subtitle}`, `title_${idx}`)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white"
                        title="Copy Title & Subtitle"
                      >
                        {copiedId === `title_${idx}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400">Title Length:</span>
                      <p className="font-semibold text-white">{opt.character_count_title} chars (Recommended &lt;100)</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Subtitle Length:</span>
                      <p className="font-semibold text-white">{opt.character_count_subtitle} chars (Recommended &lt;180)</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Stuffing Risk:</span>
                      <p className={`font-semibold ${opt.stuffing_risk === 'LOW' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {opt.stuffing_risk}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Readability Score:</span>
                      <p className="font-semibold text-sky-400">{opt.readability_score}/100</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                    💡 <b>Rationale:</b> {opt.rationale}
                  </p>
                </div>
              ))}
            </div>
          ) : titleOptions.length > 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-slate-800">
              No titles match your filter criteria. Click &quot;Reset Filters&quot; to show all.
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: DESCRIPTION */}
      {activeTab === 'description' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <form onSubmit={generateDescription} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Book Title</label>
                  <input
                    type="text"
                    value={descTitle}
                    onChange={(e) => setDescTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={descSubtitle}
                    onChange={(e) => setDescSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGeneratingDesc}
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {isGeneratingDesc ? 'Generating HTML...' : 'Generate KDP Description'}
                </button>
              </div>
            </form>
          </div>

          {descriptionResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* HTML Code Preview */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">KDP-Allowed HTML Source</h3>
                  <button
                    onClick={() => handleCopy(descriptionResult.full_html_description, 'desc_html')}
                    className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
                  >
                    {copiedId === 'desc_html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'desc_html' ? 'Copied' : 'Copy HTML'}</span>
                  </button>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-96">
                  {descriptionResult.full_html_description}
                </pre>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Characters: {descriptionResult.full_html_description.length}/4000</span>
                  <span className="text-emerald-400 font-semibold">Allowed HTML Tags Only</span>
                </div>
              </div>

              {/* Visual Rendered Preview */}
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Amazon Buyer Preview</h3>
                <div 
                  className="bg-white text-slate-900 p-6 rounded-2xl text-xs space-y-3 prose max-w-none overflow-y-auto max-h-96"
                  dangerouslySetInnerHTML={{ __html: descriptionResult.full_html_description }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BACKEND KEYWORDS */}
      {activeTab === 'backend' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-5 border border-slate-800">
            <form onSubmit={generateBackendKeywords} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Niche</label>
                  <input
                    type="text"
                    value={backendNiche}
                    onChange={(e) => setBackendNiche(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Primary Keyword</label>
                  <input
                    type="text"
                    value={backendPk}
                    onChange={(e) => setBackendPk(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Existing Title & Subtitle Words (to Deduplicate)</label>
                <input
                  type="text"
                  value={titleWords}
                  onChange={(e) => setTitleWords(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGeneratingBackend}
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
                >
                  {isGeneratingBackend ? 'Optimizing...' : 'Build 7-Box Slots'}
                </button>
              </div>
            </form>
          </div>

          {backendResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">7 KDP Backend Slots (Zero Title Overlap)</h3>
                <span className="text-xs text-emerald-400 font-semibold">
                  Total Characters: {backendResult.total_characters_used} / 1743
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {backendResult.boxes.map((boxStr, idx) => (
                  <div key={idx} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-400 uppercase">Slot #{idx + 1}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${boxStr.length <= 249 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {boxStr.length} / 249 characters
                        </span>
                      </div>
                      <p className="text-xs text-white font-mono">{boxStr}</p>
                    </div>

                    <button
                      onClick={() => handleCopy(boxStr, `box_${idx}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs self-start sm:self-auto"
                    >
                      {copiedId === `box_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === `box_${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
