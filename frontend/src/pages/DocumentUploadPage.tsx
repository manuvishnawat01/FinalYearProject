import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Languages,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const DocumentUploadPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('laboratory');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // In-page Instant Report Analysis states
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [analysisDoc, setAnalysisDoc] = useState<any | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisLang, setAnalysisLang] = useState<'en' | 'hi'>('en');

  const fetchDocsAndObs = async () => {
    try {
      const [docs, obs] = await Promise.allSettled([
        api.listDocuments(),
        api.listObservations(),
      ]);

      if (docs.status === 'fulfilled' && Array.isArray(docs.value)) {
        setDocuments(docs.value);
      }
      if (obs.status === 'fulfilled' && Array.isArray(obs.value)) {
        setObservations(obs.value);
      }
    } catch (err: any) {
      console.error('Error fetching docs and observations:', err);
    }
  };

  useEffect(() => {
    fetchDocsAndObs();
  }, []);

  const handleAnalyzeDocument = async (docId: number, lang: 'en' | 'hi' = analysisLang) => {
    setAnalysisLoading(true);
    try {
      const res = await api.explainReport(docId, lang);
      setAnalysis(res);
      const targetDoc = documents.find((d) => d.id === docId);
      if (targetDoc) {
        setAnalysisDoc(targetDoc);
      } else {
        setAnalysisDoc({ id: docId });
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      alert(`Report analysis failed: ${err.message}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleLanguageSwitch = (newLang: 'en' | 'hi') => {
    setAnalysisLang(newLang);
    if (analysisDoc?.id) {
      handleAnalyzeDocument(analysisDoc.id, newLang);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('document_date', docDate);

    try {
      const uploadedDoc = await api.uploadDocument(formData);
      setMessage('Document ingested successfully! Candidate observations extracted and analyzed below.');
      setFile(null);
      await fetchDocsAndObs();

      // Automatically generate AI Analysis right on the page
      if (uploadedDoc && uploadedDoc.id) {
        setAnalysisDoc(uploadedDoc);
        await handleAnalyzeDocument(uploadedDoc.id, analysisLang);
      }
    } catch (err: any) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmObservation = async (obsId: number) => {
    try {
      await api.confirmObservation({
        observation_id: obsId,
        verification_status: 'confirmed_by_user',
      });
      fetchDocsAndObs();
    } catch (err: any) {
      alert(`Error confirming observation: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Ingestion & Clinical Extraction"
        description="Securely ingest clinical documents (PDF, JPG, PNG). Laboratory measurements are extracted as candidate observations requiring explicit review before becoming verified medical facts."
        category="Health Records"
        breadcrumbs={[{ label: 'Document Ingestion' }]}
        primaryAction={
          <CrossModuleLink to="/translator" label="Full Report Explainer" variant="primary" size="sm" />
        }
        secondaryAction={
          <CrossModuleLink to="/timeline" label="Health History" variant="slate" size="sm" />
        }
      />

      {/* Upload Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-blue-950 mb-3 flex items-center">
          <UploadCloud className="w-4 h-4 mr-2 text-blue-700" />
          Ingest Laboratory Report or Medical Prescription
        </h3>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-950 text-xs rounded-lg flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-700 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Document Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
              >
                <option value="laboratory">Laboratory Diagnostic Panel</option>
                <option value="prescription">Doctor Prescription</option>
                <option value="radiology">Radiology / Imaging Report</option>
                <option value="discharge_summary">Hospital Discharge Summary</option>
                <option value="other">Other Clinical Record</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Document Issue Date</label>
              <input
                type="date"
                required
                value={docDate}
                onChange={(e) => setDocDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">File Attachment (PDF / JPG / PNG)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                required
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-slate-50/50 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Processing OCR & Extracting Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-200" />
                  <span>Upload & Analyze Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Instant AI Clinical Report Analysis Card */}
      {(analysis || analysisLoading) && (
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-xl border border-blue-800 p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-blue-800/80 gap-3">
            <div>
              <div className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                AI CLINICAL REPORT ANALYSIS & EXPLAINER
              </div>
              <h3 className="text-base font-bold text-white">
                {analysisDoc?.file_name ? `Analysis for: ${analysisDoc.file_name}` : 'Document Clinical Analysis'}
              </h3>
              <p className="text-xs text-blue-200/80">
                Grounded plain-language interpretation preserving medical facts without diagnostic fabrication.
              </p>
            </div>

            {/* Language Switcher */}
            <div className="inline-flex p-1 bg-slate-800/80 rounded-lg border border-slate-700 self-start sm:self-auto">
              <button
                onClick={() => handleLanguageSwitch('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  analysisLang === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageSwitch('hi')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                  analysisLang === 'hi' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          </div>

          {analysisLoading ? (
            <div className="py-10 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
              <p className="text-xs text-blue-200">Analyzing observations and correlating clinical authorities...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-5">
              {/* Plain Language Summary */}
              <div className="bg-blue-950/60 rounded-lg p-4 border border-blue-800/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                  Plain-Language Summary ({analysisLang === 'en' ? 'English' : 'हिन्दी'})
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {analysis.executive_summary || analysis.plain_language_summary}
                </p>
              </div>

              {/* Analyzed Observations Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">
                  Key Biomarkers & Clinical Evidence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(analysis.observations || analysis.observations_explained || []).map((obs: any, idx: number) => {
                    const isOut = obs.is_out_of_range || obs.status === 'high' || obs.status === 'low';
                    const testName = obs.test_name || obs.original_name;
                    const val = obs.actual_value || obs.extracted_value;
                    const refLimits = obs.reference_range || obs.reference_range_in_report || 'Standard Reference';
                    const explanationText = obs.plain_language_explanation;
                    const sourceText = obs.evidence_claim_source || obs.claim_source;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-lg border transition ${
                          isOut
                            ? 'bg-amber-950/20 border-amber-600/40 text-amber-100'
                            : 'bg-slate-800/60 border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-white">{testName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isOut
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {isOut ? 'OUT OF RANGE' : 'IN RANGE'}
                          </span>
                        </div>

                        <div className="text-xs mb-2 flex items-baseline space-x-2">
                          <span className="font-mono font-bold text-sm text-cyan-300">
                            {val} {obs.unit || ''}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Ref: {refLimits})
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                          {explanationText}
                        </p>

                        {sourceText && (
                          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="truncate">Evidence: {sourceText}</span>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Questions for Doctor */}
              {((analysis.clinical_discussion_questions || analysis.suggested_questions_for_doctor) || []).length > 0 && (
                <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2 flex items-center">
                    <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                    Recommended Discussion Questions for Your Doctor
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {(analysis.clinical_discussion_questions || analysis.suggested_questions_for_doctor).map((q: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-cyan-400 font-bold mr-2">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Candidate Observations Review Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-blue-950 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-700" />
              Candidate Observations Extraction Queue
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Requires user confirmation before observations influence health trends or clinical warnings.
            </p>
          </div>
          <button
            onClick={fetchDocsAndObs}
            className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-slate-100 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {observations.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No observations extracted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Observation Name</th>
                  <th className="p-3">Extracted Value</th>
                  <th className="p-3">Reference Range</th>
                  <th className="p-3">Document Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {observations.map((obs) => {
                  const displayValue = obs.numeric_value ?? obs.value ?? obs.string_value ?? '-';
                  const displayRange = obs.reference_range_text ?? obs.reference_range ?? 'Standard Reference';
                  return (
                    <tr key={obs.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-bold text-blue-950">{obs.observation_name}</td>
                      <td className="p-3 font-mono font-bold text-blue-900">
                        {displayValue} {obs.unit || ''}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{displayRange}</td>
                      <td className="p-3 text-slate-600 font-mono">{obs.observation_date}</td>
                      <td className="p-3">
                        <StatusBadge status={obs.verification_status} />
                      </td>
                      <td className="p-3 text-right">
                        {obs.verification_status !== 'confirmed_by_user' ? (
                          <button
                            onClick={() => handleConfirmObservation(obs.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded transition shadow-2xs"
                          >
                            Confirm Value
                          </button>
                        ) : (
                          <CrossModuleLink to={`/trends?metric=${encodeURIComponent(obs.observation_name)}`} label="View Trend" variant="primary" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Uploaded Documents Vault */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-blue-950 flex items-center pb-2 border-b border-slate-100">
          <FileText className="w-4 h-4 mr-2 text-blue-700" />
          Ingested Physical Documents Vault ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No documents uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((d) => (
              <div key={d.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {d.category || d.document_type || 'Clinical Document'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{d.document_date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-blue-950 truncate mt-1" title={d.file_name}>
                    {d.file_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Status: {d.status}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => handleAnalyzeDocument(d.id)}
                    className="w-full py-1.5 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold text-xs flex items-center justify-center space-x-1 transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-200" />
                    <span>Analyze Report with AI</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <CrossModuleLink to={`/translator?doc=${d.id}`} label="Full Explainer" variant="secondary" />
                    <CrossModuleLink to="/timeline" label="Health History" variant="slate" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploadPage;