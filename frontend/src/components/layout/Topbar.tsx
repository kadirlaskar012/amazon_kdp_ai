'use client';

import React, { useState, useEffect } from 'react';
import { Search, Globe2, Bell, ShieldCheck, RefreshCw, Command } from 'lucide-react';
import { GlobalSearchModal } from './GlobalSearchModal';
import { api } from '@/lib/api';

const MARKETPLACES = [
  { code: 'US', label: 'Amazon.com (US $)', flag: '🇺🇸' },
  { code: 'UK', label: 'Amazon.co.uk (UK £)', flag: '🇬🇧' },
  { code: 'DE', label: 'Amazon.de (DE €)', flag: '🇩🇪' },
  { code: 'CA', label: 'Amazon.ca (CA $)', flag: '🇨🇦' },
  { code: 'AU', label: 'Amazon.com.au (AU $)', flag: '🇦🇺' },
  { code: 'FR', label: 'Amazon.fr (FR €)', flag: '🇫🇷' },
  { code: 'IT', label: 'Amazon.it (IT €)', flag: '🇮🇹' },
  { code: 'ES', label: 'Amazon.es (ES €)', flag: '🇪🇸' },
  { code: 'IN', label: 'Amazon.in (IN ₹)', flag: '🇮🇳' },
  { code: 'JP', label: 'Amazon.co.jp (JP ¥)', flag: '🇯🇵' },
];

export const Topbar: React.FC<{
  currentMarketplace: string;
  onMarketplaceChange: (mp: string) => void;
}> = ({ currentMarketplace, onMarketplaceChange }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  useEffect(() => {
    // Keyboard shortcut Command+K / Ctrl+K
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    api.getAlerts().then((alerts) => {
      if (Array.isArray(alerts)) {
        setUnreadAlerts(alerts.filter((a) => !a.is_read).length);
      }
    }).catch(() => {});
  }, []);

  return (
    <>
      <header className="h-16 border-b border-slate-800/80 bg-[#0c1222]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Global Search Bar Trigger */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs transition-all shadow-inner"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-sky-400" />
              <span>Search across books, keywords, niches, and projects...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-4">
          {/* Marketplace Selector */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Globe2 className="w-4 h-4 text-sky-400" />
            <select
              value={currentMarketplace}
              onChange={(e) => onMarketplaceChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              {MARKETPLACES.map((m) => (
                <option key={m.code} value={m.code} className="bg-slate-900 text-slate-200">
                  {m.flag} {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Data Transparency Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Mock Guarantee</span>
          </div>

          {/* Alerts Bell */}
          <a
            href="/watchlist"
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadAlerts}
              </span>
            )}
          </a>
        </div>
      </header>

      {/* Global Search Modal */}
      {isSearchOpen && <GlobalSearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};
