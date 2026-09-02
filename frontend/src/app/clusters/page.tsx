'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Search, Loader2, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { EvidencePanel } from '@/components/data/EvidencePanel';
import { api } from '@/lib/api';
import { Keyword } from '@/lib/types';

export default function KeywordClustersPage() {
  const [seed, setSeed] = useState('activity book');
  const [marketplace, setMarketplace] = useState('US');
  const [clusters, setClusters] = useState<Record<string, Keyword[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [dataStatus, setDataStatus] = useState('LIVE');

  useEffect(() => {
    loadClusters();
  }, []);

  const loadClusters = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!seed.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.researchKeywords({
        seed_keyword: seed,
        marketplace,
        expand_depth: 1,
        include_questions: true,
        include_buyer_intent: true
      });
      setClusters(res.clusters || {});
      setDataStatus(res.data_status || 'LIVE');
    } catch (e) {
      setClusters({});
      setDataStatus('UNAVAILABLE');
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Keyword Semantic Clustering</h1>
            <StatusBadge status={dataStatus} source="Amazon Suggest & Local AI" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Categorize live search phrases into semantic buckets for structured KDP metadata optimization.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <form onSubmit={loadClusters} className="flex gap-3">
          <div className="relative flex-1">
            <Layers className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed topic for semantic grouping..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Cluster Keywords</span>
          </button>
        </form>
      </div>

      {/* Clusters Grid */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Expanding and semantically clustering Amazon queries...</p>
        </div>
      ) : Object.keys(clusters).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(clusters).map(([groupName, items]) => (
            <div key={groupName} className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>{groupName}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {items.length} terms
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {items.map((kw, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700">
                      <span className="text-slate-200 font-medium truncate max-w-[180px]">{kw.keyword}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                        {kw.opportunity_score.toFixed(0)}/100
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Recommended Placement: <b className="text-sky-400">{items[0]?.recommended_use || 'Metadata'}</b>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          No clusters generated.
        </div>
      )}

      <EvidencePanel
        evidence={{
          seed,
          marketplace,
          cluster_count: Object.keys(clusters).length,
          total_terms: Object.values(clusters).reduce((acc, curr) => acc + curr.length, 0)
        }}
        methodology="Semantic categorization of live Amazon autocomplete search signals."
        source="Amazon Completion Service"
        dataStatus={dataStatus}
      />
    </div>
  );
}
