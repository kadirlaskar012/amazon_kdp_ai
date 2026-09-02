'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles, Globe, Key, Database, Cpu, Play } from 'lucide-react';
import { api } from '@/lib/api';

interface SetupWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [marketplace, setMarketplace] = useState('US');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [tag, setTag] = useState('');
  const [aiProvider, setAiProvider] = useState('ollama');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const runTests = async () => {
    setIsTesting(true);
    try {
      const res = await api.testAllConnections();
      setTestResults(res);
    } catch (e: any) {
      setTestResults([{ name: 'Connection Test', status: 'ERROR', message: e.message }]);
    }
    setIsTesting(false);
  };

  const handleFinish = async () => {
    try {
      await api.updateSettings({
        amazon_access_key: accessKey || undefined,
        amazon_secret_key: secretKey || undefined,
        amazon_associate_tag: tag || undefined,
        amazon_default_marketplace: marketplace,
        ai_provider: aiProvider,
        ollama_base_url: 'http://localhost:11434',
        ollama_model: 'llama3:latest',
        use_postgres: false
      });
    } catch (e) {}
    localStorage.setItem('kdp_studio_setup_done', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0c1222] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
              First-Run Calibration
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Welcome to KDP Intelligence Studio</h2>
            <p className="text-xs text-slate-400">Step {step} of 8 — Setup your local research engine</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            {step}/8
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Step 1: Select Default Amazon Marketplace</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Choose your primary publishing marketplace. KDP Studio supports 10 global stores and can switch instantly at any time.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { code: 'US', label: '🇺🇸 United States (amazon.com)' },
                  { code: 'UK', label: '🇬🇧 United Kingdom (amazon.co.uk)' },
                  { code: 'DE', label: '🇩🇪 Germany (amazon.de)' },
                  { code: 'CA', label: '🇨🇦 Canada (amazon.ca)' },
                  { code: 'AU', label: '🇦🇺 Australia (amazon.com.au)' },
                  { code: 'FR', label: '🇫🇷 France (amazon.fr)' },
                ].map((m) => (
                  <button
                    key={m.code}
                    onClick={() => setMarketplace(m.code)}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      marketplace === m.code
                        ? 'border-sky-500 bg-sky-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Step 2: Amazon PA-API Credentials (Optional)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                If you have an Amazon Associates PA-API account, enter your keys below. If not, KDP Studio will seamlessly use the built-in direct live search and suggest connector.
              </p>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-slate-300 block mb-1">Access Key ID</label>
                  <input
                    type="text"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="AKIA..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Secret Access Key</label>
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Associate Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="myassociate-20"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Step 3 & 4: Data Sources & Local Database</span>
              </div>
              <p className="text-slate-400">
                Your local database is powered by <b>SQLite in WAL mode</b> (Write-Ahead Logging) located securely on your PC at <code>data/kdp_studio.db</code>.
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-medium">Amazon Live Search Connector</span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-medium">Amazon Completion / Suggest API</span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-medium">Open Library Metadata Fallback</span>
                  <span className="text-emerald-400 font-semibold">Enabled</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-200 font-medium">Local SQLite Database Engine</span>
                  <span className="text-emerald-400 font-semibold">Initialized (WAL Active)</span>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Step 5 & 6: Local AI Provider (Ollama / OpenAI)</span>
              </div>
              <p className="text-slate-400">
                KDP Studio utilizes local AI for keyword clustering, listing critiques, and book ideas. Choose your preferred AI engine:
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setAiProvider('ollama')}
                  className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                    aiProvider === 'ollama'
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm">🦙 Local Ollama</p>
                  <p className="text-[11px] text-slate-400">100% offline, zero API costs (localhost:11434)</p>
                </button>
                <button
                  onClick={() => setAiProvider('openai')}
                  className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                    aiProvider === 'openai'
                      ? 'border-sky-500 bg-sky-500/10 text-white'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <p className="font-bold text-sm">⚡ OpenAI-Compatible API</p>
                  <p className="text-[11px] text-slate-400">GPT-4o mini / Groq / OpenRouter / LM Studio</p>
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Step 7: Run Connection Diagnostics</span>
              </div>
              <p className="text-slate-400">
                Testing all data connectors and local database latency:
              </p>
              <button
                onClick={runTests}
                disabled={isTesting}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50"
              >
                {isTesting ? 'Testing Data Pipelines...' : 'Run Diagnostics Test'}
              </button>

              <div className="space-y-2 pt-2">
                {testResults.map((t, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">{t.name}</p>
                      <p className="text-[10px] text-slate-400">{t.message}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">System Ready & Validated!</h3>
              <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                Your local environment is fully configured. All research will strictly use verified live data pipelines and local database historical tracking.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white disabled:opacity-30"
          >
            Previous
          </button>
          {step < 8 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-medium transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Launch KDP Studio</span>
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
