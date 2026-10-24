import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  category?: 'Health Records' | 'Medicine Intelligence' | 'Clinical Assistance' | 'Safety & Management';
  isSignature?: boolean;
  breadcrumbs?: { label: string; path?: string }[];
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  category,
  isSignature = false,
  breadcrumbs = [],
  primaryAction,
  secondaryAction,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-5 mb-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-2.5">
        <Link to="/" className="hover:text-blue-700 flex items-center transition">
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        {category && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-600 font-medium">{category}</span>
          </>
        )}
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {crumb.path ? (
              <Link to={crumb.path} className="hover:text-blue-700 transition">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-slate-700 font-semibold">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Main Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight">
              {title}
            </h1>
            {isSignature && (
              <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                <Sparkles className="w-3 h-3 mr-1 text-blue-700" />
                Signature Engine
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Button Slots */}
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2.5 shrink-0">
            {secondaryAction}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
