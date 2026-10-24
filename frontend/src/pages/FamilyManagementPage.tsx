import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import CrossModuleLink from '../components/CrossModuleLink';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Key,
  Eye,
  Edit3,
  Plus
} from 'lucide-react';

export default function FamilyManagementPage() {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [sharedPatients, setSharedPatients] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Invite Form State (Deny-by-default)
  const [inviteForm, setInviteForm] = useState({
    invitee_email: '',
    invitee_name: '',
    relationship: 'Family Member',
    can_view_reports: false,
    can_view_readings: false,
    can_view_medicines: false,
    can_view_summaries: false,
    can_view_appointments: false,
    can_edit: false,
  });

  // Invitation Token Display
  const [lastInviteResult, setLastInviteResult] = useState<any | null>(null);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    setLoading(true);
    try {
      const [cgList, spList, auditList] = await Promise.all([
        api.listCaregivers(),
        api.listSharedPatients(),
        api.getFamilyAuditTrail(),
      ]);
      setCaregivers(cgList);
      setSharedPatients(spList);
      setAuditLogs(auditList);
    } catch (err: any) {
      setError(err.message || 'Failed to load family permissions data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.inviteCaregiver(inviteForm);
      setLastInviteResult(result);
      setSuccess(`Invitation token generated for ${inviteForm.invitee_email}`);
      setShowInviteModal(false);
      setInviteForm({
        invitee_email: '',
        invitee_name: '',
        relationship: 'Family Member',
        can_view_reports: false,
        can_view_readings: false,
        can_view_medicines: false,
        can_view_summaries: false,
        can_view_appointments: false,
        can_edit: false,
      });
      await fetchFamilyData();
    } catch (err: any) {
      setError(err.message || 'Failed to generate invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleTogglePermission = async (perm: any, field: string) => {
    try {
      const updated = {
        permission_id: perm.id,
        can_view_reports: field === 'can_view_reports' ? !perm.can_view_reports : perm.can_view_reports,
        can_view_readings: field === 'can_view_readings' ? !perm.can_view_readings : perm.can_view_readings,
        can_view_medicines: field === 'can_view_medicines' ? !perm.can_view_medicines : perm.can_view_medicines,
        can_view_summaries: field === 'can_view_summaries' ? !perm.can_view_summaries : perm.can_view_summaries,
        can_view_appointments: field === 'can_view_appointments' ? !perm.can_view_appointments : perm.can_view_appointments,
        can_edit: field === 'can_edit' ? !perm.can_edit : perm.can_edit,
      };

      await api.updatePermissions(updated);
      await fetchFamilyData();
      setSuccess('Permissions updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update caregiver permissions');
    }
  };

  const handleRevoke = async (permissionId: number) => {
    if (!window.confirm('Are you sure you want to immediately revoke access for this caregiver?')) {
      return;
    }

    try {
      await api.revokeCaregiverAccess(permissionId);
      setSuccess('Caregiver access revoked immediately');
      await fetchFamilyData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke caregiver access');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family Access"
        description="Fine-grained, deny-by-default role permissions and instant access revocation with complete security and access audit trail logging."
        category="Safety & Management"
        breadcrumbs={[{ label: 'Family Access' }]}
        primaryAction={
          <button
            onClick={() => setShowInviteModal(!showInviteModal)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {showInviteModal ? 'Cancel' : 'Invite Delegate / Caregiver'}
          </button>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-rose-500 hover:underline">Dismiss</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm rounded flex items-center justify-between">
          <p>{success}</p>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Generated Token Banner if recently invited */}
      {lastInviteResult && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-teal-600" />
              <h3 className="font-bold text-sm text-teal-900">
                Caregiver Invitation Link Generated
              </h3>
            </div>
            <button onClick={() => setLastInviteResult(null)} className="text-xs text-teal-600 hover:underline">Close</button>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Share this single-use authorization token with <strong className="text-slate-800">{lastInviteResult.invitee_email}</strong>:
          </p>
          <div className="mt-2 p-2.5 bg-white border border-teal-200 rounded font-mono text-xs text-teal-800 break-all select-all">
            {lastInviteResult.invitation_token}
          </div>
        </div>
      )}

      {/* Invite Caregiver Modal Form */}
      {showInviteModal && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-600" />
            Invite Caregiver with Granular Permissions (Deny-by-Default)
          </h2>

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invitee Email *</label>
                <input
                  type="email"
                  required
                  placeholder="caregiver@example.com"
                  value={inviteForm.invitee_email}
                  onChange={(e) => setInviteForm({ ...inviteForm, invitee_email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Priya Sharma"
                  value={inviteForm.invitee_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, invitee_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                <select
                  value={inviteForm.relationship}
                  onChange={(e) => setInviteForm({ ...inviteForm, relationship: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Daughter">Daughter</option>
                  <option value="Son">Son</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Parent">Parent / Guardian</option>
                  <option value="Clinician">Treating Clinician</option>
                  <option value="Caregiver">Professional Caregiver</option>
                </select>
              </div>
            </div>

            {/* Granular Deny-by-default permissions */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-3">
                Explicit Permission Grants (All denied unless checked)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_view_reports}
                    onChange={(e) => setInviteForm({ ...inviteForm, can_view_reports: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Can View Medical Reports
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_view_readings}
                    onChange={(e) => setInviteForm({ ...inviteForm, can_view_readings: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Can View Daily Readings
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_view_medicines}
                    onChange={(e) => setInviteForm({ ...inviteForm, can_view_medicines: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Can View Medications & Salts
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_view_summaries}
                    onChange={(e) => setInviteForm({ ...inviteForm, can_view_summaries: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Can View Visit Summaries
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_view_appointments}
                    onChange={(e) => setInviteForm({ ...inviteForm, can_view_appointments: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded"
                  />
                  Can View Appointments
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                  <input
                    type="checkbox"
                    checked={inviteForm.can_edit}
                    onChange={(e) => setInviteForm({ ...inviteForm, can_edit: e.target.checked })}
                    className="h-4 w-4 text-rose-600 rounded"
                  />
                  Can Edit Records (Restricted)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {inviting ? 'Generating...' : 'Send Caregiver Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Caregivers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Active Authorized Caregivers & Permissions
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {caregivers.length} Authorized Delegates
          </span>
        </div>

        {caregivers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            No active caregivers authorized. Click &quot;Invite Family Member / Caregiver&quot; above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Caregiver</th>
                  <th className="p-3.5 text-center">Reports</th>
                  <th className="p-3.5 text-center">Readings</th>
                  <th className="p-3.5 text-center">Medicines</th>
                  <th className="p-3.5 text-center">Summaries</th>
                  <th className="p-3.5 text-center">Edit</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {caregivers.map((cg) => (
                  <tr key={cg.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{cg.caregiver_name}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{cg.caregiver_email}</div>
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={cg.can_view_reports}
                        onChange={() => handleTogglePermission(cg, 'can_view_reports')}
                        className="h-4 w-4 text-teal-600 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={cg.can_view_readings}
                        onChange={() => handleTogglePermission(cg, 'can_view_readings')}
                        className="h-4 w-4 text-teal-600 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={cg.can_view_medicines}
                        onChange={() => handleTogglePermission(cg, 'can_view_medicines')}
                        className="h-4 w-4 text-teal-600 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={cg.can_view_summaries}
                        onChange={() => handleTogglePermission(cg, 'can_view_summaries')}
                        className="h-4 w-4 text-teal-600 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={cg.can_edit}
                        onChange={() => handleTogglePermission(cg, 'can_edit')}
                        className="h-4 w-4 text-rose-600 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleRevoke(cg.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition"
                      >
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shared Patients Table (If current user is acting as caregiver for others) */}
      {sharedPatients.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-teal-600" />
            Patients Who Granted You Delegated Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sharedPatients.map((sp) => (
              <div key={sp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-sm">{sp.patient_name}</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-semibold">
                    Authorized Delegate
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {sp.can_view_reports && <span className="bg-white px-2 py-0.5 rounded border text-slate-600 text-[10px]">Reports</span>}
                  {sp.can_view_readings && <span className="bg-white px-2 py-0.5 rounded border text-slate-600 text-[10px]">Readings</span>}
                  {sp.can_view_medicines && <span className="bg-white px-2 py-0.5 rounded border text-slate-600 text-[10px]">Medicines</span>}
                  {sp.can_view_summaries && <span className="bg-white px-2 py-0.5 rounded border text-slate-600 text-[10px]">Summaries</span>}
                  {sp.can_edit && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 text-[10px]">Edit</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-600" />
          Access & Permission Security Audit Trail
        </h2>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400">No security audit entries recorded yet.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {auditLogs.map((log: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                <div>
                  <span className="font-semibold text-slate-800">{log.action || 'Permission Action'}</span>
                  <span className="text-slate-500 ml-2">by user #{log.actor_user_id}</span>
                  {log.details && <span className="text-slate-600 block text-[11px]">{log.details}</span>}
                </div>
                <span className="font-mono text-slate-400 text-[10px]">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
