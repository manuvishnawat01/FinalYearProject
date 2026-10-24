import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  DollarSign, 
  Download, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Building2, 
  PieChart, 
  Plus, 
  HelpCircle, 
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt
} from 'lucide-react';

export default function ExpenseDuplicatePage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [duplicateFlags, setDuplicateFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanningDuplicates, setScanningDuplicates] = useState(false);

  // Filter & Review Window
  const [selectedCategory, setSelectedCategory] = useState('');
  const [reviewWindowDays, setReviewWindowDays] = useState(90);

  // New Expense Form State
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    provider_facility: 'Apollo Clinic',
    category: 'laboratory',
    service_or_test_name: 'HbA1c & Fasting Plasma Glucose',
    amount: '650',
    currency: 'INR',
    payment_status: 'paid',
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, [selectedCategory]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [expList, expSum, dupList] = await Promise.all([
        api.listExpenses(selectedCategory || undefined),
        api.getExpenseSummary(),
        api.checkDuplicateTests(reviewWindowDays),
      ]);
      setExpenses(expList);
      setSummary(expSum);
      setDuplicateFlags(dupList);
    } catch (err: any) {
      setError(err.message || 'Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.recordExpense({
        expense_date: formData.expense_date,
        provider_facility: formData.provider_facility,
        category: formData.category,
        service_or_test_name: formData.service_or_test_name,
        amount: Number(formData.amount),
        currency: formData.currency,
        payment_status: formData.payment_status,
        notes: formData.notes || undefined,
      });

      setShowAddModal(false);
      setFormData({
        expense_date: new Date().toISOString().split('T')[0],
        provider_facility: 'Apollo Clinic',
        category: 'laboratory',
        service_or_test_name: '',
        amount: '',
        currency: 'INR',
        payment_status: 'paid',
        notes: '',
      });

      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanDuplicates = async () => {
    setScanningDuplicates(true);
    setError('');
    try {
      const flags = await api.checkDuplicateTests(reviewWindowDays);
      setDuplicateFlags(flags);
    } catch (err: any) {
      setError(err.message || 'Failed to scan for duplicate tests');
    } finally {
      setScanningDuplicates(false);
    }
  };

  const handleDownloadCsv = () => {
    const token = localStorage.getItem('token');
    const url = '/api/v1/expenses/export-csv';

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('CSV download failed');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `MediChronicle_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      })
      .catch((err) => {
        setError(err.message || 'Failed to download CSV');
      });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Cost Tracker"
        description="Audits medical expenditures across facilities, exports ledger spreadsheets (CSV), and detects redundant diagnostic orders performed within customizable review windows."
        category="Safety & Management"
        breadcrumbs={[{ label: 'Healthcare Cost Tracker' }]}
        primaryAction={
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showAddModal ? 'Cancel' : 'Record Expense'}
          </button>
        }
        secondaryAction={
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition flex items-center"
          >
            <Download className="h-4 w-4 mr-1.5 text-slate-500" />
            Export CSV
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-rose-500 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Expense Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-400">Total Expenditure</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              ₹ {summary.total_expenditure.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Across {summary.total_expenses_count} recorded items
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-400">Laboratory Tests</span>
            <div className="text-2xl font-extrabold text-teal-800 mt-1 font-mono">
              ₹ {(summary.category_breakdown?.laboratory || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Blood, urine & biochemical panels</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-400">Doctor Consultations</span>
            <div className="text-2xl font-extrabold text-blue-800 mt-1 font-mono">
              ₹ {(summary.category_breakdown?.consultation || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">OPD & specialist visits</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs uppercase font-bold text-slate-400">Medications</span>
            <div className="text-2xl font-extrabold text-purple-800 mt-1 font-mono">
              ₹ {(summary.category_breakdown?.medication || 0).toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Prescriptions & supplements</span>
          </div>
        </div>
      )}

      {/* Record Expense Modal Form */}
      {showAddModal && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-teal-600" />
            Record Healthcare Expenditure
          </h2>

          <form onSubmit={handleRecordExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                >
                  <option value="laboratory">Laboratory / Pathology Test</option>
                  <option value="consultation">Doctor Consultation</option>
                  <option value="medication">Medication / Pharmacy</option>
                  <option value="radiology">Radiology / Imaging (X-Ray, MRI, CT)</option>
                  <option value="procedure">Clinical Procedure / Hospital</option>
                  <option value="other">Other Healthcare Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Provider / Facility *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Apollo Hospital, Thyrocare"
                  value={formData.provider_facility}
                  onChange={(e) => setFormData({ ...formData, provider_facility: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test or Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Lipid Profile Panel, HbA1c, Consultation Fee"
                  value={formData.service_or_test_name}
                  onChange={(e) => setFormData({ ...formData, service_or_test_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR ₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="650"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Invoice Number</label>
              <input
                type="text"
                placeholder="Optional invoice details or clinical rationale..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Record Expenditure'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 90-Day Duplicate Diagnostic Test Scanner Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Diagnostic Test Redundancy & Duplicate Scanner
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Scans confirmed lab reports & expenditures for overlapping investigations performed within the lookback window.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Window:</span>
            <select
              value={reviewWindowDays}
              onChange={(e) => setReviewWindowDays(Number(e.target.value))}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
            >
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days (Recommended)</option>
              <option value="180">180 Days</option>
            </select>
            <button
              onClick={handleScanDuplicates}
              disabled={scanningDuplicates}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition"
            >
              {scanningDuplicates ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>

        {/* Clinical Disclaimer on Repeated Tests */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Clinical Appropriateness Notice:</strong> A repeat test is not automatically unnecessary. Dose titration, acute clinical symptoms, hospital admission, or unexpected abnormalities require deliberate repeat testing. Consult your treating doctor before questioning clinical orders.
          </div>
        </div>

        {/* Duplicate Flags List */}
        {duplicateFlags.length === 0 ? (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>No redundant or identical tests detected within the {reviewWindowDays}-day lookback window.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {duplicateFlags.map((flag) => (
              <div key={flag.id} className="p-4 bg-white border border-amber-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 uppercase">
                      Potential Duplicate Test
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Repeated after only {flag.days_between} days
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">
                    {flag.current_test_name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Previously conducted on <strong className="text-slate-800">{flag.previous_test_date}</strong>; re-ordered on <strong className="text-slate-800">{flag.current_test_date}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    {flag.flag_reason}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 font-medium">
                    Review with Doctor
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expenses Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900">
            Recorded Expenditure Ledger ({expenses.length} Records)
          </h2>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Categories</option>
            <option value="laboratory">Laboratory</option>
            <option value="consultation">Consultation</option>
            <option value="medication">Medication</option>
            <option value="radiology">Radiology</option>
            <option value="procedure">Procedure</option>
            <option value="other">Other</option>
          </select>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            No expenses recorded yet. Click &quot;Record Expense&quot; above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Service / Test</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Facility / Provider</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {exp.service_or_test_name}
                      {exp.notes && <span className="block font-normal text-slate-400 text-[11px]">{exp.notes}</span>}
                    </td>
                    <td className="p-3.5">
                      <span className="capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {exp.provider_facility}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      ₹ {exp.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-800 uppercase">
                        {exp.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
