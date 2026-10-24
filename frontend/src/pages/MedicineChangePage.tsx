import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  GitCommit, 
  Clock, 
  Calendar, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Sliders,
  Plus
} from 'lucide-react';

export default function MedicineChangePage() {
  const [medications, setMedications] = useState<any[]>([]);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Change Form State
  const [formData, setFormData] = useState({
    medication_id: '',
    event_type: 'changed',
    event_date: new Date().toISOString().split('T')[0],
    new_instructions: '',
    new_dosage: '',
    recorded_reason: '',
  });

  // Comparison State
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [windowDays, setWindowDays] = useState<number>(30);
  const [comparisonReport, setComparisonReport] = useState<any | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [medsData, historyData] = await Promise.all([
        api.listMedications(),
        api.listMedicineHistory(),
      ]);
      setMedications(medsData);
      setHistoryEvents(historyData);

      if (historyData.length > 0 && !selectedEventId) {
        runComparison(historyData[0], 30);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load medicine history');
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async (eventItem: any, days: number) => {
    setSelectedEventId(eventItem.id);
    setComparisonLoading(true);
    setError('');

    try {
      const report = await api.compareMedicineImpact({
        medication_id: eventItem.medication_id,
        change_date: eventItem.event_date,
        window_days: days,
      });
      setComparisonReport(report);
    } catch (err: any) {
      setError(err.message || 'Failed to compare change impact');
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleRecordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medication_id) {
      setError('Please select a medication');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.recordMedicineChange({
        medication_id: Number(formData.medication_id),
        event_type: formData.event_type,
        event_date: formData.event_date,
        new_instructions: formData.new_instructions || undefined,
        new_dosage: formData.new_dosage || undefined,
        recorded_reason: formData.recorded_reason || undefined,
      });

      setShowRecordForm(false);
      setFormData({
        medication_id: '',
        event_type: 'changed',
        event_date: new Date().toISOString().split('T')[0],
        new_instructions: '',
        new_dosage: '',
        recorded_reason: '',
      });

      const updatedHistory = await api.listMedicineHistory();
      setHistoryEvents(updatedHistory);
      if (updatedHistory.length > 0) {
        runComparison(updatedHistory[0], windowDays);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record medication change');
    } finally {
      setSubmitting(false);
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'stopped':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-100 text-rose-800">Stopped</span>;
      case 'dose_increase':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">Dose Increase</span>;
      case 'dose_decrease':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-teal-100 text-teal-800">Dose Decrease</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">Modified</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medication History & Changes"
        description="Logs regimen modifications (dosage adjustments, discontinuations, brand switches) and objectively evaluates health readings in pre/post windows without biased causal claims."
        category="Medicine Intelligence"
        breadcrumbs={[{ label: 'Medication History & Changes' }]}
        primaryAction={
          <button
            onClick={() => setShowRecordForm(!showRecordForm)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showRecordForm ? 'Close Form' : 'Record Regimen Change'}
          </button>
        }
        secondaryAction={
          <CrossModuleLink to="/medicines" label="Medicine Safety Checker" variant="primary" size="sm" />
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-rose-500 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Record Regimen Change Form Modal */}
      {showRecordForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-teal-600" />
            Log Prescription Modification
          </h2>
          <form onSubmit={handleRecordChange} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Medication *</label>
                <select
                  required
                  value={formData.medication_id}
                  onChange={(e) => setFormData({ ...formData, medication_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select medication...</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand_name} ({m.generic_name}) - {m.strength || 'strength unrecorded'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Change Type *</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="changed">Dosage/Timing Changed</option>
                  <option value="dose_increase">Dose Increased</option>
                  <option value="dose_decrease">Dose Decreased</option>
                  <option value="stopped">Medication Discontinued</option>
                  <option value="corrected">Prescription Corrected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Change *</label>
                <input
                  type="date"
                  required
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Dosage / Strength</label>
                <input
                  type="text"
                  placeholder="e.g., 10 mg (increased from 5 mg)"
                  value={formData.new_dosage}
                  onChange={(e) => setFormData({ ...formData, new_dosage: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Prescribed Instructions</label>
                <input
                  type="text"
                  placeholder="e.g., Take 1 tablet daily in morning with water"
                  value={formData.new_instructions}
                  onChange={(e) => setFormData({ ...formData, new_instructions: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Documented Clinical Reason / Context</label>
              <textarea
                rows={2}
                placeholder="Reason noted by doctor (e.g., target BP not reached, intolerable ankle swelling, lab improvement)..."
                value={formData.recorded_reason}
                onChange={(e) => setFormData({ ...formData, recorded_reason: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRecordForm(false)}
                className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 text-sm font-medium rounded-lg text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Save Regimen Change'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recorded Modification Events (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span>Regimen Change Events ({historyEvents.length})</span>
            {loading && <span className="text-xs font-normal text-slate-400">Loading...</span>}
          </h2>

          {historyEvents.length === 0 && !loading && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              <GitCommit className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              No medicine changes logged yet.
            </div>
          )}

          <div className="space-y-2">
            {historyEvents.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              return (
                <div
                  key={evt.id}
                  onClick={() => runComparison(evt, windowDays)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{evt.medication_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Date: {evt.event_date}</span>
                      </div>
                    </div>
                    {getEventTypeBadge(evt.event_type)}
                  </div>

                  {evt.new_dosage && (
                    <p className="text-xs text-slate-600 mt-2 font-mono bg-slate-100 p-1.5 rounded">
                      New: {evt.new_dosage}
                    </p>
                  )}

                  {evt.recorded_reason && (
                    <p className="text-xs text-slate-500 mt-1.5 italic line-clamp-1">
                      Reason: &quot;{evt.recorded_reason}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pre/Post Window Impact Comparison (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Window Filter Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Sliders className="h-4 w-4 text-teal-600" />
              <span>Comparison Window:</span>
            </div>
            <div className="flex items-center gap-2">
              {[14, 30, 60, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setWindowDays(days);
                    const currentEvt = historyEvents.find(e => e.id === selectedEventId) || historyEvents[0];
                    if (currentEvt) runComparison(currentEvt, days);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    windowDays === days
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  ± {days} Days
                </button>
              ))}
            </div>
          </div>

          {comparisonLoading && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <div className="animate-spin h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              Aggregating readings and laboratory tests within ±{windowDays} days of change...
            </div>
          )}

          {!comparisonLoading && !comparisonReport && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              Select a medication change event from the left to view the before & after comparison report.
            </div>
          )}

          {!comparisonLoading && comparisonReport && (
            <div className="space-y-5">
              {/* Neutral Summary Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Medication Analyzed</span>
                    <h2 className="text-lg font-bold text-slate-900">{comparisonReport.medication_name}</h2>
                  </div>
                  <span className="text-xs bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-medium text-slate-600">
                    Window: ±{comparisonReport.window_days} Days
                  </span>
                </div>

                <p className="text-sm text-slate-700 mt-4 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {comparisonReport.summary_text}
                </p>
              </div>

              {/* Side-by-Side Table: Daily Health Readings (BP & Glucose) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Daily Health Readings (Pre vs Post Change)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pre-Change Window */}
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase">Pre-Change Window</span>
                      <span className="text-[11px] text-slate-500 font-medium">({comparisonReport.pre_change_readings?.length || 0} readings)</span>
                    </div>

                    {(!comparisonReport.pre_change_readings || comparisonReport.pre_change_readings.length === 0) ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No readings logged in pre-change window.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {comparisonReport.pre_change_readings.map((r: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-white border border-slate-100 rounded">
                            <span className="text-slate-500 font-mono text-[11px]">{r.date}</span>
                            <span className="font-semibold text-slate-800">
                              {r.reading_type === 'blood_pressure' ? `${r.systolic}/${r.diastolic} mmHg` : `${r.glucose_value} mg/dL`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post-Change Window */}
                  <div className="border border-teal-200 rounded-lg p-3.5 bg-teal-50/30">
                    <div className="flex items-center justify-between pb-2 border-b border-teal-200 mb-2">
                      <span className="text-xs font-bold text-teal-900 uppercase">Post-Change Window</span>
                      <span className="text-[11px] text-teal-700 font-medium">({comparisonReport.post_change_readings?.length || 0} readings)</span>
                    </div>

                    {(!comparisonReport.post_change_readings || comparisonReport.post_change_readings.length === 0) ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No readings logged in post-change window.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {comparisonReport.post_change_readings.map((r: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-white border border-teal-100 rounded">
                            <span className="text-slate-500 font-mono text-[11px]">{r.date}</span>
                            <span className="font-semibold text-teal-900">
                              {r.reading_type === 'blood_pressure' ? `${r.systolic}/${r.diastolic} mmHg` : `${r.glucose_value} mg/dL`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Side-by-Side Table: Confirmed Laboratory Observations */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Confirmed Laboratory Tests
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50">
                    <div className="text-xs font-bold text-slate-700 uppercase pb-2 border-b border-slate-200 mb-2">
                      Pre-Change Lab Observations ({comparisonReport.pre_change_labs?.length || 0})
                    </div>
                    {(!comparisonReport.pre_change_labs || comparisonReport.pre_change_labs.length === 0) ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No lab reports found within pre-change window.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {comparisonReport.pre_change_labs.map((l: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs p-2 bg-white border border-slate-100 rounded">
                            <div>
                              <div className="font-semibold text-slate-800">{l.test_name}</div>
                              <div className="text-[10px] text-slate-400">{l.date}</div>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{l.value} {l.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border border-teal-200 rounded-lg p-3.5 bg-teal-50/30">
                    <div className="text-xs font-bold text-teal-900 uppercase pb-2 border-b border-teal-200 mb-2">
                      Post-Change Lab Observations ({comparisonReport.post_change_labs?.length || 0})
                    </div>
                    {(!comparisonReport.post_change_labs || comparisonReport.post_change_labs.length === 0) ? (
                      <p className="text-xs text-slate-400 py-3 text-center">No lab reports found within post-change window.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {comparisonReport.post_change_labs.map((l: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs p-2 bg-white border border-teal-100 rounded">
                            <div>
                              <div className="font-semibold text-slate-800">{l.test_name}</div>
                              <div className="text-[10px] text-slate-400">{l.date}</div>
                            </div>
                            <span className="font-mono font-bold text-teal-900">{l.value} {l.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discussion Questions for Clinician */}
              {comparisonReport.clinical_discussion_prompts && comparisonReport.clinical_discussion_prompts.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-teal-600" />
                    Doctor Discussion Prompts
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Neutral, non-prescriptive questions you can ask your treating physician during your next follow-up:
                  </p>
                  <ul className="space-y-2">
                    {comparisonReport.clinical_discussion_prompts.map((prompt: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
