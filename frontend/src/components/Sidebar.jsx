import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Pill, 
  CalendarCheck, 
  Activity, 
  Bot, 
  PhoneCall, 
  Settings, 
  Users,
  ShieldAlert,
  ChevronRight,
  Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isElderly, isCaregiver } = useAuth();

  const elderlyLinks = [
    { to: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { to: '/medications', label: 'My Medications', icon: Pill },
    { to: '/history', label: 'Adherence & Logs', icon: CalendarCheck },
    { to: '/health', label: 'Health Vitals', icon: Activity },
    { to: '/assistant', label: 'AI Care Assistant', icon: Bot, badge: 'Gemini' },
    { to: '/emergency', label: 'Emergency Contacts', icon: PhoneCall },
    { to: '/settings', label: 'Profile & Settings', icon: Settings },
  ];

  const caregiverLinks = [
    { to: '/caregiver-dashboard', label: 'Caregiver Overview', icon: LayoutDashboard },
    { to: '/medications', label: 'Medication Schedules', icon: Pill },
    { to: '/history', label: 'Adherence Records', icon: CalendarCheck },
    { to: '/health', label: 'Health Monitoring', icon: Activity },
    { to: '/assistant', label: 'ElderCare AI Assistant', icon: Bot, badge: 'Gemini' },
    { to: '/emergency', label: 'Emergency & SOS Alerts', icon: ShieldAlert },
    { to: '/settings', label: 'Profile & Care Settings', icon: Settings },
  ];

  const navLinks = isCaregiver ? caregiverLinks : elderlyLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside className={`
        fixed lg:sticky top-0 lg:top-[61px] left-0 h-screen lg:h-[calc(100vh-61px)] 
        w-68 bg-white border-r border-slate-200 z-50 lg:z-10
        flex flex-col justify-between transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 space-y-6 overflow-y-auto">

          {/* User Role Card */}
          <div className={`p-3.5 rounded-2xl border ${
            isCaregiver 
              ? 'bg-teal-50 border-teal-200 text-teal-900' 
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                isCaregiver ? 'bg-teal-700' : 'bg-blue-600'
              }`}>
                {isCaregiver ? <Users className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs uppercase font-bold tracking-wider opacity-75">
                  {isCaregiver ? 'Caregiver Portal' : 'Elderly Member'}
                </p>
                <p className="text-sm font-bold truncate text-slate-900">{user?.name || 'Welcome'}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>PromptWars × Catalyst</span>
            <span className="font-semibold text-blue-600">v1.0</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Production Hackathon Ready</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
