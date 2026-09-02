'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Download, FileText, Clock, Search, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';

export default function ReportsAndHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [reportNiche, setReportNiche] = useState('mindfulness coloring book for adults');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getSearchHistory(30);
      setHistory(res || []);
    } catch (e) {}
  };

  const handleGeneratePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    try {
      // First fetch real live competition data for this niche
      const compData = await api.analyzeCompetition({ keyword: reportNiche, marketplace: 'US' });
      const res = await api.exportPdf(compData);
      if (res.download_url) {
        setDownloadLink(`http://127.0.0.1:8000${res.download_url}`);
      }
    } catch (e) {}
    setIsExporting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Reports & Research History</h1>
            <StatusBadge status="CALCULATED" source="ReportLab & Local History Engine" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Export comprehensive PDF, Excel, and CSV research dossiers or replay historical search queries.
          </p>
        </div>
      </div>

      {/* PDF Generator Card */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <span>Generate Formal KDP Niche PDF Dossier</span>
        </h2>
        <p className="text-xs text-slate-400">
          Produces a complete multi-page PDF document with executive summary, competitor pricing tables, content gap analysis, and cover differentiation strategies.
        </p>

        <form onSubmit={handleGeneratePdf} className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={reportNiche}
              onChange={(e) => setReportNiche(e.target.value)}
              placeholder="Enter niche topic for PDF dossier generation..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
          </button>
        </form>

        {downloadLink && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">PDF Report Generated Successfully!</span>
            <a
              href={downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all"
            >
              Open / Download PDF
            </a>
          </div>
        )}
      </div>

      {/* Historical Queries Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Historical Research Queries ({history.length})</span>
        </h3>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Search Query</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Marketplace</th>
                  <th className="py-2.5 px-3">Results Captured</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Reopen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-semibold text-white truncate max-w-xs">{h.query}</td>
                    <td className="py-2.5 px-3 text-slate-400">{h.query_type}</td>
                    <td className="py-2.5 px-3 text-slate-300">{h.marketplace}</td>
                    <td className="py-2.5 px-3 text-emerald-400">{h.results_count} items</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <Link
                        href={h.query_type === 'BOOK_SEARCH' ? `/books?q=${encodeURIComponent(h.query)}` : `/keywords?seed=${encodeURIComponent(h.query)}`}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                      >
                        Re-run →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-6 text-center">No search history recorded yet.</p>
        )}
      </div>
    </div>
  );
}
