'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Trophy,
  KeyRound,
  Gem,
  Layers,
  Swords,
  TrendingUp,
  CalendarDays,
  Lightbulb,
  Sparkles,
  FileText,
  SearchCheck,
  Palette,
  Target,
  FolderKanban,
  Bookmark,
  BarChart3,
  Settings,
  TerminalSquare,
  BookOpen
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'Core Research',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Book Finder', href: '/books', icon: Search },
      { name: 'Best Sellers', href: '/bestsellers', icon: Trophy },
      { name: 'Keyword Research', href: '/keywords', icon: KeyRound },
      { name: 'Easy-Rank Gems', href: '/easy-rank', icon: Gem },
      { name: 'Keyword Clusters', href: '/clusters', icon: Layers },
      { name: 'Competition Analyzer', href: '/competition', icon: Swords },
    ],
  },
  {
    title: 'Trends & Opportunities',
    items: [
      { name: 'Trend Research', href: '/trends', icon: TrendingUp },
      { name: 'Upcoming Events', href: '/events', icon: CalendarDays },
      { name: 'Book Ideas Generator', href: '/ideas', icon: Lightbulb },
      { name: '"What to Publish?"', href: '/what-to-publish', icon: Sparkles },
    ],
  },
  {
    title: 'Publishing & SEO Studio',
    items: [
      { name: 'SEO Title Studio', href: '/seo', icon: FileText },
      { name: 'Listing Auditor', href: '/listing-audit', icon: SearchCheck },
      { name: 'Cover Intelligence', href: '/cover', icon: Palette },
      { name: 'Ranking Strategy', href: '/strategy', icon: Target },
    ],
  },
  {
    title: 'Workspace & Operations',
    items: [
      { name: 'Upcoming Projects', href: '/projects', icon: FolderKanban },
      { name: 'Watchlist & Alerts', href: '/watchlist', icon: Bookmark },
      { name: 'Reports & History', href: '/reports', icon: BarChart3 },
      { name: 'Settings & Diagnostics', href: '/settings', icon: Settings },
      { name: 'System Logs', href: '/logs', icon: TerminalSquare },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/80 bg-[#0c1222] flex flex-col h-screen select-none sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            KDP Studio <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/20 text-sky-400 rounded border border-sky-500/30">PRO</span>
          </h1>
          <p className="text-[11px] text-slate-400">Intelligence & SEO Suite</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Local Engine Active</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">v1.0</span>
      </div>
    </aside>
  );
};
