'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, Filter, SlidersHorizontal, ArrowUpDown, 
  Download, ExternalLink, Bookmark, ShieldCheck, Eye, 
  HelpCircle, ChevronRight, Loader2
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { Book } from '@/lib/types';

function BookFinderContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [marketplace, setMarketplace] = useState('US');
  const [category, setCategory] = useState('books');
  const [minBSR, setMinBSR] = useState<string>('');
  const [maxBSR, setMaxBSR] = useState<string>('');
  const [minReviews, setMinReviews] = useState<string>('');
  const [maxReviews, setMaxReviews] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');

  const [books, setBooks] = useState<Book[]>([]);
  const [dataStatus, setDataStatus] = useState<string>('LIVE');
  const [source, setSource] = useState<string>('amazon_live');
  const [avgPrice, setAvgPrice] = useState<number | null>(null);
  const [avgReviews, setAvgReviews] = useState<number | null>(null);
  const [avgBSR, setAvgBSR] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('relevance');

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setHasSearched(true);
    setIsLoading(true);
    try {
      const res = await api.searchBooks({
        query,
        marketplace,
        category,
        min_bsr: minBSR ? parseInt(minBSR) : undefined,
        max_bsr: maxBSR ? parseInt(maxBSR) : undefined,
        min_reviews: minReviews ? parseInt(minReviews) : undefined,
        max_reviews: maxReviews ? parseInt(maxReviews) : undefined,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        min_rating: minRating ? parseFloat(minRating) : undefined,
      });

      setBooks(res.results || []);
      setDataStatus(res.data_status || 'LIVE');
      setSource(res.source || 'amazon_live');
      setAvgPrice(res.avg_price);
      setAvgReviews(res.avg_reviews);
      setAvgBSR(res.avg_bsr);
    } catch (err: any) {
      setDataStatus('UNAVAILABLE');
      setBooks([]);
    }
    setIsLoading(false);
  };

  const handleExportCSV = async () => {
    if (books.length === 0) return;
    try {
      const res = await api.exportCsv(books);
      if (res.download_url) {
        window.open(`http://127.0.0.1:8000${res.download_url}`, '_blank');
      }
    } catch (e) {}
  };

  const handleExportExcel = async () => {
    if (books.length === 0) return;
    try {
      const res = await api.exportExcel(books, 'Books');
      if (res.download_url) {
        window.open(`http://127.0.0.1:8000${res.download_url}`, '_blank');
      }
    } catch (e) {}
  };

  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === 'bsr_asc') return (a.current_bsr || 9999999) - (b.current_bsr || 9999999);
    if (sortBy === 'reviews_desc') return (b.current_review_count || 0) - (a.current_review_count || 0);
    if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'rating_desc') return (b.current_rating || 0) - (a.current_rating || 0);
    return 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Book Finder</h1>
            <StatusBadge status={dataStatus} source={source} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search live Amazon book listings, filter by BSR and reviews, and calculate sales velocity.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={books.length === 0}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            disabled={books.length === 0}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-all disabled:opacity-40"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Search & Filter Form */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, author, ASIN, or book title..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                showFilters
                  ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search Live</span>
            </button>
          </div>
        </form>

        {/* Expandable Advanced Filters */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Min BSR</label>
              <input
                type="number"
                placeholder="1000"
                value={minBSR}
                onChange={(e) => setMinBSR(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Max BSR</label>
              <input
                type="number"
                placeholder="150000"
                value={maxBSR}
                onChange={(e) => setMaxBSR(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Min Reviews</label>
              <input
                type="number"
                placeholder="0"
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Max Reviews</label>
              <input
                type="number"
                placeholder="300"
                value={maxReviews}
                onChange={(e) => setMaxReviews(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Min Price ($)</label>
              <input
                type="number"
                step="0.5"
                placeholder="5.99"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Max Price ($)</label>
              <input
                type="number"
                step="0.5"
                placeholder="14.99"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Metrics Bar */}
      {books.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Total Live Books:</span>
            <p className="font-bold text-white text-base mt-0.5">{books.length}</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Average Price:</span>
            <p className="font-bold text-white text-base mt-0.5">
              {avgPrice ? `$${avgPrice.toFixed(2)}` : 'N/A'}
            </p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Average Reviews:</span>
            <p className="font-bold text-white text-base mt-0.5">
              {avgReviews ? avgReviews.toLocaleString() : '0'}
            </p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-sky-400 text-xs mt-1 block focus:outline-none cursor-pointer"
            >
              <option value="relevance" className="bg-slate-900 text-slate-200">Relevance</option>
              <option value="bsr_asc" className="bg-slate-900 text-slate-200">BSR (Best to Worst)</option>
              <option value="reviews_desc" className="bg-slate-900 text-slate-200">Reviews (High to Low)</option>
              <option value="price_asc" className="bg-slate-900 text-slate-200">Price (Low to High)</option>
              <option value="rating_desc" className="bg-slate-900 text-slate-200">Rating (High to Low)</option>
            </select>
          </div>
        </div>
      )}

      {/* Book Search Results Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Connecting to Amazon Live Catalogue...</p>
          </div>
        ) : sortedBooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-3">Author</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Rating</th>
                  <th className="py-3 px-3">Reviews</th>
                  <th className="py-3 px-3">BSR</th>
                  <th className="py-3 px-3">Est. Monthly Sales</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sortedBooks.map((b) => (
                  <tr key={b.asin} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {b.cover_image_url ? (
                          <img
                            src={b.cover_image_url}
                            alt={b.title}
                            className="w-10 h-14 object-cover rounded shadow-md border border-slate-700/50 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-slate-800 rounded flex items-center justify-center text-[10px] text-slate-400 flex-shrink-0">
                            No Cover
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs md:max-w-md">
                          <Link
                            href={`/books/${b.asin}?marketplace=${b.marketplace}`}
                            className="font-semibold text-slate-100 hover:text-sky-400 line-clamp-2 transition-colors"
                          >
                            {b.title}
                          </Link>
                          {b.subtitle && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{b.subtitle}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-slate-400">ASIN: {b.asin}</span>
                            <span className="text-[10px] text-slate-400">• {b.format || 'Paperback'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 truncate max-w-[120px]">{b.author || 'N/A'}</td>

                    <td className="py-3 px-3 font-semibold text-white">
                      {b.price ? `$${b.price.toFixed(2)}` : 'N/A'}
                    </td>

                    <td className="py-3 px-3">
                      {b.current_rating ? (
                        <span className="text-amber-400 font-medium">★ {b.current_rating.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {b.current_review_count !== undefined && b.current_review_count !== null ? (
                        b.current_review_count.toLocaleString()
                      ) : (
                        '0'
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {b.current_bsr ? (
                        <span className="font-mono text-emerald-400 font-semibold">
                          #{b.current_bsr.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unranked</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {b.estimated_monthly_sales ? (
                        <div>
                          <span className="font-bold text-sky-400 font-mono">
                            ~{b.estimated_monthly_sales.toLocaleString()} copies
                          </span>
                          {b.estimated_monthly_revenue && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              est. ${b.estimated_monthly_revenue.toLocaleString()}/mo
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/books/${b.asin}?marketplace=${b.marketplace}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                          title="Deep Detail & AI Analysis"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={b.amazon_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                          title="Open Amazon Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !hasSearched ? (
          <div className="py-20 text-center space-y-3">
            <Search className="w-12 h-12 text-sky-400/50 mx-auto" />
            <h3 className="text-sm font-bold text-white">Ready to Search Amazon Books</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Type your desired book keyword or niche in the search bar above and click &quot;Search Books&quot; to view live Amazon data.
            </p>
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">Live data unavailable or no books matched your filters.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Ensure you have an active internet connection or try searching for a broader keyword seed.
            </p>
          </div>
        )}
      </div>

      {/* Evidence Panel */}
      <EvidencePanel
        evidence={{
          query,
          marketplace,
          total_results: books.length,
          source_type: source,
          calculated_averages: avgPrice ? { avg_price: avgPrice, avg_reviews: avgReviews, avg_bsr: avgBSR } : 'N/A'
        }}
        methodology="Direct extraction from Amazon search catalogue with client-side filter constraints."
        source={source === 'amazon_paapi' ? 'Official Amazon PA-API' : 'Amazon Live Catalog Connector'}
        dataStatus={dataStatus}
      />
    </div>
  );
}

export default function BookFinderPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-xs text-slate-400">Loading Book Finder...</div>}>
      <BookFinderContent />
    </Suspense>
  );
}
