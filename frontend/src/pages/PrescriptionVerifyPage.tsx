import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  CheckSquare, 
  FileCheck, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Clock,
  FileText,
  Upload
} from 'lucide-react';

export default function PrescriptionVerifyPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Selected Documents for Analysis
  const [prescriptionDocId, setPrescriptionDocId] = useState<string>('');
  const [packageDocId, setPackageDocId] = useState<string>('');

  // Selected Result for Display
  const [currentResult, setCurrentResult] = useState<any | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [docs, history] = await Promise.all([
        api.listDocuments(),
        api.listVerifications(),
      ]);
      setDocuments(docs);
      setVerifications(history);

      // Auto select first prescription and first package if available
      const rxDoc = docs.find((d: any) => d.document_type === 'prescription');
      const pkgDoc = docs.find((d: any) => d.document_type === 'medication_package' || d.document_type !== 'prescription');
      if (rxDoc) setPrescriptionDocId(String(rxDoc.id));
      if (pkgDoc && pkgDoc.id !== rxDoc?.id) setPackageDocId(String(pkgDoc.id));

      if (history.length > 0) {
        setCurrentResult(history[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleRunVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescriptionDocId || !packageDocId) {
      setError('Please select both a prescription and a dispensed medicine packaging document');
      return;
    }
    if (prescriptionDocId === packageDocId) {
      setError('Prescription and package document must be distinct files');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const result = await api.verifyPrescription(Number(prescriptionDocId), Number(packageDocId));
      setCurrentResult(result);
      const updatedHistory = await api.listVerifications();
      setVerifications(updatedHistory);
    } catch (err: any) {
      setError(err.message || 'Failed to verify prescription');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
      case 'potential_discrepancy':
        return <XCircle className="h-5 w-5 text-rose-600 shrink-0" />;
      case 'missing_on_one_side':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      default:
        return <HelpCircle className="h-5 w-5 text-slate-400 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'match':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800">Match</span>;
      case 'potential_discrepancy':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800">Discrepancy</span>;
      case 'missing_on_one_side':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">Missing on One Side</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">Uncertain</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescription Checker"
        description="Cross-references doctor prescription orders against dispensed medicine packaging photo/OCR candidates with field-by-field clerical discrepancy checks."
        category="Clinical Assistance"
        breadcrumbs={[{ label: 'Prescription Checker' }]}
        primaryAction={
          <CrossModuleLink to="/medicines" label="Medicine Safety Checker" variant="primary" size="sm" />
        }
        secondaryAction={
          <CrossModuleLink to="/documents" label="Upload Packaging" variant="slate" size="sm" />
        }
      />

      {/* Mandatory Non-Authenticity Legal & Clinical Disclaimer */}
      <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl text-amber-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-semibold block mb-0.5">Non-Authenticity & Regulatory Scope Notice:</strong>
          This verification compares text extracted from uploaded medical documents. It does <strong>NOT</strong> verify chemical purity, physical tamper resistance, counterfeit detection, or manufacturer regulatory licenses. If you suspect an incorrect or counterfeit medication, immediately contact your dispensing pharmacist or treating doctor.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-rose-500 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Verification Setup Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-teal-600" />
          Select Documents for Verification
        </h2>

        <form onSubmit={handleRunVerification} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doctor Prescription Document *
              </label>
              <select
                required
                value={prescriptionDocId}
                onChange={(e) => setPrescriptionDocId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select prescription document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Doc #{doc.id}: {doc.file_name} ({doc.document_type})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Prescription containing prescribed salt, strength & frequency.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispensed Medicine Packaging / Label *
              </label>
              <select
                required
                value={packageDocId}
                onChange={(e) => setPackageDocId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select medicine packaging document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Doc #{doc.id}: {doc.file_name} ({doc.document_type})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Photo or scanned label of medicine strip, box, or pharmacy receipt.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={analyzing || loading || documents.length < 2}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Analyzing Discrepancies...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Run Prescription Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Two-Column View: Verification History vs Detailed Discrepancy Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Past Verifications List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span>Verification Audit Log ({verifications.length})</span>
          </h2>

          {verifications.length === 0 && !loading && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              <FileCheck className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              No verifications recorded yet. Select documents above to run comparison.
            </div>
          )}

          <div className="space-y-2">
            {verifications.map((v) => {
              const isSelected = currentResult?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setCurrentResult(v)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-900 text-sm">Verification #{v.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      v.overall_status === 'verified_match'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {v.overall_status === 'verified_match' ? 'All Matched' : `${v.discrepancy_count} Discrepancies`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(v.created_at).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Side-by-Side Comparison Cards (8 cols) */}
        <div className="lg:col-span-8">
          {!currentResult ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              Select or run a verification to view field-by-field prescription comparison.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Status Banner */}
              <div className={`p-5 rounded-xl border flex items-center justify-between ${
                currentResult.overall_status === 'verified_match'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    {currentResult.overall_status === 'verified_match' ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        Verification Completed: Prescribed Salt & Strength Match
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-rose-600" />
                        Potential Discrepancy Detected ({currentResult.discrepancy_count} Flags)
                      </>
                    )}
                  </h3>
                  <p className="text-xs mt-1 text-slate-600">
                    Review each active ingredient, strength, and instruction field below carefully.
                  </p>
                </div>
              </div>

              {/* Discrepancies Cards Grid */}
              <div className="space-y-3">
                {currentResult.discrepancies?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="font-bold text-sm text-slate-900 capitalize">
                          {item.field_name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                        <span className="text-[11px] font-bold text-blue-700 uppercase block mb-1">Prescription Ordered</span>
                        <div className="font-mono text-slate-900 font-semibold">{item.prescription_value || 'None'}</div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
                        <span className="text-[11px] font-bold text-purple-700 uppercase block mb-1">Packaging Dispensed</span>
                        <div className="font-mono text-slate-900 font-semibold">{item.packaging_value || 'None'}</div>
                      </div>
                    </div>

                    {item.explanation && (
                      <p className="text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-100">
                        <strong className="text-slate-700">Verification Finding:</strong> {item.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
