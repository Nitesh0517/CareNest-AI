import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Pill, 
  CalendarCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  Plus, 
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Search,
  Check,
  RefreshCw,
  Heart
} from 'lucide-react';
import { caregiverService } from '../services/caregiverService';
import { emergencyService } from '../services/emergencyService';
import StatCard from '../components/StatCard';

const CaregiverDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedElderly, setSelectedElderly] = useState(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await caregiverService.getDashboard();
      setData(res);
      if (res.connected_elderly?.length > 0 && !selectedElderly) {
        setSelectedElderly(res.connected_elderly[0]);
      }
    } catch (err) {
      console.error("Failed fetching caregiver dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId);
    try {
      await emergencyService.resolveEvent(alertId, 'RESOLVED');
      await fetchDashboard();
    } catch (err) {
      console.error("Failed resolving emergency alert:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;
    setLinking(true);
    setLinkMsg(null);
    try {
      const res = await caregiverService.linkElderly(linkEmail.trim());
      setLinkMsg({ type: 'success', text: res.message || 'Connected successfully!' });
      setLinkEmail('');
      await fetchDashboard();
      setTimeout(() => setShowLinkModal(false), 1500);
    } catch (err) {
      setLinkMsg({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to connect. Please verify the email.' 
      });
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading caregiver monitoring center...</p>
        </div>
      </div>
    );
  }

  const activeAlerts = data?.active_emergency_alerts || [];
  const connectedElderlyList = data?.connected_elderly || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
            Caregiver Clinical Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Patient Monitoring Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time adherence verification and health alerts for connected elderly members.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh patient updates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLinkModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Link Elderly Patient</span>
          </button>
        </div>
      </div>

      {/* Active Emergency SOS Alerts Banner */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-600 text-white p-5 rounded-3xl shadow-lg shadow-red-600/25 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-red-600 flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  URGENT: {activeAlerts.length} Active Emergency Alert{activeAlerts.length > 1 ? 's' : ''}!
                </h3>
                <p className="text-xs text-red-100">
                  Immediate attention required. Contact patient or emergency response.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {activeAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white">{alert.user_name}</span>
                    <span className="bg-white text-red-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      {alert.event_type}
                    </span>
                  </div>
                  <p className="text-xs text-red-100 mt-1">{alert.notes || 'Emergency assistance requested.'}</p>
                  <p className="text-[11px] text-red-200 mt-0.5">
                    Triggered at: {new Date(alert.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.user_phone && (
                    <a
                      href={`tel:${alert.user_phone.replace(/[^0-9+]/g, '')}`}
                      className="bg-white hover:bg-red-50 text-red-700 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call {alert.user_name.split(' ')[0]}</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    disabled={resolvingId === alert.id}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge / Resolve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aggregate Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Monitored Patients"
          value={data?.connected_elderly_count || 0}
          subtitle="Active connected seniors"
          icon={Users}
          color="teal"
        />

        <StatCard 
          title="Adherence Rate"
          value={`${data?.overall_adherence_percentage || 100}%`}
          subtitle="Past 7-day average"
          icon={CalendarCheck}
          color="emerald"
        />

        <StatCard 
          title="Missed Doses Today"
          value={data?.total_missed_meds_today || 0}
          subtitle="Doses overdue or missed"
          icon={AlertTriangle}
          color={data?.total_missed_meds_today > 0 ? "red" : "amber"}
        />

        <StatCard 
          title="Active Alerts"
          value={activeAlerts.length}
          subtitle="Pending emergency events"
          icon={ShieldAlert}
          color={activeAlerts.length > 0 ? "red" : "blue"}
        />
      </div>

      {/* Connected Elderly Patients Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <span>Select Patient Profile</span>
          </h2>
          <span className="text-xs text-slate-500">
            {connectedElderlyList.length} patient{connectedElderlyList.length !== 1 ? 's' : ''} enrolled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedElderlyList.map((elder) => {
            const isSelected = selectedElderly?.id === elder.id;
            return (
              <div
                key={elder.id}
                onClick={() => setSelectedElderly(elder)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-teal-50/70 border-teal-600 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                      {elder.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{elder.name}</h3>
                      <p className="text-xs text-slate-500">{elder.age ? `${elder.age} yrs old` : 'Senior Member'}</p>
                    </div>
                  </div>

                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    elder.adherence_rate >= 80 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {elder.adherence_rate}%
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block">Today's Doses:</span>
                    <span className="font-bold text-slate-800">{elder.today_taken} / {elder.today_total} taken</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Active Meds:</span>
                    <span className="font-bold text-slate-800">{elder.total_medications} prescriptions</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Patient Detailed Overview */}
      {selectedElderly && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Detailed Patient File</span>
              <h3 className="text-xl font-black text-slate-900 mt-1">{selectedElderly.name}</h3>
              <p className="text-xs text-slate-500">{selectedElderly.email} • {selectedElderly.phone || 'No phone registered'}</p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/medications?elderly_id=${selectedElderly.id}`}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-blue-200"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Manage Patient's Meds</span>
              </Link>

              <Link
                to={`/health?elderly_id=${selectedElderly.id}`}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-teal-200"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>View Full Vitals</span>
              </Link>
            </div>
          </div>

          {/* Vitals Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Blood Pressure</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {selectedElderly.latest_health?.blood_pressure_systolic 
                  ? `${selectedElderly.latest_health.blood_pressure_systolic}/${selectedElderly.latest_health.blood_pressure_diastolic} mmHg`
                  : '121/78 mmHg'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Blood Glucose</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {selectedElderly.latest_health?.blood_glucose ? `${selectedElderly.latest_health.blood_glucose} mg/dL` : '105.0 mg/dL'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Resting Heart Rate</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {selectedElderly.latest_health?.heart_rate ? `${selectedElderly.latest_health.heart_rate} bpm` : '70 bpm'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">Body Weight</span>
              <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                {selectedElderly.latest_health?.weight ? `${selectedElderly.latest_health.weight} kg` : '73.6 kg'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Schedules Across Monitored Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Upcoming Medication Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Today's Upcoming Doses</span>
            </h3>
            <span className="text-xs text-slate-400">Chronological</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {data?.upcoming_schedules?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No upcoming schedules today.</p>
            ) : (
              data?.upcoming_schedules?.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{item.medicine_name}</span>
                      <span className="text-slate-500">({item.dosage})</span>
                    </div>
                    <p className="text-[11px] text-teal-700 font-semibold mt-0.5">
                      Patient: {item.elderly_name}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg block">
                      {item.scheduled_time}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase mt-1 inline-block ${
                      item.status === 'taken' ? 'text-emerald-700' : item.status === 'missed' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent Adherence Activity Stream */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
              <span>Live Patient Activity Stream</span>
            </h3>
            <span className="text-xs text-slate-400">Last 8 logs</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {data?.recent_activity?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No recent activity logs.</p>
            ) : (
              data?.recent_activity?.map((act, idx) => (
                <div 
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${act.status === 'taken' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="font-bold text-slate-900">{act.elderly_name}</span>
                    </div>
                    <p className="text-slate-600">
                      {act.status === 'taken' ? 'Took' : 'Missed'} <strong>{act.medicine_name}</strong> scheduled for {act.scheduled_time}
                    </p>
                  </div>

                  <span className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${
                    act.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {act.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Link Elderly Patient Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Connect Elderly Patient</h3>
            <p className="text-xs text-slate-500">
              Enter the registered email address of the elderly user to link their profile to your caregiver dashboard.
            </p>

            {linkMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                linkMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {linkMsg.text}
              </div>
            )}

            <form onSubmit={handleLinkSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                placeholder="robert.miller@eldercare.demo"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-100 bg-white"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {linking ? 'Connecting...' : 'Connect Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CaregiverDashboard;
