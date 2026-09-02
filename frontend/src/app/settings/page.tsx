'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, Database, Cpu, Play, Download, Upload, CheckCircle2, AlertCircle, Loader2, Save, Sparkles } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [associateTag, setAssociateTag] = useState('');
  const [defaultMarketplace, setDefaultMarketplace] = useState('US');
  
  // AI Settings
  const [aiProvider, setAiProvider] = useState('openai');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3:latest');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.groq.com/openai/v1');
  const [openaiModel, setOpenaiModel] = useState('llama-3.3-70b-versatile');

  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [backups, setBackups] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadBackups();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await api.getSettings();
      setAccessKey(s.amazon_access_key || '');
      setSecretKey(s.amazon_secret_key || '');
      setAssociateTag(s.amazon_associate_tag || '');
      setDefaultMarketplace(s.amazon_default_marketplace || 'US');
      setAiProvider(s.ai_provider || 'openai');
      setOllamaUrl(s.ollama_base_url || 'http://localhost:11434');
      setOllamaModel(s.ollama_model || 'llama3:latest');
      setOpenaiKey(s.openai_api_key || '');
      setOpenaiBaseUrl(s.openai_base_url || 'https://api.groq.com/openai/v1');
      setOpenaiModel(s.openai_model || 'llama-3.3-70b-versatile');
    } catch (e) {}
  };

  const loadBackups = async () => {
    try {
      const res = await api.listBackups();
      setBackups(res || []);
    } catch (e) {}
  };

  const applyPreset = (type: 'groq' | 'openai' | 'gemini' | 'openrouter' | 'ollama') => {
    if (type === 'groq') {
      setAiProvider('openai');
      setOpenaiBaseUrl('https://api.groq.com/openai/v1');
      setOpenaiModel('llama-3.3-70b-versatile');
    } else if (type === 'openai') {
      setAiProvider('openai');
      setOpenaiBaseUrl('https://api.openai.com/v1');
      setOpenaiModel('gpt-4o-mini');
    } else if (type === 'gemini') {
      setAiProvider('openai');
      setOpenaiBaseUrl('https://generativelanguage.googleapis.com/v1beta/openai/');
      setOpenaiModel('gemini-1.5-flash');
    } else if (type === 'openrouter') {
      setAiProvider('openai');
      setOpenaiBaseUrl('https://openrouter.ai/api/v1');
      setOpenaiModel('meta-llama/llama-3.3-70b-instruct');
    } else if (type === 'ollama') {
      setAiProvider('ollama');
      setOllamaUrl('http://localhost:11434');
      setOllamaModel('llama3:latest');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        amazon_access_key: accessKey || undefined,
        amazon_secret_key: secretKey || undefined,
        amazon_associate_tag: associateTag || undefined,
        amazon_default_marketplace: defaultMarketplace,
        ai_provider: aiProvider,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        openai_api_key: openaiKey || undefined,
        openai_base_url: openaiBaseUrl || undefined,
        openai_model: openaiModel,
        use_postgres: true,
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {}
    setIsSaving(false);
  };

  const runAllDiagnostics = async () => {
    setIsTesting(true);
    try {
      const res = await api.testAllConnections();
      setDiagnostics(res || []);
    } catch (e) {}
    setIsTesting(false);
  };

  const handleCreateBackup = async () => {
    try {
      await api.triggerBackup();
      loadBackups();
    } catch (e) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-400" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Settings & Diagnostics</h1>
            <StatusBadge status="LIVE" source="Configuration Manager" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure external connectors, local AI parameters, verify data source health, and trigger database backups.
          </p>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Data Source Health & Diagnostics Box */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Data Source Health & Pipeline Monitor</span>
            </h2>
            <p className="text-xs text-slate-400">Verifies latency and connectivity across all data pipelines.</p>
          </div>

          <button
            onClick={runAllDiagnostics}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Test All Connections</span>
          </button>
        </div>

        {diagnostics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {diagnostics.map((d, idx) => (
              <div key={idx} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{d.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    d.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' :
                    d.status === 'AUTH_REQUIRED' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-rose-500/20 text-rose-400'
                  }`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{d.message}</p>
                {d.latency_ms && (
                  <span className="text-[10px] text-slate-400 font-mono block">Latency: {d.latency_ms} ms</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800/60">
            Click &quot;Test All Connections&quot; to ping live Amazon, Google Trends, OpenLibrary, and AI endpoints.
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Local & Cloud AI Engine */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">AI Intelligence Engine Configuration</h3>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('groq')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-all"
              >
                ⚡ Groq (Free & Ultra Fast)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('openai')}
                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-semibold transition-all"
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => applyPreset('gemini')}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition-all"
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ollama')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all"
              >
                Local Ollama
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <label className="text-slate-400 block mb-1 font-semibold">Active AI Mode</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
              >
                <option value="openai">Cloud API (Groq / OpenAI / Gemini / OpenRouter)</option>
                <option value="ollama">Local Ollama (Offline on Windows PC)</option>
              </select>

              {aiProvider === 'openai' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1">API Key</label>
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="e.g. gsk_... (Groq) or sk-... (OpenAI / Gemini)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Base Endpoint URL</label>
                    <input
                      type="text"
                      value={openaiBaseUrl}
                      onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                      placeholder="https://api.groq.com/openai/v1"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Model Name</label>
                    <input
                      type="text"
                      value={openaiModel}
                      onChange={(e) => setOpenaiModel(e.target.value)}
                      placeholder="llama-3.3-70b-versatile"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {aiProvider === 'ollama' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Ollama Base URL</label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Installed Ollama Model</label>
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs text-slate-300">
              <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>How to Get Instant 100% Free AI:</span>
              </span>
              <p>
                <b>Recommended (Fastest & Free):</b> Click <b>&quot;⚡ Groq&quot;</b> above, get a free API key instantly at <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">groq.com</a>, and paste it.
              </p>
              <p>
                <b>Local Offline:</b> Install Ollama on Windows from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline">ollama.com</a> and run <code>ollama run llama3</code>.
              </p>
              <p className="text-slate-400 text-[11px] pt-1">
                * Even with zero keys, the built-in deterministic heuristic engine automatically analyzes titles, keywords, and listing health.
              </p>
            </div>
          </div>
        </div>

        {/* Amazon Credentials */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Official Amazon PA-API Credentials (Optional)</h3>
          </div>
          <p className="text-slate-400">
            If left blank, the application will automatically route requests through the un-mocked Amazon Live search connector.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">Access Key ID</label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="AKIA..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Secret Access Key</label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Associate Partner Tag</label>
              <input
                type="text"
                value={associateTag}
                onChange={(e) => setAssociateTag(e.target.value)}
                placeholder="mytag-20"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Database & Supabase Cloud Status */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Primary Cloud Database: Supabase PostgreSQL (Active)</span>
              </h3>
              <p className="text-xs text-slate-400">Host: <code>aws-0-ap-southeast-1.pooler.supabase.com:5432</code> (16 Public Schema Tables).</p>
            </div>

            <button
              type="button"
              onClick={handleCreateBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-slate-700 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Create Backup Snapshot</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
