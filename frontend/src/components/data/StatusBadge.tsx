import React from 'react';
import { ShieldCheck, Database, Clock, Eye, Calculator, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { DataStatusBadge } from '@/lib/types';

interface StatusBadgeProps {
  status: string;
  source?: string;
  retrievedAt?: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  source,
  retrievedAt,
  className = '',
  showIcon = true,
}) => {
  const normStatus = (status || 'UNAVAILABLE').toUpperCase().replace(' ', '_');

  const configs: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    LIVE: {
      label: 'LIVE',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: ShieldCheck,
    },
    CACHED: {
      label: 'CACHED',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      icon: Database,
    },
    STALE: {
      label: 'STALE',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      icon: Clock,
    },
    OBSERVED: {
      label: 'OBSERVED',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      icon: Eye,
    },
    CALCULATED: {
      label: 'CALCULATED',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      icon: Calculator,
    },
    ESTIMATED: {
      label: 'ESTIMATED',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      icon: HelpCircle,
    },
    AI_ANALYSIS: {
      label: 'AI ANALYSIS',
      bg: 'bg-fuchsia-500/10',
      text: 'text-fuchsia-400',
      border: 'border-fuchsia-500/20',
      icon: Sparkles,
    },
    UNAVAILABLE: {
      label: 'UNAVAILABLE',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      icon: AlertCircle,
    },
  };

  const config = configs[normStatus] || configs.UNAVAILABLE;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
      title={source ? `Source: ${source}${retrievedAt ? ` | Retrieved: ${new Date(retrievedAt).toLocaleTimeString()}` : ''}` : undefined}
    >
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
