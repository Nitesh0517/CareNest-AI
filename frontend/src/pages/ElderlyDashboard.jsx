import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Activity, 
  Bot, 
  PhoneCall, 
  Calendar, 
  ArrowRight, 
  Heart,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';
import api from '../services/api';
import { medicationService } from '../services/medicationService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import MedicationCard from '../components/MedicationCard';
import ReminderBanner from '../components/ReminderBanner';
import EmergencyModal from '../components/EmergencyModal';

const ElderlyDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSOS, setShowSOS] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/elderly');
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed fetching elderly dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleMarkTaken = async (timelineItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await medicationService.recordLog({
        medication_id: timelineItem.medication_id,
        scheduled_time: timelineItem.scheduled_time,
        log_date: todayStr,
        status: 'taken',
        notes: 'Marked taken by elderly user from dashboard'
      });
      // Refresh dashboard to show real-time updated status & timestamps
      await fetchDashboard();
    } catch (err) {
      console.error("Failed marking medication as taken:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  const todayTimeline = dashboardData?.today_timeline || [];
  const nextReminder = dashboardData?.next_reminder;
  const overdueCount = dashboardData?.today_missed_meds || 0;
  const latestHealth = dashboardData?.latest_health;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Welcome Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Good day, {user?.name || 'Friend'}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is your daily medication schedule and health status summary.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchDashboard();
            }}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <Link
            to="/assistant"
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors border border-indigo-200"
          >
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Smart Reminder & Notification Banner */}
      <ReminderBanner 
        nextReminder={nextReminder}
        overdueCount={overdueCount}
        onMarkTaken={handleMarkTaken}
      />

      {/* Medication Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Meds"
          value={dashboardData?.today_total_meds || 0}
          subtitle="Doses scheduled today"
          icon={Pill}
          color="blue"
        />

        <StatCard 
          title="Completed"
          value={dashboardData?.today_taken_meds || 0}
          subtitle="Doses taken successfully"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard 
          title="Upcoming"
          value={dashboardData?.today_pending_meds || 0}
          subtitle="Pending doses today"
          icon={Clock}
          color="teal"
        />

        <StatCard 
          title="Missed / Late"
          value={dashboardData?.today_missed_meds || 0}
          subtitle="Needs attention"
          icon={AlertCircle}
          color={dashboardData?.today_missed_meds > 0 ? "red" : "amber"}
        />
      </div>

      {/* Two Column Section: Today's Timeline + Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Today's Medication Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              <span>Today's Medication Timeline</span>
            </h2>

            <Link
              to="/medications"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Manage Medicines</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {todayTimeline.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 text-base">No medications scheduled for today</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your prescribed medicines to start tracking daily dosage times and automatic reminders.
              </p>
              <Link
                to="/medications"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medication</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTimeline.map((item, idx) => (
                <MedicationCard
                  key={`${item.medication_id}-${item.scheduled_time}-${idx}`}
                  item={item}
                  onMarkTaken={handleMarkTaken}
                  canEdit={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Health Vitals & SOS Card */}
        <div className="space-y-6">

          {/* Emergency Quick Action Card */}
          <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-3xl p-6 shadow-md shadow-red-600/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Instant Help
              </span>
              <Heart className="w-5 h-5 text-red-200 fill-red-200" />
            </div>

            <h3 className="text-xl font-black">Emergency SOS</h3>
            <p className="text-xs text-red-100 leading-relaxed">
              Feeling unwell or had a fall? One tap alerts your family caregiver and connects to your doctor.
            </p>

            <button
              onClick={() => setShowSOS(true)}
              className="w-full bg-white hover:bg-red-50 text-red-600 font-extrabold py-3 px-4 rounded-2xl shadow-sm text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Open Emergency Screen</span>
            </button>
          </div>

          {/* Latest Health Vitals Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <span>Recent Health Vitals</span>
              </h3>
              <Link
                to="/health"
                className="text-xs font-bold text-teal-700 hover:text-teal-900"
              >
                Log New
              </Link>
            </div>

            {latestHealth ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                  <span className="text-xs text-slate-500 font-semibold">Blood Pressure</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {latestHealth.blood_pressure_systolic && latestHealth.blood_pressure_diastolic
                      ? `${latestHealth.blood_pressure_systolic}/${latestHealth.blood_pressure_diastolic} mmHg`
                      : 'Not recorded'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                  <span className="text-xs text-slate-500 font-semibold">Blood Glucose</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {latestHealth.blood_glucose ? `${latestHealth.blood_glucose} mg/dL` : 'Not recorded'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                  <span className="text-xs text-slate-500 font-semibold">Heart Rate</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {latestHealth.heart_rate ? `${latestHealth.heart_rate} bpm` : 'Not recorded'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                  <span className="text-xs text-slate-500 font-semibold">Weight</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {latestHealth.weight ? `${latestHealth.weight} kg` : 'Not recorded'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 italic text-center pt-1">
                  Recorded on {new Date(latestHealth.recorded_at).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                <p>No health measurements logged yet.</p>
                <Link
                  to="/health"
                  className="font-bold text-teal-600 hover:underline mt-1 inline-block"
                >
                  Record Your Blood Pressure & Glucose →
                </Link>
              </div>
            )}
          </div>

          {/* AI Helper Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>ElderCare AI Care Assistant</span>
            </div>
            <p className="text-xs text-indigo-800 leading-relaxed">
              Have a question about whether to take your pill with breakfast or need general wellness advice?
            </p>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-xl shadow-2xs"
            >
              <span>Chat with Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

      {showSOS && <EmergencyModal onClose={() => setShowSOS(false)} />}
    </div>
  );
};

export default ElderlyDashboard;
