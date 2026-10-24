import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  FileText, 
  Download, 
  Calendar, 
  UserCheck, 
  HelpCircle, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Clock, 
  ShieldCheck, 
  Stethoscope,
  Activity,
  Pill
} from 'lucide-react';

export default function DoctorVisitPrepPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    appointment_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    date_range_start: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
    date_range_end: new Date().toISOString().split('T')[0],
    clinician_name: 'Dr. Rajiv Sharma',
    specialty: 'Cardiology',
    include_allergies: true,
    include_medications: true,
    include_supplements: true,
    include_readings: true,
    include_labs: true,
    include_symptoms: true,
  });

  const [customQuestions, setCustomQuestions] = useState<string[]>([
    'Can we evaluate if my ankle swelling is related to Amlodipine?',
    'Should we adjust my blood pressure targets based on my daily morning readings?',
  ]);
  const [newQuestion, setNewQuestion] = useState('');

  // Selected Summary to View
  const [selectedSummary, setSelectedSummary] = useState<any | null>(null);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const data = await api.listDoctorVisitSummaries();
      setSummaries(data);
      if (data.length > 0 && !selectedSummary) {
        setSelectedSummary(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load doctor visit summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setCustomQuestions([...customQuestions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const handleRemoveQuestion = (idx: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');

    try {
      const payload = {
        ...formData,
        custom_questions: customQuestions,
      };

      const result = await api.generateDoctorVisitPrep(payload);
      setShowCreateModal(false);
      setSelectedSummary(result);
      await fetchSummaries();
    } catch (err: any) {
      setError(err.message || 'Failed to generate visit summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = (summaryId: number) => {
    const token = localStorage.getItem('token');
    // Direct link to backend PDF generator with authorization header support or query token
    const url = `/api/v1/doctor-visit/download-pdf/${summaryId}`;
    
    // Fetch as blob to attach Authorization Bearer header properly
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('PDF download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `MediChronicle_Visit_Summary_${summaryId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        setError(err.message || 'Failed to download PDF');
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Visit Preparation"
        description="Generates high-density, chronological pre-consultation agendas synthesized from verified records with customizable patient questions and genuine binary ReportLab PDF export."
        category="Clinical Assistance"
        breadcrumbs={[{ label: 'Doctor Visit Preparation' }]}
        primaryAction={
          <button
            onClick={() => setShowCreateModal(!showCreateModal)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showCreateModal ? 'Cancel' : 'Generate Visit Packet'}
          </button>
        }
        secondaryAction={
          <CrossModuleLink to="/timeline" label="Health History" variant="slate" size="sm" />
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-rose-500 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Generation Modal / Form Card */}
      {showCreateModal && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-600" />
            Configure Pre-Visit Agenda & Data Scope
          </h2>

          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinician Name</label>
                <input
                  type="text"
                  placeholder="e.g., Dr. Rajiv Sharma"
                  value={formData.clinician_name}
                  onChange={(e) => setFormData({ ...formData, clinician_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Specialty</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                >
                  <option value="General Physician">General Physician / Internal Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Endocrinology">Endocrinology / Diabetology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="Pulmonology">Pulmonology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lookback Period</label>
                <div className="flex gap-2 items-center text-xs text-slate-500 pt-2 font-mono">
                  <span>{formData.date_range_start}</span>
                  <span>to</span>
                  <span>{formData.date_range_end}</span>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-3">
                Include Sections in Clinical Summary
              </span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.include_medications}
                    onChange={(e) => setFormData({ ...formData, include_medications: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Current Medications & Salts
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.include_readings}
                    onChange={(e) => setFormData({ ...formData, include_readings: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  BP & Glucose Trend Summary
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.include_labs}
                    onChange={(e) => setFormData({ ...formData, include_labs: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Recent Laboratory Observations
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.include_symptoms}
                    onChange={(e) => setFormData({ ...formData, include_symptoms: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Active Symptoms & Severity
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.include_supplements}
                    onChange={(e) => setFormData({ ...formData, include_supplements: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Supplements & Nutrients
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.include_allergies}
                    onChange={(e) => setFormData({ ...formData, include_allergies: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Allergies & Contraindications
                </label>
              </div>
            </div>

            {/* Custom Patient Questions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Questions for the Doctor
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Type a question you want to ask during your consultation..."
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); } }}
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <div className="space-y-1.5">
                {customQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <span className="text-slate-800">{idx + 1}. {q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generating}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? 'Generating Document...' : 'Generate Visit Preparation Packet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Two-Column View: History vs Summary Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Generated Packets List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span>Prepared Packets ({summaries.length})</span>
            {loading && <span className="text-xs font-normal text-slate-400">Loading...</span>}
          </h2>

          {summaries.length === 0 && !loading && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              <Stethoscope className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              No visit summaries generated yet. Click &quot;Generate Visit Packet&quot; above.
            </div>
          )}

          <div className="space-y-2">
            {summaries.map((s) => {
              const isSelected = selectedSummary?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSummary(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {s.clinician_name || 'Upcoming Consultation'}
                      </h3>
                      <p className="text-xs text-teal-700 font-medium">{s.specialty || 'General Care'}</p>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      #{s.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Appt: {s.appointment_date || 'Undated'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Summary Packet Details & PDF Action (8 cols) */}
        <div className="lg:col-span-8">
          {!selectedSummary ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              Select a visit packet from the left to view summary details and export PDF.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Header Action Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    {selectedSummary.specialty || 'General Consultation'} Packet
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {selectedSummary.clinician_name || 'Physician Consultation Summary'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Scheduled Appointment: <strong className="text-slate-700">{selectedSummary.appointment_date || 'Not specified'}</strong>
                  </p>
                </div>

                <button
                  onClick={() => handleDownloadPdf(selectedSummary.id)}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Download className="h-4 w-4" />
                  Download Verified PDF Summary
                </button>
              </div>

              {/* Consultation Agenda & Clinical Content Preview */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                {/* Active Regimen */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Pill className="h-4 w-4 text-teal-600" />
                    Active Medications & Prescriptions
                  </h3>
                  {selectedSummary.summary_content?.medications?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedSummary.summary_content.medications.map((m: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                          <div className="font-bold text-slate-900">{m.brand_name} ({m.generic_name})</div>
                          <div className="text-slate-600 mt-1">Strength: <span className="font-mono">{m.strength}</span></div>
                          <div className="text-slate-500 mt-0.5 text-[11px]">{m.dosage_instructions}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No active medications included.</p>
                  )}
                </div>

                {/* Daily Readings Summary */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Activity className="h-4 w-4 text-teal-600" />
                    Health Readings Overview ({selectedSummary.summary_content?.readings_summary?.total_count || 0} measurements)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Avg Blood Pressure</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {selectedSummary.summary_content?.readings_summary?.avg_systolic 
                          ? `${selectedSummary.summary_content.readings_summary.avg_systolic} / ${selectedSummary.summary_content.readings_summary.avg_diastolic} mmHg`
                          : 'No BP logged'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Avg Fasting Glucose</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {selectedSummary.summary_content?.readings_summary?.avg_glucose
                          ? `${selectedSummary.summary_content.readings_summary.avg_glucose} mg/dL`
                          : 'No glucose logged'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Recent Symptoms</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {selectedSummary.summary_content?.symptoms?.length || 0} Reported
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-slate-400 block text-[11px]">Recent Lab Reports</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {selectedSummary.summary_content?.labs?.length || 0} Observations
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Questions for Consultation */}
                {selectedSummary.custom_questions && selectedSummary.custom_questions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100">
                      <HelpCircle className="h-4 w-4 text-teal-600" />
                      Priority Questions for Doctor
                    </h3>
                    <div className="space-y-2">
                      {selectedSummary.custom_questions.map((q: string, idx: number) => (
                        <div key={idx} className="p-3 bg-teal-50/40 border border-teal-100 rounded-lg text-xs flex items-start gap-2.5">
                          <span className="font-bold text-teal-800 text-[11px] bg-teal-100 px-1.5 py-0.5 rounded">
                            Q{idx + 1}
                          </span>
                          <span className="font-medium text-slate-800">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
