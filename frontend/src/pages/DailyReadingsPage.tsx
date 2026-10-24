import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { Activity, Plus, AlertCircle, Heart, CheckCircle2, TrendingUp } from 'lucide-react';

export const DailyReadingsPage: React.FC = () => {
  const [readings, setReadings] = useState<any[]>([]);
  const [readingType, setReadingType] = useState('blood_pressure');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('08:00');
  
  // BP state
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  
  // Glucose state
  const [glucoseVal, setGlucoseVal] = useState('95');
  const [glucoseContext, setGlucoseContext] = useState('fasting');
  
  // Pulse & weight
  const [pulse, setPulse] = useState('72');
  const [weight, setWeight] = useState('70');
  
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchReadings = async () => {
    try {
      const data = await api.listReadings();
      setReadings(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload: any = {
      reading_type: readingType,
      reading_date: date,
      measurement_time: time,
      notes: notes || undefined,
    };

    if (readingType === 'blood_pressure') {
      payload.systolic = parseFloat(systolic);
      payload.diastolic = parseFloat(diastolic);
    } else if (readingType === 'blood_glucose') {
      payload.glucose_value = parseFloat(glucoseVal);
      payload.glucose_context = glucoseContext;
    } else if (readingType === 'pulse') {
      payload.pulse = parseInt(pulse);
    } else if (readingType === 'weight') {
      payload.weight_kg = parseFloat(weight);
    }

    try {
      await api.recordReading(payload);
      setSuccess('Reading logged successfully with source provenance tags.');
      fetchReadings();
    } catch (err: any) {
      setError(err.message || 'Validation error saving reading.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Vital & Metabolic Tracking"
        description="Records everyday health parameters including coupled systolic/diastolic blood pressure, contextual blood glucose, resting heart rate, and weight with clinical physiological boundary guards."
        category="Health Records"
        breadcrumbs={[{ label: 'Daily Vital Tracking' }]}
        primaryAction={
          <CrossModuleLink to="/trends" label="Health Trends" variant="primary" size="sm" />
        }
        secondaryAction={
          <CrossModuleLink to="/timeline" label="Health History" variant="slate" size="sm" />
        }
      />

      {/* Form Submission Notification Alerts */}
      {error && (
        <div className="p-3.5 bg-rose-50 border-l-4 border-rose-500 text-rose-900 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-950 text-xs rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Record Vital Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-blue-950 mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-2 text-blue-700" />
          Log Patient Health Measurement
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Vital Measurement Type</label>
              <select
                value={readingType}
                onChange={(e) => setReadingType(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
              >
                <option value="blood_pressure">Coupled Blood Pressure (Systolic + Diastolic)</option>
                <option value="blood_glucose">Contextual Blood Glucose</option>
                <option value="pulse">Resting Heart Rate (Pulse)</option>
                <option value="weight">Body Weight</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Measurement Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Time of Day</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Conditional Input Fields */}
          {readingType === 'blood_pressure' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Systolic Pressure (mmHg) *</label>
                <input
                  type="number"
                  min="60"
                  max="260"
                  required
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Normal reference: 90 - 120 mmHg</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Diastolic Pressure (mmHg) *</label>
                <input
                  type="number"
                  min="40"
                  max="150"
                  required
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
                <span className="text-[10px] text-slate-400">Normal reference: 60 - 80 mmHg</span>
              </div>
            </div>
          )}

          {readingType === 'blood_glucose' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Blood Glucose Level (mg/dL) *</label>
                <input
                  type="number"
                  min="30"
                  max="600"
                  required
                  value={glucoseVal}
                  onChange={(e) => setGlucoseVal(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Measurement Context *</label>
                <select
                  value={glucoseContext}
                  onChange={(e) => setGlucoseContext(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="fasting">Fasting (Overnight / &ge; 8h no caloric intake)</option>
                  <option value="pre_meal">Pre-Meal (Before lunch/dinner)</option>
                  <option value="post_meal">Post-Meal (1-2h after food)</option>
                  <option value="bedtime">Bedtime</option>
                  <option value="random">Random / As-needed</option>
                </select>
              </div>
            </div>
          )}

          {readingType === 'pulse' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-w-sm">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Heart Rate (bpm) *</label>
              <input
                type="number"
                min="35"
                max="220"
                required
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
          )}

          {readingType === 'weight' && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-w-sm">
              <label className="text-xs font-semibold text-slate-700 block mb-1">Body Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="300"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Clinical Context / Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Measured seated after 5 min rest; digital cuff"
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
            >
              Save Vital Reading
            </button>
          </div>
        </form>
      </div>

      {/* Historical Readings Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-blue-950 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-blue-700" />
            Historical Recorded Readings ({readings.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">Patient Entered with Provenance Tags</span>
        </div>

        {readings.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No readings recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Measurement</th>
                  <th className="p-3">Recorded Result</th>
                  <th className="p-3">Context</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Trend Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-800 font-mono">{r.reading_date} {r.measurement_time}</td>
                    <td className="p-3 capitalize font-bold text-slate-700">{r.reading_type.replace('_', ' ')}</td>
                    <td className="p-3 font-mono font-bold text-blue-900">
                      {r.reading_type === 'blood_pressure' && `${r.systolic} / ${r.diastolic} mmHg`}
                      {r.reading_type === 'blood_glucose' && `${r.glucose_value} mg/dL`}
                      {r.reading_type === 'pulse' && `${r.pulse} bpm`}
                      {r.reading_type === 'weight' && `${r.weight_kg} kg`}
                    </td>
                    <td className="p-3 text-slate-600 capitalize">{r.glucose_context || r.notes || 'Routine check'}</td>
                    <td className="p-3">
                      <StatusBadge status={r.verification_status} />
                    </td>
                    <td className="p-3 text-right">
                      <CrossModuleLink to={`/trends?metric=${r.reading_type}`} label="View Trend" variant="primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyReadingsPage;
