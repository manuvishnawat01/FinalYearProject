import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import {
  Calendar,
  FileText,
  Activity,
  UploadCloud,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  PlusCircle
} from 'lucide-react';

export const HealthRecordsHub: React.FC = () => {
  const { selectedPatientId } = useAuth();
  const [docCount, setDocCount] = useState<number>(0);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [readingCount, setReadingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      try {
        const param = selectedPatientId ? `patient_id=${selectedPatientId}` : '';
        const [docs, events, readings] = await Promise.all([
          api.listDocuments(param).catch(() => []),
          api.getTimeline(param).catch(() => []),
          api.listReadings(param).catch(() => []),
        ]);
        setDocCount(docs.length);
        setTimelineEvents(events.slice(0, 5));
        setReadingCount(readings.length);
      } catch (err) {
        console.error('Failed to load health records overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [selectedPatientId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="My Health Records"
        description="Unified chronological health memory combining laboratory reports, daily vitals, clinical observations, and doctor visit history."
        category="Health Records"
        breadcrumbs={[{ label: 'My Health Records' }]}
        primaryAction={
          <Link
            to="/documents"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload Report
          </Link>
        }
        secondaryAction={
          <Link
            to="/daily-readings"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <PlusCircle className="w-4 h-4 mr-1.5 text-teal-700" />
            Record Vitals
          </Link>
        }
      />

      {/* Main Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Health History */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Health History</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Explore your chronological health timeline with report observations, medication starts, and doctor notes. Includes constrained natural language search.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Search by date, test name, or doctor</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Compare multiple lab test observations</span>
              </div>
            </div>
          </div>
          <Link
            to="/timeline"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition"
          >
            <span>Open Health History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Document Upload & Reports */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Medical Reports & Upload</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Securely upload laboratory PDFs and prescription scans. Extract numerical test values, reference intervals, and physician observations automatically.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Total Stored Documents: <strong className="text-slate-700">{docCount}</strong></span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Automated observation verification</span>
              </div>
            </div>
          </div>
          <Link
            to="/documents"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition"
          >
            <span>View Medical Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Daily Vitals */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Daily Vitals</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Log daily blood pressure, blood glucose (fasting & postprandial), heart rate, and body weight with immediate clinical classification.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2" />
                <span>Recorded Readings: <strong className="text-slate-700">{readingCount}</strong></span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2" />
                <span>Direct link to Health Trends & Warnings</span>
              </div>
            </div>
          </div>
          <Link
            to="/daily-readings"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <span>Open Daily Vitals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Chronological Entries Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-blue-950">Recent Timeline Events</h3>
          </div>
          <Link
            to="/timeline"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center transition"
          >
            <span>View Full Timeline</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
            Loading recent chronological health records...
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-600 font-medium">No timeline events recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">Upload a medical report or log today's vitals to begin your record.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {timelineEvents.map((evt, idx) => (
              <div key={idx} className="py-3 flex items-start justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition">
                <div className="flex items-start space-x-3">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-950">{evt.title || evt.description}</p>
                    <p className="text-[11px] text-slate-500">{evt.category || 'Clinical Record'} • {evt.source || 'Verified Source'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthRecordsHub;
