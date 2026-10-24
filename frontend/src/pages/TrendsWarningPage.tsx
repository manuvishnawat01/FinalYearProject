import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { TrendingUp, AlertTriangle, ShieldAlert, CheckCircle, Info, Activity, Clock, Sparkles } from 'lucide-react';

export const TrendsWarningPage: React.FC = () => {
  const [metric, setMetric] = useState('blood_pressure');
  const [glucoseContext, setGlucoseContext] = useState('fasting');
  const [trendResult, setTrendResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await api.getTrendSeries({
        metric_name: metric,
        glucose_context: metric === 'blood_glucose' ? glucoseContext : undefined,
      });
      setTrendResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [metric, glucoseContext]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Trends"
        description="Identifies meaningful changes in health measurements over time with deterministic, transparent calculations. Uses versioned clinical rules for alerts without fabricating disease diagnoses."
        category="Safety & Management"
        isSignature={true}
        breadcrumbs={[{ label: 'Health Trends' }]}
        primaryAction={
          <CrossModuleLink to="/daily-readings" label="Log New Vital" variant="primary" size="sm" />
        }
        secondaryAction={
          <CrossModuleLink to="/medicine-changes" label="Medication Changes" variant="secondary" size="sm" />
        }
      />

      {/* Metric Selector Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Target Clinical Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg p-2 font-medium bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
            >
              <option value="blood_pressure">Blood Pressure (Systolic / Diastolic)</option>
              <option value="blood_glucose">Blood Glucose (Contextual)</option>
              <option value="hba1c">HbA1c (Glycated Hemoglobin)</option>
              <option value="creatinine">Serum Creatinine</option>
            </select>
          </div>

          {metric === 'blood_glucose' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Glucose Clinical Context</label>
              <select
                value={glucoseContext}
                onChange={(e) => setGlucoseContext(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg p-2 font-medium bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
              >
                <option value="fasting">Fasting</option>
                <option value="post_meal">Post-Meal</option>
                <option value="pre_meal">Pre-Meal</option>
                <option value="bedtime">Bedtime</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-mono">Statistical Method</span>
          <span className="text-xs font-semibold text-blue-950">Deterministic Math Engine</span>
        </div>
      </div>

      {/* Early Warning Alerts */}
      {trendResult?.early_warnings?.length > 0 && (
        <div className="space-y-2">
          {trendResult.early_warnings.map((w: any, idx: number) => {
            const isCrit = w.severity === 'critical';
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${
                  isCrit ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-amber-50 border-amber-300 text-amber-950'
                } shadow-xs`}
              >
                <div className="flex items-start space-x-3">
                  {isCrit ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">{w.title}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/80 border border-slate-200">
                        Rule: {w.rule_id} (v{w.rule_version})
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed">{w.message}</p>
                    <span className="text-[11px] text-slate-500 block mt-1">Source: {w.reference_source}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calculation & Summary KPIs */}
      {trendResult && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Data Points</span>
            <span className="text-xl font-bold text-blue-950 mt-1 block font-mono">
              {trendResult.data_points?.length || 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Chronologically sorted</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Observed Range (Min - Max)</span>
            <span className="text-xl font-bold text-blue-950 mt-1 block font-mono">
              {trendResult.minimum_value !== null ? `${trendResult.minimum_value} - ${trendResult.maximum_value}` : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Boundary limits</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Absolute Change</span>
            <span className="text-xl font-bold text-blue-950 mt-1 block font-mono">
              {trendResult.absolute_change !== null
                ? `${trendResult.absolute_change > 0 ? '+' : ''}${trendResult.absolute_change}`
                : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Baseline vs Latest</span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Percentage Change</span>
            <span className="text-xl font-bold text-blue-950 mt-1 block font-mono">
              {trendResult.percentage_change !== null
                ? `${trendResult.percentage_change > 0 ? '+' : ''}${trendResult.percentage_change}%`
                : 'N/A'}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Normalized calculation</span>
          </div>
        </div>
      )}

      {/* Mathematical Explanation Banner */}
      {trendResult && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 text-blue-950 text-xs rounded-lg flex items-center space-x-2 font-medium">
          <Info className="w-4 h-4 flex-shrink-0 text-blue-700" />
          <span>{trendResult.percentage_change_explanation}</span>
        </div>
      )}

      {/* Time-Series Measurements Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <h3 className="text-sm font-bold text-blue-950 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-teal-700" />
            Time-Series Observation Traceability Table
          </h3>
          <span className="text-xs text-slate-400 font-mono">All points traceable to physical records</span>
        </div>

        {trendResult?.data_points?.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No trend data points found for this selection.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3">Measurement Date</th>
                  <th className="p-3">Recorded Value</th>
                  <th className="p-3">Reported Reference Limits</th>
                  <th className="p-3">Context / Status</th>
                  <th className="p-3">Source Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trendResult?.data_points?.map((dp: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="p-3 font-semibold text-slate-800 font-mono">{dp.date} {dp.time || ''}</td>
                    <td className="p-3 font-bold text-blue-950 font-mono">
                      {dp.systolic !== null && dp.diastolic !== null
                        ? `${dp.systolic} / ${dp.diastolic} ${dp.unit}`
                        : `${dp.value} ${dp.unit || ''}`}
                    </td>
                    <td className="p-3 text-slate-500 font-mono">
                      {dp.reference_low !== null && dp.reference_high !== null
                        ? `${dp.reference_low} - ${dp.reference_high} ${dp.unit || ''}`
                        : 'Standard Reference'}
                    </td>
                    <td className="p-3 text-slate-600 capitalize">{dp.context}</td>
                    <td className="p-3 text-slate-400 font-medium">{dp.source}</td>
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

export default TrendsWarningPage;
