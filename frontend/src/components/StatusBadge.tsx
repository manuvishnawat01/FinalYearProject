import React from 'react';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, Cpu } from 'lucide-react';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status = 'unverified', size = 'sm' }) => {
  const s = (status || '').toLowerCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = <Clock className="w-3.5 h-3.5 mr-1" />;
  let label = status;

  if (s.includes('confirmed') || s.includes('verified')) {
    bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700 shrink-0" />;
    label = 'Confirmed Observation';
  } else if (s.includes('unverified') || s.includes('extracted') || s.includes('candidate')) {
    bg = 'bg-amber-50 text-amber-800 border-amber-200';
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-700 shrink-0" />;
    label = 'Extracted (Unverified)';
  } else if (s.includes('clinician')) {
    bg = 'bg-blue-50 text-blue-800 border-blue-200';
    icon = <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-700 shrink-0" />;
    label = 'Clinician Recorded';
  } else if (s.includes('ai') || s.includes('generated') || s.includes('translated')) {
    bg = 'bg-purple-50 text-purple-800 border-purple-200';
    icon = <Cpu className="w-3.5 h-3.5 mr-1 text-purple-700 shrink-0" />;
    label = 'AI Interpretation';
  } else if (s.includes('patient')) {
    bg = 'bg-teal-50 text-teal-800 border-teal-200';
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-teal-700 shrink-0" />;
    label = 'Patient Logged';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border shadow-2xs whitespace-nowrap ${bg} ${px}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
