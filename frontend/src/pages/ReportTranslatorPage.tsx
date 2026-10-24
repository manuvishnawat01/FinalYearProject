import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { Languages, FileText, CheckCircle2, ExternalLink, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';

export const ReportTranslatorPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [explanation, setExplanation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listDocuments().then((docs) => {
      setDocuments(docs);
      if (docs.length > 0) setSelectedDocId(docs[0].id);
    });
  }, []);

  const handleTranslate = async (lang = language) => {
    if (!selectedDocId) return;
    setLoading(true);
    try {
      const res = await api.explainReport(selectedDocId, lang);
      setExplanation(res);
    } catch (err: any) {
      alert(`Translation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      handleTranslate(language);
    }
  }, [selectedDocId, language]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Report Explainer"
        description="Grounded plain-language translation in simple English and Hindi, preserving actual laboratory results and cited external medical authorities without fabricating diagnoses."
        category="Clinical Assistance"
        isSignature={true}
        breadcrumbs={[{ label: 'Medical Report Explainer' }]}
        primaryAction={
          <div className="inline-flex p-1 bg-slate-200/80 rounded-lg">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                language === 'en' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                language === 'hi' ? 'bg-white text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी (Hindi)
            </button>
          </div>
        }
        secondaryAction={
          <CrossModuleLink to="/timeline" label="Health History" variant="slate" size="sm" />
        }
      />

      {/* Document Selection Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1">
          <label className="text-xs font-semibold text-slate-700 shrink-0">Source Medical Document:</label>
          <select
            value={selectedDocId || ''}
            onChange={(e) => setSelectedDocId(Number(e.target.value))}
            className="text-xs border border-slate-300 rounded-lg p-2 font-medium bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none flex-1 max-w-md"
          >
            {documents.length === 0 ? (
              <option value="">No uploaded documents found</option>
            ) : (
              documents.map((d) => (
                <option key={d.id} value={d.id}>
                  Doc #{d.id}: {d.file_name} ({d.document_type} - {d.document_date})
                </option>
              ))
            )}
          </select>
        </div>

        <CrossModuleLink to="/documents" label="Upload New Document" variant="primary" size="sm" />
      </div>

      {loading && (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <Languages className="w-8 h-8 animate-pulse mx-auto mb-2 text-blue-600" />
          <p className="text-xs font-medium text-slate-600">Translating clinical parameters and linking verified citations...</p>
        </div>
      )}

      {/* Translated Explanation Content */}
      {!loading && explanation && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-blue-950 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-700" />
                Plain Language Clinical Summary ({language === 'en' ? 'English' : 'हिन्दी'})
              </h3>
              <StatusBadge status="ai_generated" />
            </div>

            <p className="text-xs text-slate-700 mt-3 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
              {explanation.executive_summary}
            </p>
          </div>

          {/* Detailed Observations Translation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-blue-950 flex items-center pb-2 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-700" />
              Observed Results with Educational Context
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {explanation.observations?.map((obs: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-blue-950">{obs.test_name}</span>
                      <p className="font-mono text-sm font-bold text-blue-900 mt-0.5">
                        {obs.actual_value} {obs.unit}
                      </p>
                    </div>
                    {obs.is_out_of_range ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Out of Range
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        In Range
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {obs.plain_language_explanation}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Ref Limits: {obs.reference_range || 'Laboratory Standard'}</span>
                    <span className="font-medium text-slate-600">{obs.evidence_claim_source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinician Discussion Questions */}
          {explanation.clinical_discussion_questions?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-blue-950 flex items-center mb-2">
                <HelpCircle className="w-4 h-4 mr-2 text-teal-700" />
                Neutral Discussion Questions for Your Doctor
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Non-prescriptive questions you can ask during your appointment:
              </p>
              <ul className="space-y-2">
                {explanation.clinical_discussion_questions.map((q: string, i: number) => (
                  <li key={i} className="text-xs text-slate-700 bg-teal-50/50 p-2.5 rounded-lg border border-teal-200 flex items-start gap-2">
                    <span className="font-bold text-teal-800 shrink-0">Q{i + 1}:</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-right">
                <CrossModuleLink to="/doctor-visit" label="Export to Doctor Visit Prep" variant="secondary" size="sm" />
              </div>
            </div>
          )}

          {/* Verified Literature Citations */}
          {explanation.citations?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-blue-950 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2 text-blue-700" />
                Traceable Peer-Reviewed Citations
              </h3>
              <div className="space-y-2">
                {explanation.citations.map((cite: any, i: number) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-blue-950">{cite.source_name}</span>
                    <p className="text-slate-600 text-[11px] mt-0.5">{cite.authority}</p>
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline text-[11px] mt-1 inline-flex items-center font-mono"
                    >
                      {cite.url} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportTranslatorPage;
