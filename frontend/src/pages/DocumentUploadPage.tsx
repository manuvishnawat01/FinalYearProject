import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, Languages, Calendar } from 'lucide-react';

export const DocumentUploadPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('laboratory');
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchDocsAndObs = async () => {
    try {
      const [docs, obs] = await Promise.all([
        api.listDocuments(),
        api.listObservations(),
      ]);
      setDocuments(docs);
      setObservations(obs);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocsAndObs();
  }, []);

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
      await api.uploadDocument(formData);
      setMessage('Document ingested successfully. Candidate observations extracted for explicit patient confirmation.');
      setFile(null);
      fetchDocsAndObs();
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
        description="Securely ingest clinical documents (PDF, JPG, PNG). Text and laboratory measurements are extracted as candidate observations requiring explicit review before becoming verified medical facts."
        category="Health Records"
        breadcrumbs={[{ label: 'Document Ingestion' }]}
        primaryAction={
          <CrossModuleLink to="/translator" label="Report Explainer" variant="primary" size="sm" />
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
              >
              </input>
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
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50"
            >
              {uploading ? 'Processing OCR Extraction...' : 'Upload & Extract Observations'}
            </button>
          </div>
        </form>
      </div>

      {/* Candidate vs Confirmed Observations Review Stream */}
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
                {observations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-bold text-blue-950">{obs.observation_name}</td>
                    <td className="p-3 font-mono font-bold text-blue-900">
                      {obs.value} {obs.unit}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">{obs.reference_range || 'N/A'}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Uploaded Documents Archive */}
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
              <div key={d.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {d.document_type}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{d.document_date}</span>
                  </div>
                  <h4 className="font-bold text-xs text-blue-950 truncate mt-1">{d.file_name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Status: {d.status}</p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <CrossModuleLink to={`/translator?doc=${d.id}`} label="Explain Report" variant="secondary" />
                  <CrossModuleLink to="/timeline" label="Health History" variant="slate" />
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
