'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Search, Eye, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { Book } from '@/lib/types';

const CATEGORIES = [
  'coloring books for adults',
  'coloring books for kids',
  'activity books for toddlers',
  'word search books',
  'sudoku puzzle books',
  'daily gratitude journals',
  'habit tracker planners',
  'handwriting practice workbooks',
  'dad joke books',
  'log books and account ledgers'
];

export default function BestSellersPage() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [marketplace, setMarketplace] = useState('US');
  const [books, setBooks] = useState<Book[]>([]);
  const [avgReviews, setAvgReviews] = useState<number | null>(null);
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [dataStatus, setDataStatus] = useState('LIVE');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBestsellers();
  }, [selectedCategory]);

  const loadBestsellers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBestsellers(selectedCategory, marketplace);
      setBooks(res.results || []);
      setAvgReviews(res.avg_reviews);
      setAvgPrice(res.avg_price);
      setDataStatus(res.data_status || 'LIVE');
    } catch (e) {
      setBooks([]);
      setDataStatus('UNAVAILABLE');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Best Seller Research</h1>
            <StatusBadge status={dataStatus} source="Amazon Live Search" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live exploration of top ranking books, average review barriers, and price distributions.
          </p>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-medium focus:border-sky-500 focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-slate-200 capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Top Sellers Sampled</span>
          <p className="text-2xl font-bold text-white mt-1">{books.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Average Review Barrier</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{avgReviews ? avgReviews.toLocaleString() : '0'} reviews</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Average Selling Price</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{avgPrice ? `$${avgPrice.toFixed(2)}` : '$8.99'}</p>
        </div>
      </div>

      {/* Best Sellers Grid */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Querying live best sellers for &quot;{selectedCategory}&quot;...</p>
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((b, idx) => (
              <div key={b.asin} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex gap-4 hover:border-slate-700 transition-all">
                <div className="relative flex-shrink-0">
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg">
                    #{idx + 1}
                  </span>
                  {b.cover_image_url ? (
                    <img src={b.cover_image_url} alt={b.title} className="w-20 h-28 object-cover rounded-xl shadow-md border border-slate-700/50" />
                  ) : (
                    <div className="w-20 h-28 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-400">No Cover</div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link href={`/books/${b.asin}`} className="font-bold text-xs text-white hover:text-sky-400 line-clamp-2 transition-colors">
                      {b.title}
                    </Link>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">By {b.author || 'Unknown'}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">{b.price ? `$${b.price.toFixed(2)}` : 'N/A'}</span>
                      {b.current_rating && <span className="text-amber-400">★ {b.current_rating.toFixed(1)}</span>}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-400">{b.current_review_count ? b.current_review_count.toLocaleString() : '0'} reviews</span>
                    <div className="flex items-center gap-1">
                      <Link href={`/books/${b.asin}`} className="p-1 text-slate-400 hover:text-sky-400">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-400">
            Live data unavailable.
          </div>
        )}
      </div>

      <EvidencePanel
        evidence={{
          category: selectedCategory,
          marketplace,
          total_ranked_sampled: books.length,
          avg_price: avgPrice,
          avg_reviews: avgReviews
        }}
        methodology="Live bestseller query on Amazon stripbooks catalogue."
        source="Amazon Live Catalog"
        dataStatus={dataStatus}
      />
    </div>
  );
}
