import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { Apple, Plus, AlertCircle, ShieldCheck, Info, Sparkles, CheckCircle2 } from 'lucide-react';

export const SupplementCheckerPage: React.FC = () => {
  const [supplementsList, setSupplementsList] = useState<any[]>([]);
  const [intakeAnalysis, setIntakeAnalysis] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [suppType, setSuppType] = useState('multivitamin');
  const [servingSize, setServingSize] = useState('1 capsule');
  const [frequency, setFrequency] = useState('Once daily');
  const [dailyServings, setDailyServings] = useState('1.0');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // Multi-ingredient builder
  const [ingredients, setIngredients] = useState<{ ingredient_name: string; amount: number | ''; unit: string; is_unknown: boolean }[]>([
    { ingredient_name: 'Vitamin D3', amount: 1000, unit: 'IU', is_unknown: false },
  ]);

  const fetchData = async () => {
    try {
      const [supps, analysis] = await Promise.all([
        api.listSupplements(),
        api.analyzeSupplementIntake(),
      ]);
      setSupplementsList(supps);
      setIntakeAnalysis(analysis);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { ingredient_name: '', amount: 100, unit: 'mg', is_unknown: false }]);
  };

  const handleRemoveIngredient = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngs = ingredients
      .filter((i) => i.ingredient_name.trim() !== '')
      .map((i) => ({
        ingredient_name: i.ingredient_name,
        amount_per_serving: i.is_unknown ? null : (typeof i.amount === 'number' ? i.amount : parseFloat(i.amount as string) || null),
        unit: i.unit,
        is_amount_unknown: i.is_unknown ? 'true' : 'false',
      }));

    if (validIngs.length === 0) {
      alert('Please specify at least one constituent nutrient ingredient.');
      return;
    }

    try {
      await api.addSupplement({
        product_name: productName,
        brand: brand || undefined,
        supplement_type: suppType,
        serving_size: servingSize,
        recorded_frequency: frequency,
        daily_servings_count: parseFloat(dailyServings) || 1.0,
        start_date: startDate,
        ingredients: validIngs,
        source: 'packaging',
        verification_status: 'confirmed_by_user',
      });

      setProductName('');
      setBrand('');
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      alert(`Error saving supplement: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplement Information"
        description="Tracks multi-ingredient dietary supplements and calculates cumulative daily nutrient intake across all products. Proprietary blends with unstated amounts are flagged without erroneously assuming zero."
        category="Medicine Intelligence"
        breadcrumbs={[{ label: 'Supplement Information' }]}
        primaryAction={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddForm ? 'Close Form' : 'Register Supplement'}
          </button>
        }
        secondaryAction={
          <CrossModuleLink to="/medicines" label="Medicine Safety Checker" variant="primary" size="sm" />
        }
      />

      {/* Cumulative Nutrient Intake & Tolerable Upper Limits (UL) Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-blue-950 flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-teal-700" />
              Cumulative Daily Nutrient Aggregation & Upper Limit Evaluation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sums identical nutrients across distinct multivitamin or mineral products.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Reference: NIH ODS Guidelines</span>
        </div>

        {intakeAnalysis.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No active supplements recorded to analyze.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {intakeAnalysis.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm">{item.nutrient_name}</h4>
                    <span className="text-[11px] text-slate-500">
                      Sources: {item.products_containing?.join(', ')}
                    </span>
                  </div>
                  <div className="text-right">
                    {item.has_unknown_quantities ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Partial / Blend Unknown
                      </span>
                    ) : (
                      <span className="font-mono text-sm font-bold text-blue-900">
                        {item.total_daily_intake} {item.unit}/day
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Clinical Evidence:</strong> {item.evidence_benefits}
                </p>

                {item.tolerable_upper_intake_note && (
                  <div className="p-2 bg-blue-50/70 rounded border border-blue-100 text-[11px] text-blue-950">
                    <span className="font-semibold block mb-0.5">Tolerable Upper Limit (UL):</span>
                    {item.tolerable_upper_intake_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Supplement Drawer Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-blue-950 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-blue-700" />
              Register Dietary Supplement / Vitamin Product
            </h3>
            <span className="text-xs text-slate-400">Nutrient Breakdown Builder</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Daily Men's Multivitamin"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. NatureMade"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                <select
                  value={suppType}
                  onChange={(e) => setSuppType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50 focus:bg-white"
                >
                  <option value="multivitamin">Multivitamin & Mineral</option>
                  <option value="mineral">Single Mineral (Iron, Zinc, Calcium)</option>
                  <option value="herbal">Herbal / Botanical</option>
                  <option value="omega3">Omega-3 / Fish Oil</option>
                  <option value="protein">Protein / Amino Acid</option>
                </select>
              </div>
            </div>

            {/* Constituents Builder */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Constituent Nutrients</span>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="text-xs text-blue-700 hover:underline font-semibold"
                >
                  + Add Nutrient
                </button>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="Nutrient Name (e.g. Vitamin C)"
                      value={ing.ingredient_name}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].ingredient_name = e.target.value;
                        setIngredients(copy);
                      }}
                      className="md:col-span-2 text-xs border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      disabled={ing.is_unknown}
                      value={ing.amount}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].amount = parseFloat(e.target.value) || '';
                        setIngredients(copy);
                      }}
                      className="text-xs border border-slate-300 rounded p-1.5 bg-white disabled:bg-slate-100"
                    />
                    <div className="flex gap-2 items-center">
                      <select
                        value={ing.unit}
                        onChange={(e) => {
                          const copy = [...ingredients];
                          copy[idx].unit = e.target.value;
                          setIngredients(copy);
                        }}
                        className="text-xs border border-slate-300 rounded p-1.5 bg-white flex-1"
                      >
                        <option value="mg">mg</option>
                        <option value="mcg">mcg</option>
                        <option value="IU">IU</option>
                        <option value="g">g</option>
                      </select>
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs px-1"
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
                <label className="text-xs font-semibold text-slate-700 block mb-1">Serving Size</label>
                <input
                  type="text"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Daily Servings Count</label>
                <input
                  type="number"
                  step="0.5"
                  value={dailyServings}
                  onChange={(e) => setDailyServings(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-slate-50/50"
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
                Save Supplement Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Supplements List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
          Recorded Supplements Inventory ({supplementsList.length})
        </h3>

        {supplementsList.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
            <Apple className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No dietary supplements recorded. Click &quot;Register Supplement&quot; above to log products.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplementsList.map((supp) => (
              <div key={supp.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-blue-950 text-sm">{supp.product_name}</h4>
                      <p className="text-xs text-slate-500">{supp.brand || 'Brand unrecorded'}</p>
                    </div>
                    <StatusBadge status={supp.verification_status} />
                  </div>

                  <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Nutrient Ingredients:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {supp.ingredients?.map((ing: any, idx: number) => (
                        <span key={idx} className="bg-white border border-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded font-mono">
                          {ing.ingredient_name}: {ing.is_amount_unknown === 'true' ? 'Proprietary Blend' : `${ing.amount_per_serving} ${ing.unit}`}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 font-mono">Started: {supp.start_date}</span>
                  <CrossModuleLink to="/doctor-visit" label="Add to Visit Prep" variant="slate" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplementCheckerPage;
