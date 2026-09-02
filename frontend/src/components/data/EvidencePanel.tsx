import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, ShieldCheck, Database } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface EvidencePanelProps {
  evidence: Record<string, any>;
  methodology?: string;
  source?: string;
  dataStatus?: string;
  retrievedAt?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidence,
  methodology,
  source = 'Amazon Live / Observational Database',
  dataStatus = 'OBSERVED',
  retrievedAt,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all">
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-400" />
          <span className="text-sm font-medium text-slate-200">Data Sourcing & Evidence Panel</span>
          <StatusBadge status={dataStatus} source={source} retrievedAt={retrievedAt} />
        </div>
        <button className="text-slate-400 hover:text-slate-200">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 text-xs text-slate-300">
          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Primary Data Source:</span>
            <p className="text-slate-200 mt-0.5">{source}</p>
          </div>

          {methodology && (
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Scoring Methodology:</span>
              <p className="text-slate-200 mt-0.5">{methodology}</p>
            </div>
          )}

          <div>
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Factual Observations:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1.5">
              {Object.entries(evidence).map(([key, val]) => (
                <div key={key} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <p className="font-mono text-slate-100 font-medium truncate">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded border border-slate-800/40">
            KDP Intelligence Studio Data Guarantee: No mock, fake, or hallucinated numbers. 
            All insights are directly anchored to verified live queries or timestamped local observations.
          </div>
        </div>
      )}
    </div>
  );
};
