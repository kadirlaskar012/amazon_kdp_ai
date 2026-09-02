'use client';

import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Trash2, Edit3, Save, BookOpen, Layers, Check, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNiche, setNewNiche] = useState('');
  const [newAudience, setNewAudience] = useState('Kids Ages 4-8');
  const [isLoading, setIsLoading] = useState(true);

  // Edit fields for selected project
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('RESEARCH');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjects();
      setProjects(res || []);
      if (res && res.length > 0 && !selectedProject) {
        setSelectedProject(res[0]);
        setNotes(res[0].notes || '');
        setStatus(res[0].status || 'RESEARCH');
      }
    } catch (e) {}
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.createProject({
        title: newTitle,
        niche: newNiche || newTitle,
        target_audience: newAudience,
      });
      setProjects([res, ...projects]);
      setSelectedProject(res);
      setNotes(res.notes || '');
      setStatus(res.status || 'RESEARCH');
      setIsCreating(false);
      setNewTitle('');
      setNewNiche('');
    } catch (e) {}
  };

  const handleUpdate = async () => {
    if (!selectedProject) return;
    setIsSaving(true);
    try {
      const res = await api.updateProject(selectedProject.id, {
        notes,
        status,
      });
      setSelectedProject(res);
      setProjects(projects.map((p) => (p.id === res.id ? res : p)));
    } catch (e) {}
    setIsSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project workspace?')) return;
    try {
      await api.deleteProject(id);
      const remaining = projects.filter((p) => p.id !== id);
      setProjects(remaining);
      setSelectedProject(remaining[0] || null);
    } catch (e) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Project Workspaces</h1>
            <StatusBadge status="OBSERVED" source="Local Database" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated local book workspaces storing research, target keywords, SEO drafts, and interior specs.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Dossier</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="glass-panel rounded-3xl p-6 border border-sky-500/30 space-y-4 bg-slate-900/90">
          <h3 className="text-sm font-bold text-white">Create New KDP Project Workspace</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Project Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Dinosaur Activity Book Vol 1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Target Niche</label>
              <input
                type="text"
                value={newNiche}
                onChange={(e) => setNewNiche(e.target.value)}
                placeholder="e.g. dinosaur coloring"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Target Audience</label>
              <input
                type="text"
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value)}
                placeholder="e.g. Kids 4-8"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="col-span-1 sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-sky-500 text-white font-bold"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List Column */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2 h-[600px] overflow-y-auto">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block mb-2">
            Your Local Projects ({projects.length})
          </span>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading projects...</div>
          ) : projects.length > 0 ? (
            projects.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProject(p);
                  setNotes(p.notes || '');
                  setStatus(p.status || 'RESEARCH');
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedProject?.id === p.id
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div>
                  <h4 className="font-bold text-xs text-white">{p.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.niche} • {p.target_audience}</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                  {p.status}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No projects created yet. Click &quot;New Project Dossier&quot; to begin.
            </div>
          )}
        </div>

        {/* Selected Project Dossier Editor */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
          {selectedProject ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-sky-400">Project Workspace #{selectedProject.id}</span>
                  <h2 className="text-xl font-bold text-white mt-1">{selectedProject.title}</h2>
                  <p className="text-xs text-slate-400">Niche: <b>{selectedProject.niche}</b> | Audience: <b>{selectedProject.target_audience}</b></p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium cursor-pointer"
                  >
                    <option value="RESEARCH">Phase: Research</option>
                    <option value="DRAFTING">Phase: Drafting</option>
                    <option value="READY_TO_PUBLISH">Phase: Ready to Publish</option>
                    <option value="PUBLISHED">Phase: Published</option>
                  </select>

                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Dossier'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(selectedProject.id)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Research Dossier Tabs / Notes */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 block">Project Research Notes, Interior Specs & Target Keywords</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record trim dimensions, bleed settings, selected keywords, competitor URLs, and publishing dates..."
                  className="w-full h-80 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:border-sky-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Last Modified: {new Date(selectedProject.updated_at).toLocaleString()}</span>
                <span className="text-emerald-400">Stored 100% Locally on PC</span>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-slate-400">
              Select or create a project workspace to manage its dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
