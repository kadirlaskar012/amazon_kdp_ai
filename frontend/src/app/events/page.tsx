'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Sparkles, ArrowRight, Loader2, Tag, BookOpen } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { SeasonalEvent } from '@/lib/types';

export default function SeasonalEventsPage() {
  const [marketplace, setMarketplace] = useState('US');
  const [events, setEvents] = useState<SeasonalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [marketplace]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEventsCalendar(marketplace, 365);
      setEvents(res || []);
    } catch (e) {
      setEvents([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              KDP Seasonal Opportunity Calendar
            </h1>
            <StatusBadge status="CALCULATED" source="Dynamic Holiday & Prep Engine" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic holiday opportunities, preparation windows, and associated high-converting keywords.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Calculating seasonal publishing windows and prep timelines...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map((ev, idx) => {
            const isUrgent = ev.days_until_prep <= 0 && ev.days_until_event > 0;

            return (
              <div
                key={idx}
                className={`glass-panel rounded-3xl p-6 border transition-all ${
                  isUrgent ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">{ev.category}</span>
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold animate-pulse">
                          🔥 PRIME PUBLISHING WINDOW NOW
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white mt-1">{ev.name}</h2>
                    <p className="text-xs text-slate-400">Event Date: <b>{ev.event_date}</b></p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Event Countdown</span>
                      <span className="text-lg font-bold text-white font-mono">{ev.days_until_event} days</span>
                    </div>

                    <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Prep Window</span>
                      <span className={`text-lg font-bold font-mono ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {ev.days_until_prep <= 0 ? 'Active Now' : `in ${ev.days_until_prep}d`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Related Niches */}
                  <div>
                    <span className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" /> High-Converting Niches
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ev.related_niches?.map((niche, i) => (
                        <Link
                          key={i}
                          href={`/ideas?niche=${encodeURIComponent(niche)}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
                        >
                          {niche} →
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Keyword Opportunities */}
                  <div>
                    <span className="text-xs font-bold text-slate-200 block mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" /> Target Keyword Opportunities
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ev.keyword_opportunities?.map((kw, i) => (
                        <Link
                          key={i}
                          href={`/keywords?seed=${encodeURIComponent(kw)}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300/90 text-xs font-mono transition-all"
                        >
                          {kw}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {ev.evidence_notes && (
                  <p className="mt-4 text-[11px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                    💡 <b>Evidence Note:</b> {ev.evidence_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          No upcoming seasonal events calculated.
        </div>
      )}

      <EvidencePanel
        evidence={{
          total_events_calculated: events.length,
          marketplace,
          lookahead_window: '365 days'
        }}
        methodology="Dynamic multi-year calendar model with 60-90 day algorithmic indexing lead times."
        source="Seasonal Calendar Engine"
        dataStatus="CALCULATED"
      />
    </div>
  );
}
