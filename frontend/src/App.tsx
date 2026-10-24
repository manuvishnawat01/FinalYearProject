import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Pages
import { Login } from './pages/Login';
import { HomePage } from './pages/HomePage';
import { Dashboard } from './pages/Dashboard';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { DailyReadingsPage } from './pages/DailyReadingsPage';
import { HealthTimelinePage } from './pages/HealthTimelinePage';
import { MedicineSaltPage } from './pages/MedicineSaltPage';
import { TrendsWarningPage } from './pages/TrendsWarningPage';
import { SupplementCheckerPage } from './pages/SupplementCheckerPage';
import { ReportTranslatorPage } from './pages/ReportTranslatorPage';
import SymptomCorrelatorPage from './pages/SymptomCorrelatorPage';
import MedicineChangePage from './pages/MedicineChangePage';
import PrescriptionVerifyPage from './pages/PrescriptionVerifyPage';
import DoctorVisitPrepPage from './pages/DoctorVisitPrepPage';
import AITransparencyPage from './pages/AITransparencyPage';
import FamilyManagementPage from './pages/FamilyManagementPage';
import ExpenseDuplicatePage from './pages/ExpenseDuplicatePage';

// Multi-Page Hubs
import { HealthRecordsHub } from './pages/hubs/HealthRecordsHub';
import { MedicinesSafetyHub } from './pages/hubs/MedicinesSafetyHub';
import { ReportsAssistantHub } from './pages/hubs/ReportsAssistantHub';
import { HealthInsightsHub } from './pages/hubs/HealthInsightsHub';
import { SettingsPrivacyHub } from './pages/hubs/SettingsPrivacyHub';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-blue-700 border-t-transparent rounded-full"></div>
          <span className="text-xs text-slate-500 font-medium">Validating authorization session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Simple, Welcoming Home Page */}
        <Route index element={<HomePage />} />

        {/* Multi-Page Category Hubs */}
        <Route path="health-records" element={<HealthRecordsHub />} />
        <Route path="medicines-safety" element={<MedicinesSafetyHub />} />
        <Route path="reports-assistant" element={<ReportsAssistantHub />} />
        <Route path="health-insights" element={<HealthInsightsHub />} />
        <Route path="settings" element={<SettingsPrivacyHub />} />

        {/* Detailed Clinical Overview (Preserved) */}
        <Route path="clinical-overview" element={<Dashboard />} />

        {/* Dedicated Core Ingestion & Tracking Routes */}
        <Route path="documents" element={<DocumentUploadPage />} />
        <Route path="daily-readings" element={<DailyReadingsPage />} />

        {/* Dedicated Intelligence Pages */}
        <Route path="timeline" element={<HealthTimelinePage />} />
        <Route path="medicines" element={<MedicineSaltPage />} />
        <Route path="trends" element={<TrendsWarningPage />} />
        <Route path="supplements" element={<SupplementCheckerPage />} />
        <Route path="translator" element={<ReportTranslatorPage />} />
        <Route path="symptoms" element={<SymptomCorrelatorPage />} />
        <Route path="medicine-changes" element={<MedicineChangePage />} />
        <Route path="prescription-verify" element={<PrescriptionVerifyPage />} />
        <Route path="doctor-visit" element={<DoctorVisitPrepPage />} />
        <Route path="ai-transparency" element={<AITransparencyPage />} />
        <Route path="family" element={<FamilyManagementPage />} />
        <Route path="expenses" element={<ExpenseDuplicatePage />} />
      </Route>

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
