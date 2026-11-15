import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              CareNest <span className="text-blue-600">AI</span>
            </span>
          </div>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          PromptWars × Catalyst
        </span>
      </div>

      {/* Main Centered Content */}
      <div className="max-w-md w-full mx-auto my-8">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400">
        <p>© 2026 ElderCare AI • Dedicated to Compassionate, Intelligent Elderly Care</p>
      </div>
    </div>
  );
};

export default AuthLayout;
