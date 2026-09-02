'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Trophy, Search, ArrowUpDown, Filter, Eye, ExternalLink, 
  Loader2, SlidersHorizontal, RotateCcw 
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { Book } from '@/lib/types';

const CATEGORIES = [
  'coloring books for adults',
  'coloring books for kids',
  'activity books for kids',
  'puzzle books for adults',
  'sudoku books',
  'word search books',
  'guided journals',
  'log books and trackers',
  'kids handwriting practice',
  'composition notebooks'
];

export default function BestsellersPage() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [marketplace, setMarketplace] = useState('US');
  const [books, setBooks] = useState<Book[]>([]);
  const [avgReviews, setAvgReviews] = useState<number | null>(null);
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [dataStatus, setDataStatus] = useState('LIVE');
  const [isLoading, setIsLoading] = useState(true);

  // Sorting & Filtering
  const [searchFilter, setSearchFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState(0);
  const [priceRangeFilter, setPriceRangeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'rank_asc' | 'price_asc' | 'price_desc' | 'rating_desc' | 'reviews_desc'>('rank_asc');

  useEffect(() => {
    loadBestsellers();
  }, [selectedCategory, marketplace]);

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

  const filteredAndSortedBooks = useMemo(() => {
    let list = [...books];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(b => 
        b.title.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q))
      );
    }

    if (minRatingFilter > 0) {
      list = list.filter(b => (b.current_rating || 0) >= minRatingFilter);
    }

    if (priceRangeFilter === 'UNDER_10') {
      list = list.filter(b => b.price !== null && b.price !== undefined && b.price < 10);
    } else if (priceRangeFilter === 'UNDER_15') {
      list = list.filter(b => b.price !== null && b.price !== undefined && b.price < 15);
    } else if (priceRangeFilter === 'OVER_15') {
      list = list.filter(b => b.price !== null && b.price !== undefined && b.price >= 15);
    }

    list.sort((a, b) => {
      if (sortBy === 'rank_asc') return (a.current_bsr || 999) - (b.current_bsr || 999);
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'rating_desc') return (b.current_rating || 0) - (a.current_rating || 0);
      if (sortBy === 'reviews_desc') return (b.current_review_count || 0) - (a.current_review_count || 0);
      return 0;
    });

    return list;
  }, [books, searchFilter, minRatingFilter, priceRangeFilter, sortBy]);

  const hasFilters = searchFilter || minRatingFilter > 0 || priceRangeFilter !== 'ALL' || sortBy !== 'rank_asc';

  const resetFilters = () => {
    setSearchFilter('');
    setMinRatingFilter(0);
    setPriceRangeFilter('ALL');
    setSortBy('rank_asc');
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

      {/* Sort & Filter Controls */}
      {books.length > 0 && !isLoading && (
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white">Filter & Sort Bestsellers:</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                Showing {filteredAndSortedBooks.length} of {books.length}
              </span>
            </div>

            {hasFilters && (
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
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search title, author..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="rank_asc">Bestseller Rank (#1 to #30)</option>
                <option value="reviews_desc">Most Reviews</option>
                <option value="rating_desc">Highest Rating</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={minRatingFilter}
                onChange={(e) => setMinRatingFilter(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value={0}>All Ratings</option>
                <option value={4.0}>4.0+ Stars</option>
                <option value={4.5}>4.5+ Stars (High Quality)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={priceRangeFilter}
                onChange={(e) => setPriceRangeFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Price Ranges</option>
                <option value="UNDER_10">Under $10</option>
                <option value="UNDER_15">Under $15</option>
                <option value="OVER_15">$15 and Above</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Best Sellers Grid */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Querying live best sellers for &quot;{selectedCategory}&quot;...</p>
          </div>
        ) : filteredAndSortedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedBooks.map((b, idx) => (
              <div key={b.asin} className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 flex gap-4 hover:border-slate-700 transition-all">
                <div className="relative flex-shrink-0">
                  <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-lg">
                    #{b.current_bsr || idx + 1}
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
        ) : books.length > 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <p className="font-bold text-white">No bestsellers match your filter criteria.</p>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No best seller books found. Try selecting another category.
          </div>
        )}
      </div>
    </div>
  );
}
