import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, 
  Pill, 
  Activity, 
  Bot, 
  ShieldAlert, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Heart,
  Eye,
  Type
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { demoLogin, isAuthenticated, isCaregiver, isElderly } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemo = async (role) => {
    try {
      await demoLogin(role);
      if (role === 'caregiver') {
        navigate('/caregiver-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Demo login error:", err);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            CareNest <span className="text-blue-600">AI</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to={isCaregiver ? "/caregiver-dashboard" : "/dashboard"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-xs flex items-center gap-2 transition-all"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-xs transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center">
        
        {/* Hackathon Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs sm:text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>PromptWars × Catalyst Hackathon Project</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          Smart Elderly Care & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600">
            Medication Management
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Empowering seniors to live independently while keeping family caregivers reassured with real-time adherence tracking, Google Gemini AI wellness guidance, and rapid SOS emergency support.
        </p>

        {/* Demo Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
          <button
            onClick={() => handleQuickDemo('elderly')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2.5 text-base transition-transform active:scale-95 cursor-pointer"
          >
            <Heart className="w-5 h-5" />
            <span>Try Elderly Demo (Robert)</span>
          </button>

          <button
            onClick={() => handleQuickDemo('caregiver')}
            className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2.5 text-base transition-transform active:scale-95 cursor-pointer"
          >
            <Users className="w-5 h-5" />
            <span>Try Caregiver Demo (Sarah RN)</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Instant 1-click test logins with realistic demo medications & vitals.
        </p>
      </section>

      {/* Core Problem & Solution Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Solving the Daily Struggles of Elderly Healthcare
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Engineered for clarity, compassion, and clinical reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Pill className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Zero Confusion Medication Schedules</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Clear daily timeline, visual dose cards, and large "Mark as Taken" buttons prevent missed doses and double-dosing accidents.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Live Caregiver Adherence Dashboard</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Family members and nurses receive instant visibility into whether medications were taken on time, with weekly adherence percentages and alert notifications.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Google Gemini AI Care Assistant</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Answers health questions, explains medicine leaflets in plain terms, and provides compassionate senior wellness advice with strict safety guardrails.
            </p>
          </div>

        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            
            {/* Left Column: Description */}
            <div className="space-y-6">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Accessible By Design
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Designed Specially for Seniors, Trusted by Families
              </h2>
              <p className="text-slate-600 leading-relaxed">
                ElderCare AI was crafted from the ground up for older adults who find typical medical apps confusing. High contrast mode, scalable text, and high-visibility buttons ensure accessibility.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium">
                    <strong>High Contrast Mode & Font Scaling:</strong> Seamless toggling between standard, 1.2x, and 1.4x text sizes for effortless reading.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium">
                    <strong>One-Tap Red Emergency SOS:</strong> Immediately alerts registered caregivers and dials 911 or primary contacts with zero delay.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 font-medium">
                    <strong>Health Vitals Analytics:</strong> Log blood pressure, glucose, heart rate, and weight with Recharts graphical trend visualization.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Mini Interactive Preview Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    RM
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Robert Miller (76)</h4>
                    <p className="text-xs text-slate-500">Adherence Score: 88%</p>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  3 Doses Taken Today
                </span>
              </div>

              {/* Sample timeline item */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">08:00 AM • Morning</p>
                  <p className="font-bold text-sm text-slate-900">Lisinopril (10 mg)</p>
                  <p className="text-xs text-slate-500">Take with water after breakfast</p>
                </div>
                <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                  ✓ Taken
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">01:00 PM • Lunch</p>
                  <p className="font-bold text-sm text-slate-900">Glucosamine & Chondroitin (1 cap)</p>
                  <p className="text-xs text-slate-500">Take with lunch for knee mobility</p>
                </div>
                <button 
                  onClick={() => handleQuickDemo('elderly')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  Mark Taken
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleQuickDemo('elderly')}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Click to Explore Live Interactive Dashboard →
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800">ElderCare AI</span>
            <span>• Developed for PromptWars × Catalyst</span>
          </div>
          <p>© 2026 ElderCare AI Platform. Full-Stack React & FastAPI Production Build.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
