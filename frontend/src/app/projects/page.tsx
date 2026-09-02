'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, Plus, Trash2, Edit3, Save, BookOpen, Layers, 
  Check, Loader2, CheckCircle2, Clock, PlayCircle, ExternalLink, 
  Copy, KeyRound, Sparkles, Trophy, ArrowRight, FileText, 
  Info, Filter, Search, RotateCcw, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'DONE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status update tracking
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Modal / Drawer for full Blueprint
  const [modalProject, setModalProject] = useState<Project | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Notes editing state
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Manual project creation modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [newMarketplace, setNewMarketplace] = useState('US');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjects();
      setProjects(res || []);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (projectId: number, newStatus: string) => {
    setUpdatingId(projectId);
    try {
      const updated = await api.updateProjectStatus(projectId, newStatus);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: updated.status } : p));
      if (modalProject && modalProject.id === projectId) {
        setModalProject(prev => prev ? { ...prev, status: updated.status } : null);
      }
    } catch (e) {
      console.error('Failed to update project status:', e);
    }
    setUpdatingId(null);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveNotes = async (projectId: number) => {
    setIsSavingNotes(true);
    try {
      const updated = await api.updateProject(projectId, { notes: currentNotes });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, notes: updated.notes } : p));
      setEditingNotesId(null);
    } catch (e) {
      console.error('Failed to save notes:', e);
    }
    setIsSavingNotes(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (modalProject?.id === id) setModalProject(null);
    } catch (e) {
      console.error('Failed to delete project:', e);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newNiche.trim()) return;
    setIsCreating(true);
    try {
      const created = await api.createProject({
        title: newTitle,
        niche: newNiche,
        marketplace: newMarketplace,
        status: 'PENDING',
        notes: 'Manually created upcoming project.'
      });
      setProjects([created, ...projects]);
      setIsCreateOpen(false);
      setNewTitle('');
      setNewNiche('');
    } catch (e) {
      console.error('Failed to create manual project:', e);
    }
    setIsCreating(false);
  };

  // Filtered list
  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (statusFilter !== 'ALL') {
      list = list.filter(p => {
        const s = (p.status || 'PENDING').toUpperCase();
        if (statusFilter === 'DONE') return s === 'DONE' || s === 'PUBLISHED' || s === 'READY_TO_PUBLISH';
        if (statusFilter === 'IN_PROGRESS') return s === 'IN_PROGRESS' || s === 'DRAFTING';
        if (statusFilter === 'PENDING') return s === 'PENDING' || s === 'RESEARCH' || s === 'UPCOMING';
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.niche.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [projects, statusFilter, searchQuery]);

  // Status Counts
  const counts = useMemo(() => {
    const total = projects.length;
    let pending = 0;
    let inProgress = 0;
    let done = 0;

    projects.forEach(p => {
      const s = (p.status || 'PENDING').toUpperCase();
      if (s === 'DONE' || s === 'PUBLISHED' || s === 'READY_TO_PUBLISH') done++;
      else if (s === 'IN_PROGRESS' || s === 'DRAFTING') inProgress++;
      else pending++;
    });

    return { total, pending, inProgress, done };
  }, [projects]);

  // Helper to parse saved blueprint
  const parseBlueprint = (p: Project) => {
    try {
      if (p.seo_data_json && p.seo_data_json !== '{}') {
        return JSON.parse(p.seo_data_json);
      }
    } catch (e) {}
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* HEADER WITH STATS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Upcoming KDP Projects</h1>
            <StatusBadge status="LIVE" source="Cloud Database" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track saved book niches, manage workflow status (Pending, In Progress, Done), and inspect full publishing blueprints anytime.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-all"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Research New Niche</span>
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Project</span>
          </button>
        </div>
      </div>

      {/* METRIC COUNTER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`glass-panel rounded-2xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'ALL' ? 'border-amber-400/50 bg-amber-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">All Projects</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">{counts.total}</span>
            <span className="text-xs text-slate-400">total</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          className={`glass-panel rounded-2xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'PENDING' ? 'border-amber-400/50 bg-amber-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">⏳ Upcoming / Pending</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">{counts.pending}</span>
            <span className="text-xs text-slate-400">ready to start</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`glass-panel rounded-2xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'IN_PROGRESS' ? 'border-sky-400/50 bg-sky-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-sky-400 font-bold">🚀 In Progress</span>
            <PlayCircle className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-sky-400 font-mono">{counts.inProgress}</span>
            <span className="text-xs text-slate-400">drafting / cover</span>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('DONE')}
          className={`glass-panel rounded-2xl p-4 border cursor-pointer transition-all ${
            statusFilter === 'DONE' ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">✅ Completed / Done</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">{counts.done}</span>
            <span className="text-xs text-slate-400">published</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="glass-panel rounded-2xl p-3 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: `All (${counts.total})` },
            { id: 'PENDING', label: `⏳ Pending (${counts.pending})` },
            { id: 'IN_PROGRESS', label: `🚀 In Progress (${counts.inProgress})` },
            { id: 'DONE', label: `✅ Done (${counts.done})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved projects..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* PROJECTS LIST */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your upcoming projects from database...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const bp = parseBlueprint(project);
            const currentStatus = (project.status || 'PENDING').toUpperCase();
            const isDone = currentStatus === 'DONE' || currentStatus === 'PUBLISHED' || currentStatus === 'READY_TO_PUBLISH';
            const isInProgress = currentStatus === 'IN_PROGRESS' || currentStatus === 'DRAFTING';
            const isPending = !isDone && !isInProgress;

            return (
              <div 
                key={project.id}
                className={`glass-panel rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                  isDone 
                    ? 'border-emerald-500/30 bg-emerald-950/10' 
                    : isInProgress 
                    ? 'border-sky-500/30 bg-sky-950/10' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                }`}
              >
                {/* TOP ROW: Niche badge, Marketplace, and Delete */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1 border border-slate-700">
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        <span>{project.niche}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                        {project.marketplace || 'US'}
                      </span>
                      {bp?.feasibility_verdict && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bp.feasibility_verdict === 'EASY_TO_RANK'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {bp.feasibility_title || bp.feasibility_verdict}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* TITLE */}
                  <h3 className={`text-sm font-extrabold line-clamp-2 ${isDone ? 'text-emerald-300' : 'text-white'}`}>
                    {project.title}
                  </h3>

                  {/* METRICS ROW (if blueprint exists) */}
                  {bp && (
                    <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Sweetspot Price</span>
                        <span className="font-bold text-emerald-400">{bp.recommended_price_sweetspot || '$7.99'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Review Barrier</span>
                        <span className="font-bold text-amber-400">{bp.avg_reviews ? bp.avg_reviews.toLocaleString() : 'Low'} avg</span>
                      </div>
                    </div>
                  )}

                  {/* USER NOTES PREVIEW */}
                  <div className="mt-3">
                    {editingNotesId === project.id ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={currentNotes}
                          onChange={(e) => setCurrentNotes(e.target.value)}
                          placeholder="Add private drafting notes, target page count, Canva link..."
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(project.id)}
                            disabled={isSavingNotes}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setEditingNotesId(project.id);
                          setCurrentNotes(project.notes || '');
                        }}
                        className="cursor-pointer group flex items-start gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-950/30 p-2 rounded-xl border border-slate-800/40"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 italic">
                          {project.notes || 'Click to add personal notes or checklist...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM SECTION: 1-CLICK STATUS WORKFLOW */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Project Status (প্রজেক্টের অবস্থা):
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => handleStatusChange(project.id, 'PENDING')}
                        disabled={updatingId === project.id}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          isPending
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(project.id, 'IN_PROGRESS')}
                        disabled={updatingId === project.id}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          isInProgress
                            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Working</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(project.id, 'DONE')}
                        disabled={updatingId === project.id}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Done ✅</span>
                      </button>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalProject(project)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span>{bp ? 'View Blueprint Data' : 'View Project'}</span>
                    </button>

                    <Link
                      href={`/?q=${encodeURIComponent(project.niche)}`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-all shrink-0"
                      title="Re-run Master Research on Amazon"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY STATE */
        <div className="py-20 text-center space-y-4 glass-panel rounded-3xl border border-slate-800 max-w-lg mx-auto p-8">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Upcoming Projects Found</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {statusFilter !== 'ALL'
                ? `There are currently no projects marked as "${statusFilter}". Try switching tabs or research a new book.`
                : 'Whenever you search a keyword on the Master Station, click "📌 Add to Upcoming Projects" to save all competitors, keywords, pricing, and ready-to-publish SEO.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Search className="w-4 h-4" />
              <span>Go to Master Research Station</span>
            </Link>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Create Blank Project
            </button>
          </div>
        </div>
      )}

      {/* FULL BLUEPRINT MODAL */}
      {modalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-extrabold text-white line-clamp-1">{modalProject.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>Niche: <b>{modalProject.niche}</b></span>
                    <span>•</span>
                    <span>Marketplace: <b>{modalProject.marketplace}</b></span>
                    <span>•</span>
                    <span className="capitalize">Status: <b>{modalProject.status}</b></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL CONTENT BODY */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {(() => {
                const bp = parseBlueprint(modalProject);
                if (!bp) {
                  return (
                    <div className="py-12 text-center space-y-2">
                      <p className="font-bold text-white">No detailed blueprint attached.</p>
                      <p className="text-slate-400">This project was manually created or has no saved snapshot.</p>
                      <Link
                        href={`/?q=${encodeURIComponent(modalProject.niche)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                      >
                        <span>Run Full Research Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* KEY METRICS SUMMARY */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Rank Feasibility</span>
                        <span className="text-sm font-extrabold text-emerald-400">{bp.feasibility_title || bp.feasibility_verdict}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sweetspot Price</span>
                        <span className="text-sm font-extrabold text-white">{bp.recommended_price_sweetspot}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Competitor Reviews</span>
                        <span className="text-sm font-extrabold text-amber-400">{bp.avg_reviews ? bp.avg_reviews.toLocaleString() : '0'} avg</span>
                      </div>
                    </div>

                    {/* SEO TITLE & SUBTITLE */}
                    <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-sky-400" />
                          <span>Generated SEO Title Package</span>
                        </span>
                        <button
                          onClick={() => handleCopy(`${bp.seo_title} - ${bp.seo_subtitle}`, 'full_title')}
                          className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                        >
                          {copiedKey === 'full_title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'full_title' ? 'Copied' : 'Copy Title + Subtitle'}</span>
                        </button>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                        <p className="text-xs font-bold text-white">{bp.seo_title}</p>
                        <p className="text-[11px] text-slate-300">{bp.seo_subtitle}</p>
                      </div>
                    </div>

                    {/* 7 KDP BACKEND KEYWORDS */}
                    {bp.backend_boxes && bp.backend_boxes.length > 0 && (
                      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <KeyRound className="w-4 h-4 text-amber-400" />
                            <span>7 KDP Backend Search Slots (249 Bytes Each)</span>
                          </span>
                          <button
                            onClick={() => handleCopy(bp.backend_boxes.join('\n'), 'all_boxes')}
                            className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                          >
                            {copiedKey === 'all_boxes' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'all_boxes' ? 'Copied All' : 'Copy All 7 Slots'}</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {bp.backend_boxes.map((boxText: string, i: number) => (
                            <div key={i} className="flex items-center justify-between gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                              <span className="text-slate-400 font-mono text-[10px] w-6 shrink-0">#{i + 1}</span>
                              <span className="font-mono text-slate-200 flex-1 truncate">{boxText}</span>
                              <button
                                onClick={() => handleCopy(boxText, `box_${i}`)}
                                className="text-slate-400 hover:text-white p-1"
                              >
                                {copiedKey === `box_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* READY-TO-USE HTML BOOK DESCRIPTION */}
                    {bp.book_description && (
                      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">KDP HTML Book Description</span>
                          <button
                            onClick={() => handleCopy(bp.book_description, 'desc')}
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            {copiedKey === 'desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'desc' ? 'Copied HTML' : 'Copy Description'}</span>
                          </button>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                          {bp.book_description}
                        </div>
                      </div>
                    )}

                    {/* TOP COMPETITOR BOOKS */}
                    {bp.books && bp.books.length > 0 && (
                      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-white block">Top Sampled Amazon Competitors</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                          {bp.books.slice(0, 6).map((b: any, idx: number) => (
                            <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
                              {b.image_url && (
                                <img src={b.image_url} alt="" className="w-8 h-10 object-cover rounded shrink-0 bg-slate-900" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-white text-[11px] truncate">{b.title}</p>
                                <p className="text-[10px] text-slate-400">
                                  {b.price ? `$${b.price.toFixed(2)}` : 'N/A'} • {b.current_review_count || 0} reviews
                                </p>
                              </div>
                              {b.amazon_url && (
                                <a href={b.amazon_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white p-1">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created on: {new Date(modalProject.created_at).toLocaleDateString()}
              </span>
              <button
                onClick={() => setModalProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MANUAL PROJECT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Custom Project</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Project Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Dinosaur Activity Book Volume 1"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Niche / Primary Keyword</label>
                <input
                  type="text"
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                  placeholder="e.g. dinosaur coloring book"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Target Marketplace</label>
                <select
                  value={newMarketplace}
                  onChange={(e) => setNewMarketplace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                >
                  <option value="US">United States (Amazon.com)</option>
                  <option value="GLOBAL">Worldwide Global Matrix</option>
                  <option value="UK">United Kingdom (.co.uk)</option>
                  <option value="DE">Germany (.de)</option>
                  <option value="CA">Canada (.ca)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
