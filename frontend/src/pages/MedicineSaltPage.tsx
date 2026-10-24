import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  Pill, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  CheckCircle, 
  RefreshCw, 
  WifiOff, 
  Trash2,
  Clock,
  History,
  ScanLine,
  FileText,
  Sparkles
} from 'lucide-react';

export const MedicineSaltPage: React.FC = () => {
  const [medications, setMedications] = useState<any[]>([]);
  const [duplicateAlerts, setDuplicateAlerts] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any | null>(null);
  const [simulateOutage, setSimulateOutage] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [brandName, setBrandName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [prescribedDosage, setPrescribedDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('Twice daily');
  const [timing, setTiming] = useState('After meals');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [prescriber, setPrescriber] = useState('');
  const [reason, setReason] = useState('');
  
  // Dynamic ingredients list
  const [ingredients, setIngredients] = useState<{ ingredient_name: string; strength: number; strength_unit: string }[]>([
    { ingredient_name: '', strength: 500, strength_unit: 'mg' },
  ]);

  const fetchData = async () => {
    try {
      const [meds, dups] = await Promise.all([
        api.listMedications(),
        api.checkDuplicateSalts(),
      ]);
      setMedications(meds);
      setDuplicateAlerts(dups);
      runInteractionCheck(simulateOutage);
    } catch (err) {
      console.error(err);
    }
  };

  const runInteractionCheck = async (outage: boolean) => {
    setCheckingInteractions(true);
    try {
      const res = await api.checkDrugInteractions(outage);
      setInteractions(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCheckingInteractions(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIngredientRow = () => {
    setIngredients([...ingredients, { ingredient_name: '', strength: 10, strength_unit: 'mg' }]);
  };

  const handleIngredientChange = (idx: number, field: string, value: any) => {
    const copy = [...ingredients];
    (copy[idx] as any)[field] = value;
    setIngredients(copy);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== idx));
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter((i) => i.ingredient_name.trim() !== '');
    if (validIngredients.length === 0) {
      alert('Please specify at least one active pharmaceutical ingredient (salt).');
      return;
    }

    try {
      await api.addMedication({
        brand_name: brandName,
        generic_name: genericName || undefined,
        dosage_form: dosageForm,
        prescribed_dosage: prescribedDosage,
        frequency,
        timing_instructions: timing,
        start_date: startDate,
        prescriber_name: prescriber || undefined,
        reason_for_use: reason || undefined,
        ingredients: validIngredients,
        source: 'manual_entry',
        verification_status: 'confirmed_by_user',
      });
      // Reset form
      setBrandName('');
      setGenericName('');
      setReason('');
      setIngredients([{ ingredient_name: '', strength: 500, strength_unit: 'mg' }]);
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      alert(`Error adding medication: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medicine Safety Checker"
        description="Identifies active pharmaceutical ingredients ('salts'), manages combination products, cross-checks for duplicate salts, and evaluates drug interactions using trusted references."
        category="Medicine Intelligence"
        isSignature={true}
        breadcrumbs={[{ label: 'Medicine Safety Checker' }]}
        primaryAction={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddForm ? 'Close Form' : 'Register Medication'}
          </button>
        }
        secondaryAction={
          <div className="flex items-center gap-2">
            <CrossModuleLink to="/medicine-changes" label="Medication Changes" variant="secondary" size="sm" />
            <CrossModuleLink to="/prescription-verify" label="Prescription Checker" variant="slate" size="sm" />
          </div>
        }
      />

      {/* Duplicate Salt Overlap Alert Box */}
      {duplicateAlerts.length > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-l-amber-500 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-950 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-amber-700" />
              Duplicate Salt Detection ({duplicateAlerts.length} Flagged Overlap)
            </h3>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Safety Review
            </span>
          </div>
          <div className="space-y-2">
            {duplicateAlerts.map((dup, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200 text-xs text-amber-950">
                <span className="font-bold text-amber-950">Active Salt: '{dup.active_ingredient}'</span>
                <p className="mt-0.5 text-slate-700">{dup.clinical_note}</p>
                <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-slate-600 bg-amber-50/50 p-2 rounded">
                  <span>Product A: <strong className="text-slate-900">{dup.first_medication}</strong> ({dup.first_strength})</span>
                  <span>Product B: <strong className="text-slate-900">{dup.second_medication}</strong> ({dup.second_strength})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drug Interactions Check Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-blue-950 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-blue-700" />
              Trusted Reference Drug Interaction Checker
            </h3>
            <span className="text-xs text-slate-500">Evidence Source: FDA DailyMed / NLM Standardized Formulation Database</span>
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-xs font-semibold text-rose-700 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              <input
                type="checkbox"
                checked={simulateOutage}
                onChange={(e) => {
                  setSimulateOutage(e.target.checked);
                  runInteractionCheck(e.target.checked);
                }}
                className="rounded text-rose-700"
              />
              <span className="flex items-center">
                <WifiOff className="w-3.5 h-3.5 mr-1" />
                Simulate Provider Outage
              </span>
            </label>

            <button
              onClick={() => runInteractionCheck(simulateOutage)}
              disabled={checkingInteractions}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs transition flex items-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1 text-slate-500" /> Re-check
            </button>
          </div>
        </div>

        {interactions ? (
          <div>
            {interactions.interaction_provider_status === 'unavailable' ? (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-900 space-y-1">
                <p className="font-bold flex items-center">
                  <WifiOff className="w-4 h-4 mr-1.5 text-rose-700" />
                  Interaction Check Unavailable (HTTP 503 Outage Handling)
                </p>
                <p className="text-slate-700 leading-relaxed">
                  The drug information reference provider is currently unreachable. The system does <strong>NOT</strong> falsely report "no interactions found" during an outage. Please consult your physician or pharmacist directly.
                </p>
              </div>
            ) : interactions.interactions_found.length === 0 ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-700 shrink-0" />
                <span>
                  No documented major drug–drug or drug–supplement interactions found in current active inventory ({interactions.drugs_checked?.length} agents evaluated).
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {interactions.interactions_found.map((item: any, i: number) => (
                  <div key={i} className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-950">
                    <span className="font-bold uppercase tracking-wider text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded mr-2">
                      {item.severity} Severity
                    </span>
                    <span className="font-semibold">{item.description}</span>
                    <span className="text-[11px] text-slate-500 block mt-1">Source: {item.source}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2 italic">{interactions.disclaimer}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Loading interactions...</p>
        )}
      </div>

      {/* Add Medication Workflow Modal / Drawer */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-blue-950 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-blue-700" />
              Register Medication with Active Salt / Ingredients
            </h3>
            <span className="text-xs text-slate-400">Combines brand name & salt breakdown</span>
          </div>

          <form onSubmit={handleAddMedication} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Dolo 650 or Telma-H"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Generic Name</label>
                <input
                  type="text"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="e.g. Paracetamol"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Dosage Form</label>
                <select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Liquid / Syrup">Liquid / Syrup</option>
                  <option value="Injection">Injection</option>
                  <option value="Inhaler">Inhaler</option>
                </select>
              </div>
            </div>

            {/* Active Ingredients Builder */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Active Salt Ingredients (Multi-ingredient support)</span>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="text-xs text-blue-700 hover:underline font-semibold"
                >
                  + Add Ingredient Salt
                </button>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Active Salt Name (e.g. Metformin)"
                      value={ing.ingredient_name}
                      onChange={(e) => handleIngredientChange(idx, 'ingredient_name', e.target.value)}
                      className="md:col-span-2 text-xs border border-slate-300 rounded p-1.5 bg-white focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Strength"
                      value={ing.strength}
                      onChange={(e) => handleIngredientChange(idx, 'strength', parseFloat(e.target.value) || 0)}
                      className="text-xs border border-slate-300 rounded p-1.5 bg-white focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <select
                        value={ing.strength_unit}
                        onChange={(e) => handleIngredientChange(idx, 'strength_unit', e.target.value)}
                        className="text-xs border border-slate-300 rounded p-1.5 bg-white focus:outline-none flex-1"
                      >
                        <option value="mg">mg</option>
                        <option value="mcg">mcg</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="IU">IU</option>
                      </select>
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Prescribed Dosage</label>
                <input
                  type="text"
                  value={prescribedDosage}
                  onChange={(e) => setPrescribedDosage(e.target.value)}
                  placeholder="e.g. 1 tablet"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Frequency</label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once daily / Twice daily"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition"
              >
                Save Medication
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medication Inventory List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
            Current Active Medication Inventory ({medications.length})
          </h3>
          <span className="text-xs text-slate-500">Verified against patient profile</span>
        </div>

        {medications.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            <Pill className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No medications logged yet. Click &quot;Register Medication&quot; above to add your first prescription.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {medications.map((med) => (
              <div key={med.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-blue-950 text-base">{med.brand_name}</h4>
                      <p className="text-xs text-slate-500">{med.generic_name || 'Generic formulation'}</p>
                    </div>
                    <StatusBadge status={med.verification_status} />
                  </div>

                  {/* Active Salts List */}
                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Constituent Active Salts:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {med.salts?.map((s: any, idx: number) => (
                        <span key={idx} className="bg-white border border-slate-200 text-blue-900 text-xs px-2 py-0.5 rounded font-mono font-medium">
                          {s.salt_name} ({s.strength})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Instructions:</span>
                      <span className="font-medium text-slate-800">{med.dosage_instructions || `${med.frequency || ''}`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Started:</span>
                      <span className="font-mono">{med.start_date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px]">
                  <CrossModuleLink to="/medicine-changes" label="Log Regimen Change" variant="primary" />
                  <CrossModuleLink to="/doctor-visit" label="Include in Visit Prep" variant="slate" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineSaltPage;
