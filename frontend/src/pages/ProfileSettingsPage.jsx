import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  Eye, 
  Type, 
  Volume2, 
  Bell, 
  RotateCcw, 
  LogOut, 
  Check, 
  Loader2,
  Sparkles,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';

const ProfileSettingsPage = () => {
  const { user, logout, isElderly, isCaregiver } = useAuth();
  const { 
    fontSize, 
    setFontSize, 
    highContrast, 
    toggleHighContrast, 
    soundEnabled, 
    setSoundEnabled,
    notificationsAllowed,
    requestNotificationPermission
  } = useAccessibility();

  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const handleResetDemoData = async () => {
    if (!window.confirm("Reset all demo data back to clean presentation state?")) return;
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await api.post('/demo/reset');
      setResetMsg("Demo data reset successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      console.error("Failed to reset demo data:", err);
      setResetMsg("Error resetting demo data.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Preferences & Settings
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Profile & Care Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personal details, accessibility customizations, and system controls.
          </p>
        </div>

        <button
          onClick={logout}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Profile Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Registered Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-bold uppercase tracking-wider">Full Name</span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{user?.name}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-bold uppercase tracking-wider">Email Address</span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{user?.email}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-bold uppercase tracking-wider">Role</span>
            <span className="text-sm font-extrabold text-blue-600 mt-0.5 block uppercase">{user?.role}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block font-bold uppercase tracking-wider">Phone Number</span>
            <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{user?.phone || 'Not provided'}</span>
          </div>
        </div>

        {user?.medical_notes && (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 text-xs">
            <span className="text-blue-900 font-bold block mb-1">Medical Conditions & Notes:</span>
            <p className="text-slate-700 leading-relaxed">{user.medical_notes}</p>
          </div>
        )}
      </div>

      {/* Accessibility Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-600" />
          <span>Accessibility Customizations</span>
        </h2>
        <p className="text-xs text-slate-500">
          Personalize text size, contrast, and audio feedback for easier viewing.
        </p>

        <div className="space-y-4 pt-2">
          {/* Font Size Scaling */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-3">
            <div>
              <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-600" />
                <span>Text Size Scaling</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Increases font sizes across all buttons and schedules</p>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fontSize === 'normal' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fontSize === 'large' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Large (1.2x)
              </button>
              <button
                onClick={() => setFontSize('xl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  fontSize === 'xl' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Extra Large (1.4x)
              </button>
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-600" />
                <span>High Contrast Mode</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">High-contrast dark background for low-vision accessibility</p>
            </div>

            <button
              onClick={toggleHighContrast}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                highContrast 
                  ? 'bg-black text-yellow-300 border-2 border-yellow-400 shadow-sm' 
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {highContrast ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Audio Chime Feedback */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-600" />
                <span>Audio Chimes</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Plays gentle chimes when a medicine is marked taken</p>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Browser Notifications */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>Browser Reminders</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Receive alert notifications while application tab is open</p>
            </div>

            <button
              onClick={requestNotificationPermission}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                notificationsAllowed 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {notificationsAllowed ? 'Allowed' : 'Enable'}
            </button>
          </div>
        </div>
      </div>

      {/* Hackathon Demo Reset Control */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-3xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-amber-950 font-black text-base">
          <RotateCcw className="w-5 h-5 text-amber-600" />
          <span>Hackathon Demo Data Management</span>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed">
          Need to present the demo to judges again? Reset all medication logs, health vitals, and emergency events back to the initial demonstration state.
        </p>

        {resetMsg && (
          <p className="text-xs font-bold text-emerald-800 bg-emerald-100 p-2.5 rounded-xl">
            {resetMsg}
          </p>
        )}

        <button
          onClick={handleResetDemoData}
          disabled={resetting}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-75 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          {resetting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Resetting Demo...</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo to Initial State</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default ProfileSettingsPage;
