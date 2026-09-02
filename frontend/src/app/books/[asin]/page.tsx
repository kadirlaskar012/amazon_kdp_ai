'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, ExternalLink, Bookmark, Sparkles, TrendingUp, 
  ShieldCheck, Calendar, DollarSign, BookOpen, AlertTriangle, 
  CheckCircle, Loader2, BarChart2
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';

export default function BookDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const asin = params.asin as string;
  const marketplace = searchParams.get('marketplace') || 'US';

  const [bookData, setBookData] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [competitorStrength, setCompetitorStrength] = useState<string>('MEDIUM');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracked, setIsTracked] = useState(false);

  useEffect(() => {
    loadBookDetails();
  }, [asin]);

  const loadBookDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBookDetails(asin, marketplace);
      setBookData(res.book);
      setObservations(res.observations || []);
      setCompetitorStrength(res.competitor_strength || 'MEDIUM');
      setAiAnalysis(res.ai_analysis);
      setIsTracked(res.book.is_tracked);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleToggleTrack = async () => {
    try {
      const res = await api.toggleBookTracking(asin);
      setIsTracked(res.is_tracked);
      if (res.is_tracked) {
        await api.addToWatchlist({
          item_type: 'BOOK',
          item_id: asin,
          marketplace,
          label: bookData?.title
        });
      }
    } catch (e) {}
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Retrieving live Amazon metadata and historical observations...</p>
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-sm font-bold text-white">Live Data Unavailable for ASIN: {asin}</p>
        <Link href="/books" className="text-xs text-sky-400 hover:text-sky-300">
          ← Return to Book Finder
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Back Button & Top Meta */}
      <div className="flex items-center justify-between">
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Book Finder</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleTrack}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isTracked
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isTracked ? 'Tracked in Watchlist' : 'Track This Book'}</span>
          </button>

          <a
            href={bookData.amazon_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-all"
          >
            <span>Open on Amazon</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Book Hero Card */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 flex flex-col md:flex-row gap-6 items-start">
        {bookData.cover_image_url ? (
          <img
            src={bookData.cover_image_url}
            alt={bookData.title}
            className="w-36 md:w-48 object-cover rounded-2xl shadow-2xl border border-slate-700/60 flex-shrink-0"
          />
        ) : (
          <div className="w-36 md:w-48 h-64 bg-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
            No Cover Available
          </div>
        )}

        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge status={bookData.data_status || 'LIVE'} source={bookData.source} />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              competitorStrength === 'DOMINANT' ? 'bg-rose-500/20 text-rose-400' :
              competitorStrength === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {competitorStrength} Competitor
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
            {bookData.title}
          </h1>

          {bookData.subtitle && (
            <p className="text-xs md:text-sm text-slate-300 font-medium">{bookData.subtitle}</p>
          )}

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 pt-1">
            <span>By <b className="text-slate-200">{bookData.author || 'Unknown Author'}</b></span>
            {bookData.publisher && <span>• Publisher: {bookData.publisher}</span>}
            {bookData.publication_date && <span>• Published: {bookData.publication_date}</span>}
            {bookData.page_count && <span>• {bookData.page_count} pages</span>}
            <span>• Format: {bookData.format || 'Paperback'}</span>
            <span className="font-mono text-[11px] text-slate-400">ASIN: {bookData.asin}</span>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Current BSR</span>
              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {bookData.current_bsr ? `#${bookData.current_bsr.toLocaleString()}` : 'Unranked'}
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Rating & Reviews</span>
              <p className="text-base font-bold text-amber-400 mt-0.5">
                ★ {bookData.current_rating ? bookData.current_rating.toFixed(1) : 'N/A'}{' '}
                <span className="text-xs text-slate-400 font-normal">
                  ({bookData.current_review_count ? bookData.current_review_count.toLocaleString() : '0'})
                </span>
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">List Price</span>
              <p className="text-base font-bold text-white mt-0.5">
                {bookData.price ? `$${bookData.price.toFixed(2)}` : 'N/A'}
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Estimated Monthly Sales</span>
              <p className="text-base font-bold text-sky-400 font-mono mt-0.5">
                {bookData.estimated_monthly_sales ? `~${bookData.estimated_monthly_sales.toLocaleString()} copies` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Historical Observations vs AI Critique */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Observations Time-Series Table */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Historical Observations & Movement</h3>
            </div>
            <span className="text-[10px] text-slate-400">{observations.length} Recorded Snapshots</span>
          </div>

          {observations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Date / Timestamp</th>
                    <th className="py-2 px-3">BSR</th>
                    <th className="py-2 px-3">Reviews</th>
                    <th className="py-2 px-3">Price</th>
                    <th className="py-2 px-3">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {observations.map((obs) => (
                    <tr key={obs.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(obs.retrieved_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-emerald-400 font-semibold">
                        {obs.bsr ? `#${obs.bsr.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-slate-200">
                        {obs.review_count !== undefined ? obs.review_count.toLocaleString() : '0'}
                      </td>
                      <td className="py-2 px-3 text-white">
                        {obs.price ? `$${obs.price.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-amber-400">
                        {obs.rating ? `★ ${obs.rating.toFixed(1)}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              First observation recorded today. Subsequent automated scheduler runs will track BSR and review growth over time.
            </p>
          )}
        </div>

        {/* AI Listing Analysis & Market Opportunities */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-sm font-bold text-white">Evidence-Grounded Listing Analysis</h3>
            <StatusBadge status="AI_ANALYSIS" />
          </div>

          {aiAnalysis ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Identified Niche</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{aiAnalysis.niche}</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Target Audience</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{aiAnalysis.target_audience}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Potential Listing Weaknesses
                </span>
                <ul className="mt-1.5 space-y-1 text-slate-300">
                  {aiAnalysis.potential_weaknesses?.map((w: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Opportunities to Outrank This Competitor
                </span>
                <ul className="mt-1.5 space-y-1 text-slate-300">
                  {aiAnalysis.potential_opportunities_for_competitor?.map((opp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              Generating AI listing audit based on factual metadata...
            </p>
          )}
        </div>
      </div>

      {/* Evidence Panel */}
      <EvidencePanel
        evidence={{
          asin: bookData.asin,
          marketplace,
          retrieved_bsr: bookData.current_bsr,
          retrieved_reviews: bookData.current_review_count,
          retrieved_rating: bookData.current_rating,
          estimated_sales_formula: 'BSR Empirical Log-Regression Model'
        }}
        methodology="Observed historical snapshots stored in local SQLite database."
        source="Amazon Live Detail Page & Local Observation History"
        dataStatus={bookData.data_status || 'LIVE'}
      />
    </div>
  );
}
