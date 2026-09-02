'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Bell, Trash2, TrendingUp, TrendingDown, Check, Loader2, RefreshCw } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { WatchlistItem, AlertItem } from '@/lib/types';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [watchRes, alertRes] = await Promise.all([
        api.getWatchlist(),
        api.getAlerts(),
      ]);
      setWatchlist(watchRes || []);
      setAlerts(alertRes || []);
    } catch (e) {}
    setIsLoading(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteWatchlistItem(id);
      setWatchlist(watchlist.filter((w) => w.id !== id));
    } catch (e) {}
  };

  const handleMarkAlert = async (id: number) => {
    try {
      await api.markAlertRead(id);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    } catch (e) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Watchlist & Alerts</h1>
            <StatusBadge status="OBSERVED" source="Background Local Scheduler" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track movement on competitor books, review velocity surges, and receive automated delta alerts.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium hover:border-slate-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Watchlist</span>
        </button>
      </div>

      {/* 2-Column: Tracked Items vs Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tracked Items Column */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Tracked Books & Niches ({watchlist.length})</span>
          </h3>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading tracked items...</div>
          ) : watchlist.length > 0 ? (
            <div className="space-y-3">
              {watchlist.map((item) => {
                const current = JSON.parse(item.current_metrics_json || '{}');
                const baseline = JSON.parse(item.baseline_metrics_json || '{}');

                return (
                  <div key={item.id} className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-sky-400 uppercase">{item.item_type}</span>
                        <h4 className="font-bold text-sm text-white mt-0.5">{item.label || item.item_id}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">ASIN / ID: {item.item_id} ({item.marketplace})</p>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Metric Deltas */}
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">BSR Shift:</span>
                        <p className="font-bold text-white font-mono mt-0.5">
                          {current.bsr ? `#${current.bsr.toLocaleString()}` : 'N/A'}{' '}
                          {baseline.bsr && current.bsr && (
                            <span className={`text-[10px] ${current.bsr < baseline.bsr ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ({baseline.bsr.toLocaleString()} → {current.bsr.toLocaleString()})
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Review Growth:</span>
                        <p className="font-bold text-white font-mono mt-0.5">
                          {current.reviews ? current.reviews.toLocaleString() : '0'}{' '}
                          {baseline.reviews !== undefined && current.reviews !== undefined && (
                            <span className="text-[10px] text-emerald-400">
                              (+{current.reviews - baseline.reviews})
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Price:</span>
                        <p className="font-bold text-white font-mono mt-0.5">
                          {current.price ? `$${current.price.toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-800">
              No items in watchlist. Click &quot;Track This Book&quot; in Book Finder to start tracking movement.
            </div>
          )}
        </div>

        {/* Alerts Feed Column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span>Automated Market Alerts ({alerts.filter((a) => !a.is_read).length} Unread)</span>
          </h3>

          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-2xl border transition-all space-y-1 text-xs ${
                    a.is_read
                      ? 'bg-slate-950/40 border-slate-900 text-slate-400'
                      : 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${
                      a.severity === 'SUCCESS' ? 'text-emerald-400' :
                      a.severity === 'WARNING' ? 'text-amber-400' : 'text-sky-400'
                    }`}>
                      {a.title}
                    </span>
                    {!a.is_read && (
                      <button
                        onClick={() => handleMarkAlert(a.id)}
                        className="p-1 hover:text-white text-slate-400"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">{a.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-800">
                No active alerts. The background scheduler checks for BSR and review movements every 6 hours.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
