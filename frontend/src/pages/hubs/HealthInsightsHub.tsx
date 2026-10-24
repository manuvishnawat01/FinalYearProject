import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Heart,
  Droplet,
  Sparkles
} from 'lucide-react';

export const HealthInsightsHub: React.FC = () => {
  const { selectedPatientId } = useAuth();
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const param = selectedPatientId ? `patient_id=${selectedPatientId}` : '';
        const res = await api.listReadings(param).catch(() => []);
        setReadings(res.slice(0, 6));
      } catch (err) {
        console.error('Failed to load readings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedPatientId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Health Insights"
        description="Comprehensive longitudinal analytics: multi-point vital trends, laboratory observation curves, and clinical threshold early-warning alerts."
        category="Safety & Management"
        breadcrumbs={[{ label: 'Health Insights' }]}
        primaryAction={
          <Link
            to="/trends"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition"
          >
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Open Health Trends
          </Link>
        }
        secondaryAction={
          <Link
            to="/daily-readings"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Activity className="w-4 h-4 mr-1.5 text-teal-700" />
            Log New Reading
          </Link>
        }
      />

      {/* Main Focus Card: Health Trends */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 hover:border-blue-400 hover:shadow-sm transition">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-950">Health Trends & Early Warning System</h2>
              <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
                Deterministic multi-point analysis combining daily blood pressure and glucose readings with official laboratory panels (Creatinine, HbA1c, Lipids) against evidence-based reference thresholds.
              </p>
            </div>
          </div>
          <Link
            to="/trends"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 shrink-0 shadow-xs transition"
          >
            <span>Explore Trend Charts</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {/* Quick-Launch Metric Badges */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            Quick Metric Analysis Shortcuts
          </span>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/trends?metric=blood_pressure"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 text-xs font-medium transition"
            >
              <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
              Blood Pressure (Systolic & Diastolic)
            </Link>
            <Link
              to="/trends?metric=blood_glucose"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 text-xs font-medium transition"
            >
              <Droplet className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Blood Glucose (Fasting & PP)
            </Link>
            <Link
              to="/trends?metric=HbA1c"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 text-xs font-medium transition"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 text-teal-600" />
              HbA1c (Glycated Hemoglobin)
            </Link>
            <Link
              to="/trends?metric=Creatinine"
              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 text-xs font-medium transition"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Serum Creatinine & eGFR
            </Link>
          </div>
        </div>
      </div>

      {/* Clinical Guidance on Threshold Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center space-x-2 text-blue-950 mb-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold">Hypertension Classification Rules</h3>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Readings are verified against standard clinical categories (Normal &lt;120/80, Elevated 120-129/&lt;80, Stage 1 130-139/80-89, Stage 2 &ge;140/&ge;90 mmHg).
          </p>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            A warning alert requires multiple consecutive readings above threshold to avoid false-positive spikes.
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center space-x-2 text-blue-950 mb-2">
            <Droplet className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold">Glycemic Threshold Rules</h3>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Fasting plasma glucose normal range 70–99 mg/dL. Pre-diabetes 100–125 mg/dL. Postprandial normal &lt;140 mg/dL.
          </p>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Observations are paired with context tags (Fasting vs Post-Meal) for medically valid longitudinal comparison.
          </div>
        </div>
      </div>

      {/* Recent Measurements Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-blue-950">Recent Vital Observations</h3>
          <Link
            to="/daily-readings"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center transition"
          >
            <span>View All Vitals</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
            Loading recent measurements...
          </div>
        ) : readings.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-600 font-medium">No recent vital measurements recorded.</p>
            <p className="text-[11px] text-slate-400 mt-1">Record daily blood pressure or blood sugar in Daily Vitals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {readings.map((r, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-950 capitalize">{r.reading_type.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-500">
                    {r.recorded_at ? new Date(r.recorded_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <div className="mt-1 text-sm font-extrabold text-blue-900 font-mono">
                  {r.value_primary}{r.value_secondary ? `/${r.value_secondary}` : ''} {r.unit}
                </div>
                {r.clinical_flag && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {r.clinical_flag}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthInsightsHub;
