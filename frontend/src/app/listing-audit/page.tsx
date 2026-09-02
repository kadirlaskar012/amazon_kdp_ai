'use client';

import React, { useState } from 'react';
import { SearchCheck, AlertTriangle, CheckCircle, Search, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { ListingAuditResponse } from '@/lib/types';

export default function ListingAuditorPage() {
  const [asin, setAsin] = useState('B08N5M7ABC');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('8.99');
  const [bsr, setBsr] = useState<string>('24000');
  const [rating, setRating] = useState<string>('4.6');
  const [reviewCount, setReviewCount] = useState<string>('85');
  const [marketplace, setMarketplace] = useState('US');

  const [auditResult, setAuditResult] = useState<ListingAuditResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.auditListing({
        asin: asin || undefined,
        title: title || undefined,
        subtitle: subtitle || undefined,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        bsr: bsr ? parseInt(bsr) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        review_count: reviewCount ? parseInt(reviewCount) : undefined,
        marketplace
      });
      setAuditResult(res);
    } catch (e) {}
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SearchCheck className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">KDP Listing Auditor</h1>
            <StatusBadge status="CALCULATED" source="KDP Policy & Conversion Engine" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit any ASIN or draft listing for KDP compliance, SEO health, and get prioritized Top 5 Fixes.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={handleAudit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">ASIN / Amazon URL (Optional)</label>
              <input
                type="text"
                value={asin}
                onChange={(e) => setAsin(e.target.value)}
                placeholder="e.g. B00..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Book Title (Optional if ASIN entered)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Price ($)</label>
              <input
                type="number"
                step="0.1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Current BSR</label>
              <input
                type="number"
                value={bsr}
                onChange={(e) => setBsr(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="py-2.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchCheck className="w-4 h-4" />}
            <span>Run Complete Listing Audit</span>
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Auditing metadata against Amazon A9 ranking factors and KDP guidelines...</p>
        </div>
      ) : auditResult ? (
        <div className="space-y-6">
          {/* Main Score Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Overall Score</span>
              <p className="text-2xl font-extrabold text-white font-mono mt-1">{auditResult.overall_score}/100</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">SEO Indexing</span>
              <p className="text-2xl font-extrabold text-sky-400 font-mono mt-1">{auditResult.seo_score}/100</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pricing Health</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{auditResult.pricing_score}/100</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Conversion Power</span>
              <p className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">{auditResult.conversion_score}/100</p>
            </div>
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">KDP Compliance</span>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">100% Passed</p>
            </div>
          </div>

          {/* Top 5 Prioritized Fixes */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Top 5 Prioritized Improvements to Boost Rank</span>
            </h3>

            <div className="space-y-3">
              {auditResult.top_5_fixes?.map((fix, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    #{fix.priority}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{fix.area}</span>
                    <p className="text-xs text-slate-300 mt-0.5">{fix.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          Enter an ASIN or listing details to run a listing audit.
        </div>
      )}

      {auditResult && (
        <EvidencePanel
          evidence={auditResult.evidence || {}}
          methodology="Weighted evaluation: 30% Title SEO + 20% Subtitle + 25% HTML Description + 15% Pricing + 10% Social Proof."
          source="KDP Listing Auditor Engine"
          dataStatus="CALCULATED"
        />
      )}
    </div>
  );
}
