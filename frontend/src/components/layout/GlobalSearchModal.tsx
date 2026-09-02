'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Book, KeyRound, Sparkles, X, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (type: 'books' | 'keywords' | 'competition' | 'ideas') => {
    if (!query.trim()) return;
    onClose();
    if (type === 'books') {
      router.push(`/books?q=${encodeURIComponent(query)}`);
    } else if (type === 'keywords') {
      router.push(`/keywords?seed=${encodeURIComponent(query)}`);
    } else if (type === 'competition') {
      router.push(`/competition?niche=${encodeURIComponent(query)}`);
    } else if (type === 'ideas') {
      router.push(`/ideas?niche=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0c1222] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-sky-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch('books');
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search books, keywords, competitor niches, ASINs..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Shortcuts */}
        <div className="p-3 space-y-1 text-xs">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Quick Actions for &quot;{query || '...'}&quot;
          </p>

          <button
            onClick={() => handleSearch('books')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Book className="w-4 h-4 text-sky-400" />
              <span>Search Amazon Catalog in <b>Book Finder</b></span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => handleSearch('keywords')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Expand live suggestions in <b>Keyword Research</b></span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            onClick={() => handleSearch('competition')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800/80 text-slate-200 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Analyze barriers & gaps in <b>Competition Analyzer</b></span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Press <b>Enter</b> to search or <b>Esc</b> to close</span>
          <span className="text-emerald-400">Live Amazon Data Connected</span>
        </div>
      </div>
    </div>
  );
};
