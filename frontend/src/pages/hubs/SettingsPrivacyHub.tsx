import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import {
  Users,
  ShieldCheck,
  DollarSign,
  User,
  LogOut,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  Lock
} from 'lucide-react';

export const SettingsPrivacyHub: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Settings & Privacy"
        description="Patient account details, caregiver delegation with fine-grained access permissions, AI audit trails, and healthcare expense tracking."
        category="Safety & Management"
        breadcrumbs={[{ label: 'Settings & Privacy' }]}
        primaryAction={
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </button>
        }
      />

      {/* Profile & Account Information Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <h3 className="text-sm font-bold text-blue-950 mb-4 flex items-center">
          <User className="w-4 h-4 mr-2 text-blue-700" />
          Active Account Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</span>
            <span className="font-bold text-blue-950 text-sm">{user?.full_name || 'Patient'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</span>
            <span className="font-mono text-slate-700">{user?.email || 'N/A'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assigned Role</span>
            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              {user?.role || 'Patient'}
            </span>
          </div>
        </div>
      </div>

      {/* Settings & Privacy Destination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Family Access */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Family Access</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Delegate records to trusted caregivers or family members with granular view-only or edit permissions and complete revocability.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Invite family caregivers securely</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Independent audit log of all access</span>
              </div>
            </div>
          </div>
          <Link
            to="/family"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition"
          >
            <span>Manage Family Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: AI Sources & Activity */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">AI Sources & Activity</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Zero-trust medical transparency logs. Trace every clinical statement, confidence score, and medical guideline source url.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Deterministic audit trail per module</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Live medical domain validation</span>
              </div>
            </div>
          </div>
          <Link
            to="/ai-transparency"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition"
          >
            <span>Open AI Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Healthcare Cost Tracker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Healthcare Cost Tracker</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Record diagnostic test, pharmacy, and doctor fees. Identify duplicate lab tests within clinical validity windows to eliminate redundant spending.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2" />
                <span>Category-based expense summaries</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-2" />
                <span>Automated duplicate-test detector</span>
              </div>
            </div>
          </div>
          <Link
            to="/expenses"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <span>View Expense Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SettingsPrivacyHub;
