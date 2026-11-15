import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Heart, 
  Users, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('elderly'); // 'elderly' | 'caregiver'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userData = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || null,
        age: age ? parseInt(age, 10) : null,
      };

      const newUser = await register(userData);
      if (newUser.role === 'caregiver') {
        navigate('/caregiver-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.response?.data?.detail || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Join ElderCare AI to manage medication routines and peace of mind
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          I am registering as:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('elderly')}
            className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              role === 'elderly'
                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
            }`}
          >
            <Heart className={`w-5 h-5 ${role === 'elderly' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="text-xs font-bold">Elderly User</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('caregiver')}
            className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              role === 'caregiver'
                ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
            }`}
          >
            <Users className={`w-5 h-5 ${role === 'caregiver' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span className="text-xs font-bold">Caregiver / Nurse</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. eleanor@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Password (Min 6 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Phone (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {role === 'elderly' ? 'Age' : 'Years Experience'}
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={role === 'elderly' ? "e.g. 74" : "e.g. 8"}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-75 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-98 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>

    </div>
  );
};

export default RegisterPage;
