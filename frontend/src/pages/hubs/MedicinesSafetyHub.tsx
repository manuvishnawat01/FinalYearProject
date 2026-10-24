import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { PageHeader } from '../../components/PageHeader';
import {
  Pill,
  Apple,
  History,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const MedicinesSafetyHub: React.FC = () => {
  const { selectedPatientId } = useAuth();
  const [activeMeds, setActiveMeds] = useState<any[]>([]);
  const [duplicateAlerts, setDuplicateAlerts] = useState<any[]>([]);
  const [supplementsCount, setSupplementsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const param = selectedPatientId ? `patient_id=${selectedPatientId}` : '';
        const [meds, dups, supps] = await Promise.all([
          api.listMedications(param).catch(() => []),
          api.checkDuplicateSalts(selectedPatientId || undefined).catch(() => []),
          api.listSupplements(param).catch(() => []),
        ]);
        setActiveMeds(meds.filter((m: any) => m.status === 'active' || !m.status));
        setDuplicateAlerts(dups);
        setSupplementsCount(supps.length);
      } catch (err) {
        console.error('Failed to load medicines overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedPatientId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Medicines & Safety"
        description="Comprehensive pharmacological safety suite: active salt decomposition, duplicate ingredient alerts, drug-supplement interactions, and regimen change tracking."
        category="Medicine Intelligence"
        breadcrumbs={[{ label: 'Medicines & Safety' }]}
        primaryAction={
          <Link
            to="/medicines"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition"
          >
            <Pill className="w-4 h-4 mr-1.5" />
            Check Medicines
          </Link>
        }
        secondaryAction={
          <Link
            to="/supplements"
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Apple className="w-4 h-4 mr-1.5 text-teal-700" />
            Add Supplement
          </Link>
        }
      />

      {/* Duplicate Ingredient Alert Banner if active */}
      {duplicateAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Potential Duplicate Active Ingredient Warning ({duplicateAlerts.length})
            </h4>
            <p className="text-xs text-amber-900 mt-1">
              MediChronicle detected overlapping active chemical salts across your registered medications. Duplicate salts may result in accidental dosage compounding.
            </p>
            <div className="mt-2.5">
              <Link
                to="/medicines"
                className="inline-flex items-center text-xs font-semibold text-amber-950 underline hover:text-amber-800"
              >
                Review safety analysis in Medicine Safety Checker &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Medicine Safety Checker */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
              <Pill className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Medicine Safety Checker</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Break down commercial brand names into active pharmaceutical ingredients (salts). Detect exact duplicate molecules and dangerous drug-drug interactions.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Active Prescriptions: <strong className="text-slate-700">{activeMeds.length}</strong></span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-2" />
                <span>Verified drug-drug interaction engine</span>
              </div>
            </div>
          </div>
          <Link
            to="/medicines"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition"
          >
            <span>Open Safety Checker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Supplement Information */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Apple className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Supplement Information</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Log vitamins, minerals, and herbal supplements. Cross-reference potential nutrient-drug interactions and verified evidence levels from medical literature.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Recorded Supplements: <strong className="text-slate-700">{supplementsCount}</strong></span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mr-2" />
                <span>Nutrient overlap & RDA safety checks</span>
              </div>
            </div>
          </div>
          <Link
            to="/supplements"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition"
          >
            <span>View Supplements</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Medication History & Changes */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-blue-950 mb-1.5">Medication History & Changes</h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Audit the full history of medicine additions, stops, and dosage modifications. Correlate clinical impacts on vitals before and after each regimen update.
            </p>
            <div className="text-[11px] text-slate-500 space-y-1 mb-4">
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2" />
                <span>Pre/post dosage vital analysis</span>
              </div>
              <div className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mr-2" />
                <span>Audit trail with physician rationale</span>
              </div>
            </div>
          </div>
          <Link
            to="/medicine-changes"
            className="w-full inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition"
          >
            <span>Open History & Changes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Active Medications Quick Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Pill className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-blue-950">Current Registered Medicines</h3>
          </div>
          <Link
            to="/medicines"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center transition"
          >
            <span>Manage All Medicines</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-500 animate-pulse">
            Loading active medications...
          </div>
        ) : activeMeds.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-600 font-medium">No active medications registered.</p>
            <p className="text-[11px] text-slate-400 mt-1">Register medicines in the Medicine Safety Checker to monitor active salts and interactions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeMeds.map((med, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-blue-950">{med.brand_name || med.name}</h4>
                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                    {med.dosage || 'Standard'}
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 font-mono mt-1">
                  Salt: {med.generic_salt || med.salt_composition || 'Standard Ingredient'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Schedule: {med.frequency || 'As directed'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicinesSafetyHub;
