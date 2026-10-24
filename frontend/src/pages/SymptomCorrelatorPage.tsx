import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Pill, 
  Search, 
  Info,
  CheckCircle2,
  FileText,
  Plus
} from 'lucide-react';

export default function SymptomCorrelatorPage() {
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    symptom_name: '',
    description: '',
    onset_date: new Date().toISOString().split('T')[0],
    onset_time: '14:00',
    end_date: '',
    end_time: '',
    is_ongoing: true,
    severity: 5,
    duration_hours: '',
    frequency: 'intermittent',
    associated_measurement_type: 'blood_pressure',
    associated_measurement_value: '',
    notes: '',
  });

  // Selected Symptom for Correlation Analysis
  const [selectedSymptomId, setSelectedSymptomId] = useState<number | null>(null);
  const [correlationResult, setCorrelationResult] = useState<any | null>(null);
  const [correlationLoading, setCorrelationLoading] = useState(false);

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const fetchSymptoms = async () => {
    setLoading(true);
    try {
      const data = await api.listSymptoms();
      setSymptoms(data);
      if (data.length > 0 && !selectedSymptomId) {
        handleCorrelate(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load symptoms');
    } finally {
      setLoading(false);
    }
  };

  const handleCorrelate = async (id: number) => {
    setSelectedSymptomId(id);
    setCorrelationLoading(true);
    try {
      const result = await api.correlateSymptom(id);
      setCorrelationResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to correlate symptom');
    } finally {
      setCorrelationLoading(false);
    }
  };

  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = {
        symptom_name: formData.symptom_name,
        description: formData.description || undefined,
        onset_date: formData.onset_date,
        onset_time: formData.onset_time || '12:00',
        end_date: formData.is_ongoing ? undefined : (formData.end_date || undefined),
        end_time: formData.is_ongoing ? undefined : (formData.end_time || undefined),
        is_ongoing: formData.is_ongoing,
        severity: Number(formData.severity),
        duration_hours: formData.duration_hours ? Number(formData.duration_hours) : undefined,
        frequency: formData.frequency,
        associated_measurement_type: formData.associated_measurement_type || undefined,
        associated_measurement_value: formData.associated_measurement_value || undefined,
        notes: formData.notes || undefined,
      };

      const created = await api.recordSymptom(payload);
      setShowAddForm(false);
      setFormData({
        symptom_name: '',
        description: '',
        onset_date: new Date().toISOString().split('T')[0],
        onset_time: '14:00',
        end_date: '',
        end_time: '',
        is_ongoing: true,
        severity: 5,
        duration_hours: '',
        frequency: 'intermittent',
        associated_measurement_type: 'blood_pressure',
        associated_measurement_value: '',
        notes: '',
      });
      await fetchSymptoms();
      handleCorrelate(created.id);
    } catch (err: any) {
      setError(err.message || 'Failed to record symptom');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (sev: number) => {
    if (sev >= 8) return 'bg-rose-100 text-rose-800 border-rose-300';
    if (sev >= 5) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Symptom & Health Tracker"
        description="Temporal alignment between medication changes and reported symptoms with pharmacovigilance adverse reaction matching and strict non-causal disclaimers."
        category="Clinical Assistance"
        breadcrumbs={[{ label: 'Symptom & Health Tracker' }]}
        primaryAction={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddForm ? 'Close Form' : 'Record New Symptom'}
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

      {/* Record Symptom Modal / Form Card */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            Record Patient Symptom
          </h2>
          <form onSubmit={handleAddSymptom} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Symptom Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Peripheral Edema, Headache, Dizziness"
                  value={formData.symptom_name}
                  onChange={(e) => setFormData({ ...formData, symptom_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="constant">Constant (Continuous)</option>
                  <option value="intermittent">Intermittent (Comes and goes)</option>
                  <option value="occasional">Occasional (Rare flare-ups)</option>
                  <option value="progressive">Progressive (Worsening over time)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Onset Date *</label>
                <input
                  type="date"
                  required
                  value={formData.onset_date}
                  onChange={(e) => setFormData({ ...formData, onset_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Onset Time</label>
                <input
                  type="time"
                  value={formData.onset_time}
                  onChange={(e) => setFormData({ ...formData, onset_time: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Severity Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-600">Severity Rating (1 to 10) *</label>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getSeverityColor(formData.severity)}`}>
                  Level {formData.severity}/10 - {formData.severity >= 8 ? 'Severe' : formData.severity >= 5 ? 'Moderate' : 'Mild'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>1 (Barely noticeable)</span>
                <span>5 (Distracting)</span>
                <span>10 (Debilitating / Emergency)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_ongoing"
                checked={formData.is_ongoing}
                onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked })}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
              />
              <label htmlFor="is_ongoing" className="text-xs font-medium text-slate-700">
                This symptom is currently ongoing
              </label>
            </div>

            {!formData.is_ongoing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Resolved Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g., 4"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Associated Measurement Type (Optional)</label>
                <select
                  value={formData.associated_measurement_type}
                  onChange={(e) => setFormData({ ...formData, associated_measurement_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  <option value="">None</option>
                  <option value="blood_pressure">Blood Pressure (Systolic/Diastolic)</option>
                  <option value="blood_glucose">Blood Glucose (mg/dL)</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="temperature">Body Temperature (°F/°C)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Associated Value at Onset</label>
                <input
                  type="text"
                  placeholder="e.g., 148/94 or 185 mg/dL"
                  value={formData.associated_measurement_value}
                  onChange={(e) => setFormData({ ...formData, associated_measurement_value: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Clinical Notes & Observations</label>
              <textarea
                rows={2}
                placeholder="Describe triggers, specific locations, relieving factors..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 text-sm font-medium rounded-lg text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Symptom'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Symptoms List vs Correlation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Logged Symptoms List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide flex items-center justify-between">
            <span>Reported Symptoms ({symptoms.length})</span>
            {loading && <span className="text-xs font-normal text-slate-400">Loading...</span>}
          </h2>

          {symptoms.length === 0 && !loading && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-slate-500 text-sm">
              <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              No symptoms recorded yet. Click &quot;Record New Symptom&quot; above to log an event.
            </div>
          )}

          <div className="space-y-2">
            {symptoms.map((sym) => {
              const isSelected = selectedSymptomId === sym.id;
              return (
                <div
                  key={sym.id}
                  onClick={() => handleCorrelate(sym.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{sym.symptom_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Onset: {sym.onset_date}</span>
                        {sym.onset_time && <span>({sym.onset_time})</span>}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getSeverityColor(sym.severity)}`}>
                      Sev {sym.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                    <StatusBadge status={sym.is_ongoing ? 'unverified' : 'confirmed'} />
                    <span className="text-slate-500 capitalize">{sym.frequency || 'intermittent'}</span>
                    {sym.associated_measurement_value && (
                      <span className="ml-auto text-slate-600 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {sym.associated_measurement_value}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Temporal Correlation & Literature Insights (8 cols) */}
        <div className="lg:col-span-8">
          {correlationLoading && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <div className="animate-spin h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              Evaluating temporal timeline and pharmacovigilance databases...
            </div>
          )}

          {!correlationLoading && !correlationResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              Select a symptom from the left to view temporal correlation with active medications.
            </div>
          )}

          {!correlationLoading && correlationResult && (
            <div className="space-y-5">
              {/* Red Flag Alert Banner if present */}
              {correlationResult.red_flag_alert && (
                <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-xl shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-rose-900 text-sm uppercase tracking-wide">
                        Red-Flag Clinical Warning: {correlationResult.red_flag_alert.severity_level}
                      </h3>
                      <p className="text-sm text-rose-800 mt-1 font-medium">
                        {correlationResult.red_flag_alert.alert_reason}
                      </p>
                      <p className="text-xs text-rose-700 mt-2 bg-rose-100/80 p-2.5 rounded-lg border border-rose-200 font-medium">
                        Action Required: {correlationResult.red_flag_alert.recommended_action}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Strict Non-Causal Explanation Box */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Clinical Correlation Protocol Notice:</strong>
                  {correlationResult.non_causal_explanation}
                </div>
              </div>

              {/* Symptom Overview Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Investigated Symptom</span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {correlationResult.symptom.symptom_name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${getSeverityColor(correlationResult.symptom.severity)}`}>
                      Severity Level: {correlationResult.symptom.severity} / 10
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
                      Status: {correlationResult.symptom.is_ongoing ? 'Currently Active' : 'Resolved'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Onset Date & Time</span>
                    <span className="font-semibold text-slate-800">{correlationResult.symptom.onset_date} {correlationResult.symptom.onset_time || ''}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Frequency</span>
                    <span className="font-semibold text-slate-800 capitalize">{correlationResult.symptom.frequency || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Associated Value</span>
                    <span className="font-semibold text-slate-800">{correlationResult.symptom.associated_measurement_value || 'None recorded'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Source Provenance</span>
                    <span className="font-semibold text-slate-800">{correlationResult.symptom.source_provenance || 'patient_entered'}</span>
                  </div>
                </div>
              </div>

              {/* Temporal Timeline: Proximity to Medications */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600" />
                  Temporal Events (Medications Started or Changed Within 60 Days)
                </h3>

                {(!correlationResult.temporal_events || correlationResult.temporal_events.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100 text-center">
                    No medication start or dosage changes recorded within 60 days of this symptom onset.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {correlationResult.temporal_events.map((evt: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <Pill className="h-4 w-4 text-teal-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900">{evt.medication_name}</span>
                            <span className="text-slate-500 text-[11px] ml-2">({evt.strength || 'strength not specified'})</span>
                            <div className="text-[11px] text-slate-500">
                              Event: <span className="capitalize font-medium text-slate-700">{evt.event_type}</span> on {evt.event_date}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded font-medium text-[11px]">
                          {evt.days_difference >= 0 ? `${evt.days_difference} days prior to symptom` : `${Math.abs(evt.days_difference)} days after symptom`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pharmacovigilance & Literature Known Side Effects */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-teal-600" />
                  Established Literature Side Effects for Current Medicines
                </h3>

                {(!correlationResult.known_side_effects || correlationResult.known_side_effects.length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-100 text-center">
                    No documented common or severe adverse effect overlap found in FDA/DailyMed drug safety databases for this symptom.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {correlationResult.known_side_effects.map((se: any, idx: number) => (
                      <div key={idx} className="p-3.5 border border-slate-200 rounded-lg bg-slate-50/50 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{se.medication_name}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            se.frequency_category === 'common' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {se.frequency_category?.toUpperCase() || 'DOCUMENTED'}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {se.clinical_description}
                        </p>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                          <FileText className="h-3 w-3" />
                          <span>Literature Source: {se.source_reference || 'FDA DailyMed / Package Insert'}</span>
                        </div>
                      </div>
                    ))}
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
