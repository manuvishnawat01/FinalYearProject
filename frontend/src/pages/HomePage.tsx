import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  HeartPulse,
  FolderHeart,
  Pill,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Clock,
  User,
  ChevronRight,
  UploadCloud,
  Activity,
  FileText
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user, selectedPatientId } = useAuth();
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const param = selectedPatientId ? `patient_id=${selectedPatientId}` : '';
        const events = await api.getTimeline(param).catch(() => []);
        setRecentEvents(events.slice(0, 3));
      } catch {
        setRecentEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchRecent();
  }, [selectedPatientId]);

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-4 sm:py-6">
      {/* Calm & Welcoming Header Section */}
      <section className="text-center sm:text-left space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-xs font-semibold mb-1">
          <HeartPulse className="w-3.5 h-3.5 text-blue-700" />
          <span>MediChronicle AI • Connected Health Assistant</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">
          Your Health, Organized.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          A secure, intelligent companion for your medical journey. Store your clinical reports, monitor medication safety, track vital trends over time, and prepare for doctor visits with clarity and confidence.
        </p>
      </section>

      {/* Four Prominent Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: My Health Records */}
        <Link
          to="/health-records"
          className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-500 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition">
                <FolderHeart className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition flex items-center">
                Explore Records <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h2 className="text-lg font-bold text-blue-950 mb-2">My Health Records</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Your lifelong medical memory. Consolidate doctor summaries, diagnostic lab reports, and daily readings into a unified chronological history.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Health History</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Medical Reports</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Daily Vitals</span>
          </div>
        </Link>

        {/* Card 2: Medicines & Safety */}
        <Link
          to="/medicines-safety"
          className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-500 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition">
                <Pill className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-teal-700 group-hover:translate-x-0.5 transition flex items-center">
                Review Medicines <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h2 className="text-lg font-bold text-blue-950 mb-2">Medicines & Safety</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Protect against duplicate active salts and drug interactions. Track dietary supplements alongside medications and audit regimen changes over time.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Safety Checker</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Supplements</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Regimen History</span>
          </div>
        </Link>

        {/* Card 3: Reports & AI Assistant */}
        <Link
          to="/reports-assistant"
          className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-500 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:text-white transition">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-indigo-700 group-hover:translate-x-0.5 transition flex items-center">
                Open Assistant <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h2 className="text-lg font-bold text-blue-950 mb-2">Reports & AI Assistant</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Clear clinical explanations in English and Hindi. Verify prescriptions against dispensed packages, log symptoms, and prepare tailored agendas for your next appointment.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Report Explainer (EN/HI)</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Prescription Checker</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Doctor Visit Prep</span>
          </div>
        </Link>

        {/* Card 4: Health Insights */}
        <Link
          to="/health-insights"
          className="group p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-500 transition-all duration-200 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition flex items-center">
                View Trends <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </span>
            </div>
            <h2 className="text-lg font-bold text-blue-950 mb-2">Health Insights</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              Visual longitudinal trends for blood pressure, blood glucose, kidney markers, and metabolic parameters with clinical early-warning thresholds.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Health Trends</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Vital Patterns</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">Clinical Thresholds</span>
          </div>
        </Link>
      </section>

      {/* Small Optional Recent Activity Section (Only shown when relevant data is present) */}
      {!loadingEvents && recentEvents.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recent Health Activity
              </h3>
            </div>
            <Link
              to="/timeline"
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center transition"
            >
              <span>View full history</span>
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentEvents.map((evt, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-medium text-blue-950 truncate">{evt.title || evt.description}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">
                    • {evt.category || 'Record'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-3">
                  {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Compact Quick Navigation to Settings & Privacy */}
      <section className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 text-slate-600">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
            {user?.full_name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-semibold text-blue-950 block">{user?.full_name}</span>
            <span className="text-[11px] text-slate-500">Need caregiver permissions, AI audits, or cost tracking?</span>
          </div>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-900 font-semibold hover:border-blue-300 shadow-2xs transition shrink-0"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
          Settings & Privacy
        </Link>
      </section>
    </div>
  );
};

export default HomePage;
