'use client';

import React, { useState } from 'react';
import { FileText, Sparkles, Copy, Check, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
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
                <label className="text-[11px] text-slate-400 block mb-1">Secondary Keywords (comma separated)</label>
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
                  className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20"
                >
                  {isGeneratingTitles ? 'Evaluating...' : 'Generate SEO Titles'}
                </button>
              </div>
            </form>
          </div>

          {titleOptions.length > 0 && (
            <div className="space-y-4">
              {titleOptions.map((opt, idx) => (
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
          )}
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
                  <label className="text-[11px] text-slate-400 block mb-1">Book Subtitle</label>
                  <input
                    type="text"
                    value={descSubtitle}
                    onChange={(e) => setDescSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isGeneratingDesc}
                className="py-2 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20"
              >
                {isGeneratingDesc ? 'Crafting HTML...' : 'Generate Formatted KDP Description'}
              </button>
            </form>
          </div>

          {descriptionResult && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Generated Amazon HTML Code</span>
                <button
                  onClick={() => handleCopy(descriptionResult.full_html_description, 'desc')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium"
                >
                  {copiedId === 'desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'desc' ? 'Copied HTML' : 'Copy HTML Code'}</span>
                </button>
              </div>

              {/* Raw HTML preview */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                {descriptionResult.full_html_description}
              </div>

              {/* Formatted Render */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Visual Buyer Preview:</span>
                <div
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 space-y-2 leading-relaxed"
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
                  <label className="text-[11px] text-slate-400 block mb-1">Words in Title & Subtitle (to be stripped)</label>
                  <input
                    type="text"
                    value={titleWords}
                    onChange={(e) => setTitleWords(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Secondary Search Phrases</label>
                  <input
                    type="text"
                    value={backendSec}
                    onChange={(e) => setBackendSec(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isGeneratingBackend}
                className="py-2 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20"
              >
                {isGeneratingBackend ? 'Optimizing 7 Boxes...' : 'Generate 7 Backend Keyword Boxes'}
              </button>
            </form>
          </div>

          {backendResult && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">7 KDP Backend Search Boxes (Deduplicated)</h3>
                  <p className="text-xs text-slate-400">Zero punctuation, no repetition of title words, compliant with KDP terms.</p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  {backendResult.total_characters_used} Chars Used
                </div>
              </div>

              <div className="space-y-2.5">
                {backendResult.boxes.map((box, idx) => (
                  <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-sky-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-xs text-slate-100 truncate">{box || '(Empty / Spare)'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">{box.length}/50 bytes</span>
                      <button
                        onClick={() => handleCopy(box, `box_${idx}`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Copy Box"
                      >
                        {copiedId === `box_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                ✅ <b>Compliance Notice:</b> {backendResult.compliance_notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
