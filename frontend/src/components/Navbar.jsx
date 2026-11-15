import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, 
  AlertTriangle, 
  LogOut, 
  Eye, 
  Volume2, 
  VolumeX, 
  Type, 
  User as UserIcon,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import EmergencyModal from './EmergencyModal';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout, isElderly, isCaregiver } = useAuth();
  const { 
    fontSize, 
    setFontSize, 
    highContrast, 
    toggleHighContrast, 
    soundEnabled, 
    setSoundEnabled,
    playTone 
  } = useAccessibility();

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSOSTrigger = () => {
    playTone('sos');
    setShowSOSModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs px-4 lg:px-6 py-3 transition-colors">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Hamburger (mobile) + Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  CareNest <span className="text-blue-600">AI</span>
                </span>
                <p className="text-xs text-slate-500 hidden sm:block">Smart Elderly Care Platform</p>
              </div>
            </Link>
          </div>

          {/* Right: Emergency SOS, Accessibility Toggles, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Emergency SOS Button - Prominent & Senior-Friendly */}
            <button
              onClick={handleSOSTrigger}
              className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all border border-red-500 animate-pulse text-sm sm:text-base cursor-pointer"
              title="Immediate Emergency Assistance"
              aria-label="Emergency SOS Alert"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="tracking-wide">SOS HELP</span>
            </button>

            {/* Accessibility Controls Toolbar */}
            <div className="hidden md:flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              {/* Text Size Switcher */}
              <button
                onClick={() => {
                  const nextSize = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xl' : 'normal';
                  setFontSize(nextSize);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  fontSize !== 'normal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
                }`}
                title="Change font size (Normal / Large / Extra Large)"
              >
                <Type className="w-4 h-4" />
                <span>Text: {fontSize === 'normal' ? '1x' : fontSize === 'large' ? '1.2x' : '1.4x'}</span>
              </button>

              {/* High Contrast Toggle */}
              <button
                onClick={toggleHighContrast}
                className={`p-1.5 rounded-lg transition-colors ml-1 ${
                  highContrast ? 'bg-black text-yellow-300 border border-yellow-400' : 'text-slate-700 hover:bg-slate-200'
                }`}
                title={highContrast ? "Disable High Contrast" : "Enable High Contrast Mode"}
                aria-label="Toggle High Contrast Mode"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition-colors ml-1 ${
                  soundEnabled ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-400 hover:bg-slate-200'
                }`}
                title={soundEnabled ? "Audio alert chimes enabled" : "Audio alerts muted"}
                aria-label="Toggle Audio Alerts"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* User Profile Pill & Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                    isCaregiver ? 'bg-teal-700' : 'bg-blue-600'
                  }`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full inline-block ${
                      isCaregiver ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </button>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Profile & Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-xs transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* Emergency Confirmation Modal */}
      {showSOSModal && (
        <EmergencyModal onClose={() => setShowSOSModal(false)} />
      )}
    </>
  );
};

export default Navbar;
