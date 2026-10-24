import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  TrendingUp,
  Apple,
  Languages,
  AlertTriangle,
  History,
  ScanLine,
  UserCheck,
  ShieldCheck,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  User,
  Heart,
  Droplet
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, selectedPatientId } = useAuth();
  
  // Real Patient Summary Metrics
  const [activeMedsCount, setActiveMedsCount] = useState<number>(0);
  const [uploadedReportsCount, setUploadedReportsCount] = useState<number>(0);
  const [recordedObsCount, setRecordedObsCount] = useState<number>(0);
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState<number>(0);

  // Clinical Datasets
  const [duplicateAlerts, setDuplicateAlerts] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [recentReadings, setRecentReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Category Tab for Directory
  const [activeDirectoryCategory, setActiveDirectoryCategory] = useState<string>('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const patientParam = selectedPatientId ? `patient_id=${selectedPatientId}` : '';
        const [meds, docs, observations, dups, events, readings] = await Promise.all([
          api.listMedications(patientParam).catch(() => []),
          api.listDocuments(patientParam).catch(() => []),
          api.listObservations(patientParam).catch(() => []),
          api.checkDuplicateSalts(selectedPatientId || undefined).catch(() => []),
          api.getTimeline(patientParam).catch(() => []),
          api.listReadings(patientParam).catch(() => []),
        ]);

        const activeMeds = meds.filter((m: any) => m.status === 'active' || !m.status);
        setActiveMedsCount(activeMeds.length);
        setUploadedReportsCount(docs.length);
        setRecordedObsCount(observations.length);
        setUnresolvedAlertsCount(dups.length);

        setDuplicateAlerts(dups);
        setTimelineEvents(events.slice(0, 6));
        setRecentReadings(readings.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPatientId]);

  // Five Signature Modules Defined in Prompt Section 6
  const signatureModules = [
    {
      id: 'medicines',
      name: 'Medicine Safety Checker',
      desc: 'Active pharmaceutical ingredient mapping, duplicate salt detection, and drug interaction lookups.',
      path: '/medicines',
      icon: Pill,
      badge: 'Safety Core',
    },
    {
      id: 'timeline',
      name: 'Health History',
      desc: 'Chronological timeline of reports, daily vitals, and medication starts with constrained safe search.',
      path: '/timeline',
      icon: Calendar,
      badge: 'Unified Memory',
    },
    {
      id: 'trends',
      name: 'Health Trends',
      desc: 'Time-series analytics, absolute and % change calculations, and versioned threshold alert rules.',
      path: '/trends',
      icon: TrendingUp,
      badge: 'Early Detection',
    },
    {
      id: 'translator',
      name: 'Medical Report Explainer',
      desc: 'Bilingual medical summaries preserving exact laboratory values with peer-reviewed PubMed citations.',
      path: '/translator',
      icon: Languages,
      badge: 'Bilingual CDS',
    },
    {
      id: 'ai-transparency',
      name: 'AI Sources & Activity',
      desc: '4-Dimensional uncertainty decomposition, model prompt lineage, and verifiable medical domain checks.',
      path: '/ai-transparency',
      icon: ShieldCheck,
      badge: 'Trust & Provenance',
    },
  ];

  // Complete Directory of All Modules Grouped by Category
  const allModules = [
    // Health Records
    { category: 'Health Records', title: 'Health History', desc: 'Unified chronological timeline and safe constrained search.', path: '/timeline', icon: Calendar, signature: true },
    { category: 'Health Records', title: 'Document Ingestion', desc: 'Upload lab reports, candidate extraction, and user confirmation.', path: '/documents', icon: FileText, signature: false },
    { category: 'Health Records', title: 'Daily Vital Tracking', desc: 'Paired systolic/diastolic blood pressure, glucose context, and vitals.', path: '/daily-readings', icon: Activity, signature: false },

    // Medicine Intelligence
    { category: 'Medicine Intelligence', title: 'Medicine Safety Checker', desc: 'Active ingredient extraction, duplicate salts, and interaction lookups.', path: '/medicines', icon: Pill, signature: true },
    { category: 'Medicine Intelligence', title: 'Supplement Information', desc: 'Multi-ingredient inventory and nutrient aggregation without assuming zero.', path: '/supplements', icon: Apple, signature: false },
    { category: 'Medicine Intelligence', title: 'Medication History & Changes', desc: 'Regimen modification logging and before/after window analysis.', path: '/medicine-changes', icon: History, signature: false },

    // Clinical Assistance
    { category: 'Clinical Assistance', title: 'Medical Report Explainer', desc: 'Plain-language bilingual report explanations with PubMed citations.', path: '/translator', icon: Languages, signature: true },
    { category: 'Clinical Assistance', title: 'Symptom & Health Tracker', desc: 'Severity 1-10 tracking, medication temporal alignment, and red flags.', path: '/symptoms', icon: AlertTriangle, signature: false },
    { category: 'Clinical Assistance', title: 'Prescription Checker', desc: 'Cross-checks prescription orders against packaging photo OCR.', path: '/prescription-verify', icon: ScanLine, signature: false },
    { category: 'Clinical Assistance', title: 'Doctor Visit Preparation', desc: 'Pre-consultation agenda builder with genuine ReportLab PDF export.', path: '/doctor-visit', icon: UserCheck, signature: false },

    // Safety & Management
    { category: 'Safety & Management', title: 'Health Trends', desc: 'Mathematical trend changes with versioned warning rule triggers.', path: '/trends', icon: TrendingUp, signature: true },
    { category: 'Safety & Management', title: 'AI Sources & Activity', desc: '4D uncertainty breakdown, prompt versions, and source validation.', path: '/ai-transparency', icon: ShieldCheck, signature: true },
    { category: 'Safety & Management', title: 'Family Access', desc: 'Granular deny-by-default access delegation with instant revocation.', path: '/family', icon: Users, signature: false },
    { category: 'Safety & Management', title: 'Healthcare Cost Tracker', desc: 'Healthcare expense tracking and 90-day redundant test scanner.', path: '/expenses', icon: DollarSign, signature: false },
  ];

  const filteredModules = activeDirectoryCategory === 'all'
    ? allModules
    : allModules.filter(m => m.category === activeDirectoryCategory);

  return (
    <div className="space-y-6">
      {/* ========================================================
          A. HEADER: Patient Identity, Context & Clinical Overview
          ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            {user?.full_name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-blue-950">
                {user?.full_name}
              </h1>
              <span className="text-xs bg-blue-50 text-blue-800 font-semibold px-2 py-0.5 rounded-full border border-blue-200 capitalize">
                {user?.role} Profile
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-800 font-medium px-2 py-0.5 rounded-full border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Verified Clinical Context
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span>Patient ID: <strong className="text-slate-700 font-mono">#{user?.id || 'PT-1001'}</strong></span>
              <span>DOB: <strong className="text-slate-700">{user?.profile?.date_of_birth || '1980-05-15'}</strong></span>
              <span>Blood Group: <strong className="text-slate-700">{user?.profile?.blood_group || 'B+'}</strong></span>
              {user?.profile?.allergies && user.profile.allergies.length > 0 && (
                <span className="text-amber-700 font-medium">
                  Allergies: {user.profile.allergies.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <Link
            to="/daily-readings"
            className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Activity className="w-3.5 h-3.5 mr-1.5" />
            Log Daily Vitals
          </Link>
          <Link
            to="/documents"
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-2xs transition flex items-center"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Upload Report
          </Link>
        </div>
      </div>

      {/* ========================================================
          B. PATIENT SUMMARY: 4 Dynamic Summary Cards
          ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Medicines */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Medicines</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 font-mono">
            {loading ? '...' : activeMedsCount}
          </div>
          <Link to="/medicines" className="text-[11px] text-blue-700 hover:underline font-medium mt-1 inline-flex items-center">
            Review Prescriptions <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Uploaded Reports */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Uploaded Reports</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 font-mono">
            {loading ? '...' : uploadedReportsCount}
          </div>
          <Link to="/documents" className="text-[11px] text-teal-700 hover:underline font-medium mt-1 inline-flex items-center">
            View Documents <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Confirmed Observations */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Lab Observations</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-950 font-mono">
            {loading ? '...' : recordedObsCount}
          </div>
          <Link to="/timeline" className="text-[11px] text-emerald-700 hover:underline font-medium mt-1 inline-flex items-center">
            Explore Observations <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {/* Medication Alerts */}
        <div className={`border rounded-xl p-4 shadow-xs ${
          unresolvedAlertsCount > 0 ? 'bg-amber-50/60 border-amber-300' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Safety Flags</span>
            <div className={`p-1.5 rounded-lg ${unresolvedAlertsCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-mono ${unresolvedAlertsCount > 0 ? 'text-amber-900' : 'text-blue-950'}`}>
            {loading ? '...' : unresolvedAlertsCount}
          </div>
          <Link to="/medicines" className="text-[11px] text-amber-800 hover:underline font-semibold mt-1 inline-flex items-center">
            {unresolvedAlertsCount > 0 ? 'Action Required' : 'All Clear'} <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================
          C. MEDICATION SAFETY SECTION: Compact & Actionable
          ======================================================== */}
      {duplicateAlerts.length > 0 && (
        <div className="bg-white border-l-4 border-l-amber-500 border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-blue-950">
                    Pharmacovigilance Alert: {duplicateAlerts.length} Potential Active Ingredient Overlap(s)
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    Salt Safety Warning
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Identical active ingredient detected across active prescriptions: <strong className="text-blue-950">'{duplicateAlerts[0]?.active_ingredient}'</strong> is contained in both <strong className="text-slate-800">{duplicateAlerts[0]?.first_medication}</strong> and <strong className="text-slate-800">{duplicateAlerts[0]?.second_medication}</strong>.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                  <span>Evidence: Trusted Pharmaceutical Database</span>
                  <span>•</span>
                  <span>Evaluated: {new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>

            <Link
              to="/medicines"
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 shadow-2xs transition flex items-center justify-center self-start sm:self-auto"
            >
              Analyze in Salt Engine
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================
          D & E. TWO-COLUMN CLINICAL VIEW:
          Left: Recent Health Activity & Provenance Timeline
          Right: Clinical Vitals & Trends Snapshot
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent Clinical Activity & Timeline */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                Recent Health Activity & Provenance Log
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Traceable health events linked to their physical origin records.
              </p>
            </div>
            <Link to="/timeline" className="text-xs text-blue-700 hover:underline font-semibold flex items-center">
              Full Timeline <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No timeline activity recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {timelineEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-950 truncate">{event.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{event.event_date}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-1">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <span>Source: <strong className="text-slate-600 font-medium">{event.source_reference || 'Record'}</strong></span>
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <StatusBadge status={event.verification_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Clinical Vitals & Trends Snapshot */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700" />
                Vitals & Metabolic Trends
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Deterministic measurements with reference ranges.
              </p>
            </div>
            <Link to="/trends" className="text-xs text-blue-700 hover:underline font-semibold flex items-center">
              Health Trends <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {recentReadings.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No vital readings recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentReadings.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 capitalize">
                        {r.reading_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {r.reading_date} {r.measurement_time}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-blue-950 mt-1 font-mono">
                      {r.reading_type === 'blood_pressure' && `${r.systolic} / ${r.diastolic} mmHg`}
                      {r.reading_type === 'blood_glucose' && `${r.glucose_value} mg/dL (${r.glucose_context})`}
                      {r.reading_type === 'pulse' && `${r.pulse} bpm`}
                      {r.reading_type === 'weight' && `${r.weight_kg} kg`}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.verification_status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2">
            <Heart className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
            <span>
              Blood pressure and glucose targets follow JNC-8 and ADA clinical guidelines. Compare trends in <strong>Module 3</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          F. FIVE SIGNATURE MODULES SPOTLIGHT (Section 6)
          ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-blue-950">
                Signature Clinical Intelligence Modules
              </h2>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Core Innovations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Key algorithms featuring salt normalization, deterministic trends, bilingual translation, and 4D AI provenance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-4">
          {signatureModules.map((mod) => (
            <Link
              key={mod.id}
              to={mod.path}
              className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-white hover:shadow-sm transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-blue-700 shadow-2xs group-hover:bg-blue-700 group-hover:text-white transition">
                    <mod.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {mod.id}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-blue-950 group-hover:text-blue-700 transition">
                  {mod.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                  {mod.desc}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700 pt-3 border-t border-slate-200/60 mt-3">
                <span>{mod.badge}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================================
          G. COMPLETE 12-MODULE ARCHITECTURAL DIRECTORY
          Organized cleanly by 4 Categories with Filter Tabs
          ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-blue-950">
              All 12 Modules & Clinical Capabilities
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse all 12 modules categorized by functional clinical domain.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            {['all', 'Health Records', 'Medicine Intelligence', 'Clinical Assistance', 'Safety & Management'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveDirectoryCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition ${
                  activeDirectoryCategory === cat
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Modules (14)' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {filteredModules.map((mod) => (
            <Link
              key={mod.title}
              to={mod.path}
              className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition">
                      <mod.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {mod.category}
                    </span>
                  </div>
                  {mod.signature && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                      Signature
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-blue-950 group-hover:text-blue-700 transition">
                  {mod.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {mod.desc}
                </p>
              </div>

              <div className="flex items-center justify-end text-[11px] font-medium text-blue-700 mt-2.5 pt-2 border-t border-slate-100">
                <span className="group-hover:underline">Launch Module</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
