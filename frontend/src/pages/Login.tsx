import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Lock, Mail, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('patient@medichronicle.ai');
  const [password, setPassword] = useState('Password123!');
  const [fullName, setFullName] = useState('Rajesh Sharma');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await register({
          email,
          password,
          full_name: fullName,
          role,
          date_of_birth: '1978-05-14',
          blood_group: 'B+',
        });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password123!');
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xs border border-slate-200 p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-700 rounded-2xl text-white shadow-xs mb-3">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-blue-950 tracking-tight">MediChronicle AI</h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical Health Memory & Intelligence Platform
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-950 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                    placeholder="e.g. Rajesh Sharma"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Account Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                >
                  <option value="patient">Patient (Record Sovereign)</option>
                  <option value="caregiver">Caregiver (Delegated Access)</option>
                  <option value="clinician">Clinician (Healthcare Professional)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                placeholder="patient@medichronicle.ai"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-700 focus:outline-none"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? 'Authenticating...' : isRegistering ? 'Create Healthcare Account' : 'Sign In to Health Portal'}
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-blue-700 hover:underline font-semibold"
          >
            {isRegistering ? 'Already registered? Sign in here' : "Don't have an account? Register new persona"}
          </button>
        </div>

        {/* Quick-fill Demo Accounts for Faculty & Evaluation */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
            Evaluation Demo Personas
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickFill('patient@medichronicle.ai')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg text-center transition"
            >
              Primary Patient (Rajesh)
            </button>
            <button
              onClick={() => handleQuickFill('caregiver@medichronicle.ai')}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg text-center transition"
            >
              Caregiver (Ananya)
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-4 text-center">
        Zero-trust encrypted RBAC session • ISO-27001 / HIPAA compliant audit design
      </p>
    </div>
  );
};

export default Login;
