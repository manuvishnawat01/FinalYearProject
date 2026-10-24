import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import {
  Languages,
  ScanLine,
  UserCheck,
  AlertTriangle,
  UploadCloud,
  FileText,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

export const ReportsAssistantHub: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Reports & AI Assistant"
        description="Clinical intelligence tools: translate and explain complex laboratory reports in English or Hindi, verify dispensed prescriptions, prepare doctor visit agendas, and track symptoms."
        category="Clinical Assistance"
        breadcrumbs={[{ label: 'Reports & AI Assistant' }]}
        primaryAction={
          <Link
            to="/documents"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition"
          >
            <UploadCloud className="w-4 h-4 mr-1.5" />
            Upload New Report
          </Link>
        }
        secondaryAction={
          <Link
            to="/doctor-visit"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <UserCheck className="w-4 h-4 mr-1.5 text-teal-700" />
            Prepare Visit Agenda
          </Link>
        }
      />

      {/* Main Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Feature 1: Medical Report Explainer */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Languages className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2 mb-1.5">
              <h2 className="text-base font-bold text-blue-950">Medical Report Explainer</h2>
              <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                EN & HI
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Translate complex lab reports, CBCs, lipid panels, and metabolic panels into understandable language. Every finding links to peer-reviewed clinical sources.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Plain English and conversational Hindi translations</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>PubMed & CDC evidence citations</span>
              </div>
            </div>
          </div>
          <Link
            to="/translator"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition"
          >
            <span>Open Report Explainer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feature 2: Prescription Checker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <ScanLine className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Prescription Checker</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Compare doctor prescriptions with actual dispensed medicine packaging. Verify brand, salt, dosage, frequency, and route to prevent dispensing errors.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-2" />
                <span>Deterministic salt & dosage matching</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-2" />
                <span>Mismatch & substitution detection</span>
              </div>
            </div>
          </div>
          <Link
            to="/prescription-verify"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-purple-50 text-purple-800 text-xs font-semibold hover:bg-purple-100 transition"
          >
            <span>Verify Prescription</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feature 3: Doctor Visit Preparation */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Doctor Visit Preparation</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Generate structured, 1-page clinical visit agendas with vital trends, active medications, duplicate alerts, and targeted questions for your doctor.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Exportable clean PDF summary</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Custom doctor specialty targeting</span>
              </div>
            </div>
          </div>
          <Link
            to="/doctor-visit"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition"
          >
            <span>Generate Visit Summary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feature 4: Symptom & Health Tracker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Symptom & Health Tracker</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Log health complaints and symptoms with severity ratings. The correlator checks onset timelines against recent medication starts or altered dosages.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2" />
                <span>Side effect timeline correlation</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-2" />
                <span>Clear clinical provenance disclaimer</span>
              </div>
            </div>
          </div>
          <Link
            to="/symptoms"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
          >
            <span>Track Symptoms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feature 5: Upload Medical Report */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Upload Medical Report</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Submit newly received lab panels, discharge summaries, imaging reports, and clinic invoices for automated observation parsing.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-2" />
                <span>Supports PDF, JPG, PNG formats</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-2" />
                <span>Automatic observation extraction</span>
              </div>
            </div>
          </div>
          <Link
            to="/documents"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition"
          >
            <span>Upload Document</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReportsAssistantHub;
