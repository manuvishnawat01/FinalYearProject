import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import {
  Calendar,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  FileText,
  Activity,
  Pill,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  Languages,
  X
} from 'lucide-react';

export const HealthTimelinePage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);

  // Comparison state
  const [observations, setObservations] = useState<any[]>([]);
  const [selectedObsIds, setSelectedObsIds] = useState<number[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (category) params.append('event_category', category);

      const [data, obsList] = await Promise.all([
        api.getTimeline(params.toString()),
        api.listObservations(),
      ]);
      setEvents(data);
      setObservations(obsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [startDate, endDate, category]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchHistory(searchQuery);
      setSearchResults(res);
    } catch (err: any) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleSelectObs = (id: number) => {
    if (selectedObsIds.includes(id)) {
      setSelectedObsIds(selectedObsIds.filter((x) => x !== id));
    } else {
      setSelectedObsIds([...selectedObsIds, id]);
    }
  };

  const handleCompare = async () => {
    if (selectedObsIds.length < 2) {
      alert('Please select at least two compatible observations to compare.');
      return;
    }
    try {
      const res = await api.compareObservations(selectedObsIds);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Comparison error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health History"
        description="Unified, searchable chronological record combining uploaded reports, confirmed laboratory observations, daily vitals, and medication regimens with strict data provenance."
        category="Health Records"
        isSignature={true}
        breadcrumbs={[{ label: 'Health History' }]}
        secondaryAction={
          <CrossModuleLink to="/trends" label="View in Health Trends" variant="primary" size="sm" />
        }
      />

      {/* Constrained Natural Language Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-blue-950 mb-1 flex items-center">
          <Search className="w-4 h-4 mr-2 text-blue-700" />
          Constrained Safe Patient History Search
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Queries translate into validated database parameters over authenticated records. If no matching facts exist, the system clearly reports none found without hallucination.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Try: 'Show my HbA1c results' or 'creatinine' or 'glucose fasting' or 'blood pressure'..."
            className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
          >
            {searching ? 'Querying...' : 'Search History'}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-blue-950">{searchResults.message}</span>
              <button
                onClick={() => setSearchResults(null)}
                className="text-slate-400 hover:text-slate-700 text-xs flex items-center"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Dismiss
              </button>
            </div>

            {searchResults.observations?.length > 0 && (
              <div>
                <p className="font-semibold text-blue-950 mb-1.5">Laboratory Observations Found:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {searchResults.observations.map((o: any) => (
                    <div key={o.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900">{o.name}: </span>
                        <span className="text-blue-700 font-semibold">{o.value} {o.unit}</span>
                        <span className="text-slate-500 block text-[11px]">Date: {o.date} (Range: {o.reference_range || 'N/A'})</span>
                      </div>
                      <CrossModuleLink to={`/trends?metric=${encodeURIComponent(o.name)}`} label="Analyze Trend" variant="primary" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.readings?.length > 0 && (
              <div>
                <p className="font-semibold text-teal-900 mb-1.5">Daily Readings Found:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {searchResults.readings.map((r: any) => (
                    <div key={r.id} className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="font-bold capitalize text-slate-900">{r.type.replace('_', ' ')}: </span>
                      <span className="text-teal-700 font-semibold font-mono">
                        {r.type === 'blood_pressure' && `${r.systolic}/${r.diastolic} mmHg`}
                        {r.type === 'blood_glucose' && `${r.glucose_value} mg/dL (${r.glucose_context})`}
                      </span>
                      <span className="text-slate-500 block text-[11px]">Recorded: {r.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Observation Comparison Tool */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-blue-950 flex items-center">
            <ArrowUpDown className="w-4 h-4 mr-2 text-teal-700" />
            Historical Observation Comparison (Select 2+ Compatible Observations)
          </h3>
          <button
            onClick={handleCompare}
            disabled={selectedObsIds.length < 2}
            className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-40 self-start sm:self-auto"
          >
            Compare Selected ({selectedObsIds.length})
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Compares compatible observations across dates, verifies matching units, and computes absolute & percentage change without zero-baseline math errors.
        </p>

        {/* Observations Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto custom-scrollbar p-2 bg-slate-50 rounded-lg border border-slate-200">
          {observations.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 col-span-3 text-center">No confirmed observations available to compare.</p>
          ) : (
            observations.map((obs) => {
              const isSelected = selectedObsIds.includes(obs.id);
              return (
                <div
                  key={obs.id}
                  onClick={() => handleToggleSelectObs(obs.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold truncate">{obs.observation_name}</span>
                    <span className="font-mono font-semibold text-blue-700 shrink-0 ml-1">{obs.value} {obs.unit}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>{obs.observation_date}</span>
                    <span className="capitalize">{obs.verification_status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comparison Output */}
        {comparisonResult && (
          <div className="mt-4 p-4 bg-blue-50/50 border border-blue-200 rounded-lg text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-blue-200">
              <span className="font-bold text-blue-950">
                Comparison: {comparisonResult.observation_name} ({comparisonResult.unit})
              </span>
              <button onClick={() => setComparisonResult(null)} className="text-slate-400 hover:text-slate-600 text-xs">
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Earliest Value ({comparisonResult.earliest_date})</span>
                <span className="text-base font-bold text-slate-900 font-mono">{comparisonResult.earliest_value} {comparisonResult.unit}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Latest Value ({comparisonResult.latest_date})</span>
                <span className="text-base font-bold text-slate-900 font-mono">{comparisonResult.latest_value} {comparisonResult.unit}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Mathematical Change</span>
                <span className={`text-base font-bold font-mono ${comparisonResult.absolute_change >= 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                  {comparisonResult.absolute_change > 0 ? `+${comparisonResult.absolute_change}` : comparisonResult.absolute_change} {comparisonResult.unit}
                  {comparisonResult.percentage_change !== null && ` (${comparisonResult.percentage_change > 0 ? '+' : ''}${comparisonResult.percentage_change}%)`}
                </span>
              </div>
            </div>

            {comparisonResult.percentage_change_explanation && (
              <p className="text-[11px] text-slate-600 italic">
                * {comparisonResult.percentage_change_explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Timeline Controls & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded p-1 bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded p-1 bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-slate-300 rounded p-1 bg-white text-slate-800"
            >
              <option value="">All Categories</option>
              <option value="report_upload">Uploaded Reports</option>
              <option value="laboratory_observation">Laboratory Observations</option>
              <option value="daily_reading">Daily Health Readings</option>
              <option value="medication_start">Medication Regimens</option>
              <option value="interaction_alert">Interaction Safety Alerts</option>
            </select>
          </div>
        </div>

        {(startDate || endDate || category) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setCategory(''); }}
            className="text-xs text-blue-700 hover:underline font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Chronological Timeline Stream */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider flex items-center justify-between">
          <span>Unified Health Events ({events.length})</span>
          {loading && <span className="text-xs font-normal text-slate-400">Loading timeline stream...</span>}
        </h3>

        {events.length === 0 && !loading && (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No health events found matching the selected filter criteria.
          </div>
        )}

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200">
          {events.map((event) => (
            <div key={event.id} className="relative pl-10">
              {/* Timeline Marker Dot */}
              <div className="absolute left-3.5 top-3.5 w-3.5 h-3.5 rounded-full bg-blue-700 border-2 border-white shadow-xs shrink-0" />

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded capitalize">
                      {event.event_category?.replace('_', ' ') || 'Event'}
                    </span>
                    <h4 className="font-bold text-blue-950 text-sm">{event.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">{event.event_date}</span>
                    <StatusBadge status={event.verification_status} />
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {event.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                  <span>Source Reference: <strong className="text-slate-600">{event.source_reference || 'Record Entry'}</strong></span>
                  {event.event_category === 'medication_start' && (
                    <CrossModuleLink to="/medicines" label="View in Salt Engine" variant="primary" />
                  )}
                  {event.event_category === 'report_upload' && (
                    <CrossModuleLink to="/translator" label="Translate Report" variant="secondary" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthTimelinePage;
