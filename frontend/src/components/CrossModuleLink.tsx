import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  to: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'amber' | 'slate';
  size?: 'xs' | 'sm';
}

export const CrossModuleLink: React.FC<Props> = ({
  to,
  label,
  variant = 'secondary',
  size = 'xs',
}) => {
  let style = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';

  if (variant === 'primary') {
    style = 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200';
  } else if (variant === 'secondary') {
    style = 'bg-teal-50 text-teal-800 hover:bg-teal-100 border-teal-200';
  } else if (variant === 'amber') {
    style = 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-300';
  }

  const px = size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs';

  return (
    <Link
      to={to}
      className={`inline-flex items-center font-semibold rounded-lg border transition shadow-2xs ${style} ${px}`}
    >
      <span>{label}</span>
      <ArrowUpRight className="w-3 h-3 ml-1" />
    </Link>
  );
};

export default CrossModuleLink;
