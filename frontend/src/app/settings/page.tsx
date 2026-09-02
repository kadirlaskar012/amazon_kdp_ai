'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, Database, Cpu, Play, Download, Upload, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { StatusBadge } from '@/components/data/StatusBadge';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [associateTag, setAssociateTag] = useState('');
  const [defaultMarketplace, setDefaultMarketplace] = useState('US');
  const [aiProvider, setAiProvider] = useState('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3:latest');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('https://api.openai.com/v1');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');

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
      setAiProvider(s.ai_provider || 'ollama');
      setOllamaUrl(s.ollama_base_url || 'http://localhost:11434');
      setOllamaModel(s.ollama_model || 'llama3:latest');
      setOpenaiKey(s.openai_api_key || '');
      setOpenaiBaseUrl(s.openai_base_url || 'https://api.openai.com/v1');
      setOpenaiModel(s.openai_model || 'gpt-4o-mini');
    } catch (e) {}
  };

  const loadBackups = async () => {
    try {
      const res = await api.listBackups();
      setBackups(res || []);
    } catch (e) {}
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
        use_postgres: false,
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

        {/* Local AI Engine */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">AI Engine Configuration (Local Ollama / OpenAI)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-slate-400 block mb-1">Active AI Provider</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white cursor-pointer"
              >
                <option value="ollama">Local Ollama (Offline / Zero Cost)</option>
                <option value="openai">OpenAI / Compatible Endpoint</option>
              </select>

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

              {aiProvider === 'openai' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1">OpenAI API Key</label>
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Base URL (For LM Studio, Groq, OpenRouter)</label>
                    <input
                      type="text"
                      value={openaiBaseUrl}
                      onChange={(e) => setOpenaiBaseUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <span className="font-bold text-white text-xs block">AI Safety & Integrity Guardrails:</span>
              <p>• AI is strictly confined to analytical reasoning, classification, and concept synthesis.</p>
              <p>• Raw Amazon facts, BSR numbers, and prices are NEVER fabricated or hallucinatory.</p>
              <p>• If no AI model is active, the engine falls back to deterministic heuristic rules.</p>
            </div>
          </div>
        </div>

        {/* Database & Backups */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Local Database & Backup Management</span>
              </h3>
              <p className="text-xs text-slate-400">Primary storage: <code>data/kdp_studio.db</code> (SQLite in WAL mode).</p>
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

          {backups.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Available Database Backups:</span>
              {backups.slice(0, 3).map((b, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-200">{b.filename} ({b.size_kb} KB)</span>
                  <span className="text-slate-400">{new Date(b.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
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
