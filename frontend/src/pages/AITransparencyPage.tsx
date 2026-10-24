import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  ShieldAlert, 
  Search, 
  ExternalLink, 
  Cpu, 
  Layers, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Clock,
  Sparkles,
  Link2,
  X
} from 'lucide-react';

export const AITransparencyPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  // Interactive URL Source Validation State
  const [testUrl, setTestUrl] = useState('');
  const [urlValidationResult, setUrlValidationResult] = useState<any | null>(null);
  const [urlValidating, setUrlValidating] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getProvenanceLogs(moduleFilter || undefined);
      setLogs(data);
      if (data.length > 0 && !selectedLog) {
        setSelectedLog(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load AI provenance logs');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrl.trim()) return;

    setUrlValidating(true);
    setUrlValidationResult(null);

    try {
      const result = await api.validateSourceUrl(testUrl.trim());
      setUrlValidationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to validate source URL');
    } finally {
      setUrlValidating(false);
    }
  };

  const getUncertaintyColor = (val: number) => {
    if (val >= 0.5) return 'bg-rose-500';
    if (val >= 0.25) return 'bg-amber-500';
    return 'bg-emerald-600';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Sources & Activity"
        description="Auditable prompt lineage, models used, specific patient records considered, and 4-dimensional uncertainty decomposition to prevent blind reliance on machine learning."
        category="Safety & Management"
        isSignature={true}
        breadcrumbs={[{ label: 'AI Sources & Activity' }]}
        secondaryAction={
          <CrossModuleLink to="/translator" label="Medical Report Explainer" variant="secondary" size="sm" />
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-rose-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Interactive Citation Domain Verifier */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-teal-700" />
              Trusted Medical Citation Validator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify if an external URL originates from a recognized authority (NIH, CDC, WHO, FDA, PubMed, etc.)
            </p>
          </div>
        </div>

        <form onSubmit={handleValidateUrl} className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            placeholder="e.g., https://pubmed.ncbi.nlm.nih.gov/31234567/ or https://www.fda.gov/drugs"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={urlValidating}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition shadow-xs"
          >
            {urlValidating ? 'Checking Domain...' : 'Verify Source Trust'}
          </button>
        </form>

        {urlValidationResult && (
          <div className={`mt-3 p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
            urlValidationResult.is_trusted
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            {urlValidationResult.is_trusted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold">
                {urlValidationResult.is_trusted ? 'Verified Trusted Medical Source' : 'Untrusted or Unverified Domain'}:
              </span>{' '}
              {urlValidationResult.message}
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Evaluated URL: {urlValidationResult.url}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column View: Provenance Logs vs 4D Uncertainty Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Provenance Records Filter & List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              AI Decision Logs ({logs.length})
            </h2>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              <option value="">All Modules</option>
              <option value="report_translator">Report Translator</option>
              <option value="medicine_salts">Medicine Salt Engine</option>
              <option value="trends_warning">Trends & Early Warning</option>
              <option value="symptom_correlator">Symptom Correlator</option>
              <option value="doctor_visit">Doctor Visit Prep</option>
            </select>
          </div>

          {logs.length === 0 && !loading && (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
              <Cpu className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              No AI provenance records logged for this filter.
            </div>
          )}

          <div className="space-y-2">
            {logs.map((log) => {
              const isSelected = selectedLog?.id === log.id;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                        {log.module_name.replace(/_/g, ' ')}
                      </span>
                      <h3 className="font-bold text-blue-950 text-xs mt-1 line-clamp-1">
                        {log.request_context}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      v{log.prompt_version}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    <span className="ml-auto text-slate-600 font-mono text-[10px]">
                      {log.model_identifier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 4-Dimensional Uncertainty Decomposition & Auditable Evidence (7 cols) */}
        <div className="lg:col-span-7">
          {!selectedLog ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              Select a decision record from the left to view complete 4D uncertainty decomposition.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Provenance Trace #{selectedLog.id}
                    </span>
                    <h2 className="text-sm font-bold text-blue-950 mt-0.5">
                      {selectedLog.request_context}
                    </h2>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 font-mono">
                    Model: {selectedLog.model_identifier}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Prompt Version</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedLog.prompt_version}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Clinical Validation Status</span>
                    <span className="font-semibold text-blue-800 capitalize">{selectedLog.validation_status}</span>
                  </div>
                </div>
              </div>

              {/* 4-Dimensional Uncertainty Decomposition Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Layers className="h-4 w-4 text-blue-700" />
                  4-Dimensional Uncertainty Decomposition
                </h3>

                {/* 1. Extraction Uncertainty */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">1. Document Extraction Uncertainty (Scan / OCR Quality)</span>
                    <span className="font-mono font-bold text-blue-950">
                      {(selectedLog.extraction_uncertainty * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getUncertaintyColor(selectedLog.extraction_uncertainty)}`} 
                      style={{ width: `${Math.max(5, selectedLog.extraction_uncertainty * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reflects input OCR quality, handwriting clarity, or token extraction confidence.
                  </p>
                </div>

                {/* 2. Identity Uncertainty */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">2. Entity & Salt Identity Uncertainty</span>
                    <span className="font-mono font-bold text-blue-950">
                      {(selectedLog.identity_uncertainty * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getUncertaintyColor(selectedLog.identity_uncertainty)}`} 
                      style={{ width: `${Math.max(5, selectedLog.identity_uncertainty * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Confidence matching brand names to standardized pharmaceutical active ingredients.
                  </p>
                </div>

                {/* 3. Evidence Uncertainty */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">3. Literature Evidence Uncertainty</span>
                    <span className="font-mono font-bold text-blue-950">
                      {(selectedLog.evidence_uncertainty * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getUncertaintyColor(selectedLog.evidence_uncertainty)}`} 
                      style={{ width: `${Math.max(5, selectedLog.evidence_uncertainty * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Distinguishes high-certainty randomized controlled trials / FDA labels from low-certainty case reports.
                  </p>
                </div>

                {/* 4. Interpretation Uncertainty */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-700">4. Clinical Interpretation Uncertainty</span>
                    <span className="font-mono font-bold text-blue-950">
                      {(selectedLog.interpretation_uncertainty * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getUncertaintyColor(selectedLog.interpretation_uncertainty)}`} 
                      style={{ width: `${Math.max(5, selectedLog.interpretation_uncertainty * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Degree of clinical nuance, co-morbidities, and need for physician judgment.
                  </p>
                </div>
              </div>

              {/* Records Considered & Sources */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                  <FileText className="h-4 w-4 text-teal-700" />
                  Records Considered & Trusted Literature Citations
                </h3>

                {/* Records Considered */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">Patient Records Considered in Prompt:</span>
                  <div className="space-y-1.5">
                    {selectedLog.records_considered?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between">
                        <span className="font-semibold text-slate-800">{rec.type || 'Record'}: {rec.identifier || rec.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{rec.date || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Literature Sources */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">Peer-Reviewed Literature Cited:</span>
                  <div className="space-y-1.5">
                    {selectedLog.cited_sources?.map((src: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-blue-50/50 border border-blue-100 rounded text-xs">
                        <div className="font-semibold text-blue-950">{src.source_name || src.title}</div>
                        {src.url && (
                          <a 
                            href={src.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[11px] text-blue-700 hover:underline flex items-center gap-1 mt-1 font-mono"
                          >
                            <ExternalLink className="h-3 w-3" /> {src.url}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITransparencyPage;
