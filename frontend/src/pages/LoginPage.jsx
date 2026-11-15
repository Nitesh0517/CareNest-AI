import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  HeartHandshake, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Users,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'elderly' | 'caregiver'
  const [error, setError] = useState(
    searchParams.get('session_expired') ? 'Your session has expired. Please sign in again.' : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'caregiver') {
        navigate('/caregiver-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.detail || "Invalid email or password. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError(null);
    setDemoLoading(role);

    try {
      const user = await demoLogin(role);
      if (user.role === 'caregiver') {
        navigate('/caregiver-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setError(err.response?.data?.detail || `Failed to sign in as demo ${role}.`);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      
      {/* Form Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Access your medication schedules and health dashboard
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Demo Quick Logins for Hackathon Judges */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
          Hackathon Quick Demo Access
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoLogin('elderly')}
            disabled={demoLoading !== null}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            {demoLoading === 'elderly' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Heart className="w-3.5 h-3.5" />
            )}
            <span>Elderly (Robert)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('caregiver')}
            disabled={demoLoading !== null}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-75 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            {demoLoading === 'caregiver' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
            <span>Caregiver (Sarah)</span>
          </button>
        </div>
      </div>

      {/* Standard Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. robert.miller@eldercare.demo"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-98 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Create an Account
          </Link>
        </p>
      </div>

    </div>
  );
};

export default LoginPage;
