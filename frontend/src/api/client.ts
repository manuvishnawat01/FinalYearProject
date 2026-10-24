// API Client for MediChronicle AI
const RAW_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = (RAW_URL ? RAW_URL.replace(/\/$/, '') : '') + '/api/v1';

function getHeaders(isFormData = false): Record<string, string> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = { ...getHeaders(isFormData), ...(options.headers as Record<string, string>) };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // --- Auth ---
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),

  // --- Core: Documents & Observations ---
  uploadDocument: (formData: FormData) => request<any>('/documents/upload', { method: 'POST', body: formData }),
  listDocuments: (params = '') => request<any[]>(`/documents/${params ? '?' + params : ''}`),
  listObservations: (params = '') => request<any[]>(`/documents/observations/list${params ? '?' + params : ''}`),
  confirmObservation: (data: any) => request<any>('/documents/confirm-observation', { method: 'POST', body: JSON.stringify(data) }),

  // --- Core: Daily Health Readings ---
  recordReading: (data: any) => request<any>('/health-readings/', { method: 'POST', body: JSON.stringify(data) }),
  listReadings: (params = '') => request<any[]>(`/health-readings/${params ? '?' + params : ''}`),

  // --- Module 1: Timeline & Search ---
  getTimeline: (params = '') => request<any[]>(`/timeline/${params ? '?' + params : ''}`),
  searchHistory: (query: string, targetPatientId?: number) =>
    request<any>('/timeline/search', { method: 'POST', body: JSON.stringify({ query, target_patient_id: targetPatientId }) }),
  compareObservations: (observationIds: number[], patientId?: number) =>
    request<any>(`/timeline/compare${patientId ? '?patient_id=' + patientId : ''}`, {
      method: 'POST',
      body: JSON.stringify({ observation_ids: observationIds }),
    }),

  // --- Module 2: Medicine Salt Intelligence ---
  addMedication: (data: any, patientId?: number) =>
    request<any>(`/medicines/${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  listMedications: (params = '') => request<any[]>(`/medicines/${params ? '?' + params : ''}`),
  checkDuplicateSalts: (patientId?: number) =>
    request<any[]>(`/medicines/duplicate-check${patientId ? '?patient_id=' + patientId : ''}`),
  checkDrugInteractions: (simulateOutage = false, patientId?: number) =>
    request<any>(`/medicines/interactions?simulate_outage=${simulateOutage}${patientId ? '&patient_id=' + patientId : ''}`),

  // --- Module 3: Health Trends & Early Warning ---
  getTrendSeries: (data: any, patientId?: number) =>
    request<any>(`/trends/series${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),

  // --- Module 4: Supplements ---
  addSupplement: (data: any, patientId?: number) =>
    request<any>(`/supplements/${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  listSupplements: (params = '') => request<any[]>(`/supplements/${params ? '?' + params : ''}`),
  analyzeSupplementIntake: (patientId?: number) =>
    request<any[]>(`/supplements/intake-analysis${patientId ? '?patient_id=' + patientId : ''}`),

  // --- Module 5: Translator ---
  explainReport: (documentId: number, targetLanguage: string, patientId?: number) =>
    request<any>(`/translator/explain${patientId ? '?patient_id=' + patientId : ''}`, {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, target_language: targetLanguage }),
    }),
  listMedicalSources: () => request<any[]>('/translator/sources'),

  // --- Module 6: Symptom Correlator ---
  recordSymptom: (data: any, patientId?: number) =>
    request<any>(`/symptoms/${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  listSymptoms: (patientId?: number) => request<any[]>(`/symptoms/${patientId ? '?patient_id=' + patientId : ''}`),
  correlateSymptom: (symptomId: number) => request<any>(`/symptoms/correlate/${symptomId}`),

  // --- Module 7: Medicine Change Impact ---
  recordMedicineChange: (data: any, patientId?: number) =>
    request<any>(`/medicine-changes/record-change${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  listMedicineHistory: (patientId?: number) =>
    request<any[]>(`/medicine-changes/history${patientId ? '?patient_id=' + patientId : ''}`),
  compareMedicineImpact: (data: any, patientId?: number) =>
    request<any>(`/medicine-changes/compare-impact${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),

  // --- Module 8: Prescription Verification ---
  verifyPrescription: (prescriptionDocId: number, packageDocId: number, patientId?: number) =>
    request<any>(`/prescription-verify/analyze${patientId ? '?patient_id=' + patientId : ''}`, {
      method: 'POST',
      body: JSON.stringify({ prescription_doc_id: prescriptionDocId, package_doc_id: packageDocId }),
    }),
  listVerifications: (patientId?: number) =>
    request<any[]>(`/prescription-verify/history${patientId ? '?patient_id=' + patientId : ''}`),

  // --- Module 9: Doctor Visit Prep ---
  generateDoctorVisitPrep: (data: any, patientId?: number) =>
    request<any>(`/doctor-visit/generate${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  listDoctorVisitSummaries: (patientId?: number) =>
    request<any[]>(`/doctor-visit/list${patientId ? '?patient_id=' + patientId : ''}`),

  // --- Module 10: AI Transparency ---
  getProvenanceLogs: (moduleName?: string, patientId?: number) =>
    request<any[]>(`/ai-transparency/provenance?${moduleName ? 'module_name=' + moduleName : ''}${patientId ? '&patient_id=' + patientId : ''}`),
  validateSourceUrl: (url: string) =>
    request<any>('/ai-transparency/validate-source', { method: 'POST', body: JSON.stringify({ url }) }),

  // --- Module 11: Family Management ---
  inviteCaregiver: (data: any) => request<any>('/family/invite', { method: 'POST', body: JSON.stringify(data) }),
  acceptInvite: (token: string) => request<any>('/family/accept-invite', { method: 'POST', body: JSON.stringify({ token }) }),
  listCaregivers: (patientId?: number) =>
    request<any[]>(`/family/caregivers${patientId ? '?patient_id=' + patientId : ''}`),
  listSharedPatients: () => request<any[]>('/family/shared-patients'),
  updatePermissions: (data: any) => request<any>('/family/permissions', { method: 'PUT', body: JSON.stringify(data) }),
  revokeCaregiverAccess: (permissionId: number) =>
    request<any>(`/family/revoke/${permissionId}`, { method: 'POST' }),
  getFamilyAuditTrail: (patientId?: number) =>
    request<any[]>(`/family/audit-trail${patientId ? '?patient_id=' + patientId : ''}`),

  // --- Module 12: Expenses & Duplicate Tests ---
  recordExpense: (data: any, patientId?: number) =>
    request<any>(`/expenses/${patientId ? '?patient_id=' + patientId : ''}`, { method: 'POST', body: JSON.stringify(data) }),
  listExpenses: (category?: string, patientId?: number) =>
    request<any[]>(`/expenses/?${category ? 'category=' + category : ''}${patientId ? '&patient_id=' + patientId : ''}`),
  getExpenseSummary: (patientId?: number) =>
    request<any>(`/expenses/summary${patientId ? '?patient_id=' + patientId : ''}`),
  checkDuplicateTests: (reviewWindowDays = 90, patientId?: number) =>
    request<any[]>(`/expenses/check-duplicates${patientId ? '?patient_id=' + patientId : ''}`, {
      method: 'POST',
      body: JSON.stringify({ review_window_days: reviewWindowDays }),
    }),
};
