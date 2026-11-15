import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Activity, 
  Heart, 
  Plus, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Info, 
  Check, 
  Loader2, 
  X,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { healthService } from '../services/healthService';
import { caregiverService } from '../services/caregiverService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

const HealthMonitoring = () => {
  const { user, isCaregiver } = useAuth();
  const [searchParams] = useSearchParams();
  const elderlyIdParam = searchParams.get('elderly_id');

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(elderlyIdParam ? parseInt(elderlyIdParam, 10) : null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [glucose, setGlucose] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  const loadHealthData = async () => {
    setLoading(true);
    try {
      if (isCaregiver) {
        const pList = await caregiverService.getElderlyUsers();
        setPatients(pList);
        const targetId = selectedPatientId || (pList.length > 0 ? pList[0].id : null);
        if (targetId) {
          setSelectedPatientId(targetId);
          const data = await healthService.getHealthRecords(targetId, 30);
          setRecords(data);
        }
      } else {
        const data = await healthService.getHealthRecords(null, 30);
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed loading health data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, [selectedPatientId]);

  const handleOpenAdd = () => {
    setSystolic('');
    setDiastolic('');
    setGlucose('');
    setHeartRate('');
    setWeight('');
    setNotes('');
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!systolic && !glucose && !heartRate && !weight) {
      setFormError("Please enter at least one measurement.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      blood_pressure_systolic: systolic ? parseInt(systolic, 10) : null,
      blood_pressure_diastolic: diastolic ? parseInt(diastolic, 10) : null,
      blood_glucose: glucose ? parseFloat(glucose) : null,
      heart_rate: heartRate ? parseInt(heartRate, 10) : null,
      weight: weight ? parseFloat(weight) : null,
      notes: notes.trim() || null,
      recorded_at: new Date().toISOString()
    };

    if (isCaregiver && selectedPatientId) {
      payload.user_id = selectedPatientId;
    }

    try {
      await healthService.createHealthRecord(payload);
      setShowModal(false);
      await loadHealthData();
    } catch (err) {
      console.error("Save health record error:", err);
      setFormError(err.response?.data?.detail || "Failed saving record.");
    } finally {
      setSaving(false);
    }
  };

  const latest = records.length > 0 ? records[0] : null;

  // Format historical chart data (chronological order for graph)
  const chartData = [...records].reverse().map(r => {
    const d = new Date(r.recorded_at);
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      systolic: r.blood_pressure_systolic,
      diastolic: r.blood_pressure_diastolic,
      glucose: r.blood_glucose,
      heart_rate: r.heart_rate,
      weight: r.weight,
    };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
            Vital Signs & Measurements
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Health Vitals Tracking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Log and review blood pressure, blood sugar, heart rate, and body weight over time.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-teal-700 hover:bg-teal-800 text-white font-extrabold px-5 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-md shadow-teal-700/25 transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Record New Vitals</span>
        </button>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="bg-blue-50/70 border border-blue-200 text-blue-900 p-4 rounded-3xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-extrabold text-blue-950">Important Medical Disclaimer:</p>
          <p className="text-blue-800 mt-0.5">
            Recorded measurements are stored strictly for personal wellness tracking and caregiver monitoring. ElderCare AI does not diagnose illnesses or provide clinical prescriptions. Never alter your dosage without explicit instruction from your physician.
          </p>
        </div>
      </div>

      {/* Patient Selector for Caregivers */}
      {isCaregiver && patients.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 p-4 rounded-3xl flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-teal-900">Patient:</span>
          <div className="flex items-center gap-2">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPatientId === p.id ? 'bg-teal-700 text-white shadow-xs' : 'bg-white text-slate-700'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Latest Vitals Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Blood Pressure"
          value={latest?.blood_pressure_systolic && latest?.blood_pressure_diastolic
            ? `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`
            : '—'}
          subtitle="mmHg (Systolic / Diastolic)"
          icon={Activity}
          color="blue"
        />

        <StatCard 
          title="Blood Glucose"
          value={latest?.blood_glucose ? `${latest.blood_glucose}` : '—'}
          subtitle="mg/dL"
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard 
          title="Resting Heart Rate"
          value={latest?.heart_rate ? `${latest.heart_rate}` : '—'}
          subtitle="bpm"
          icon={Heart}
          color="rose"
        />

        <StatCard 
          title="Body Weight"
          value={latest?.weight ? `${latest.weight}` : '—'}
          subtitle="kg"
          icon={Activity}
          color="teal"
        />
      </div>

      {/* Recharts Graphical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Blood Pressure Trends */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Blood Pressure Trends (mmHg)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Systolic & Diastolic</span>
          </div>

          <div className="h-64 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '16px', color: '#FFF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" name="Systolic (Top)" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="diastolic" name="Diastolic (Bottom)" stroke="#0F766E" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No blood pressure records yet.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Blood Glucose & Heart Rate Trends */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Blood Glucose (mg/dL) & Heart Rate (bpm)</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Vitals Log</span>
          </div>

          <div className="h-64 w-full pt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '16px', color: '#FFF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="glucose" name="Glucose (mg/dL)" stroke="#16A34A" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="heart_rate" name="Heart Rate (bpm)" stroke="#EA580C" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No glucose or heart rate records yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Historical Records Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Historical Measurements Log ({records.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading measurements...</div>
        ) : records.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400 italic">No health records logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-black tracking-wider">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Blood Pressure</th>
                  <th className="py-3 px-3">Glucose</th>
                  <th className="py-3 px-3">Heart Rate</th>
                  <th className="py-3 px-3">Weight</th>
                  <th className="py-3 px-3">Clinical Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {new Date(r.recorded_at).toLocaleDateString()} {new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {r.blood_pressure_systolic && r.blood_pressure_diastolic
                        ? `${r.blood_pressure_systolic}/${r.blood_pressure_diastolic} mmHg`
                        : '—'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">
                      {r.blood_glucose ? `${r.blood_glucose} mg/dL` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {r.heart_rate ? `${r.heart_rate} bpm` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {r.weight ? `${r.weight} kg` : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Measurement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Record Health Vitals</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-3.5">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Blood Pressure (mmHg)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="Systolic (e.g. 120)"
                    min={50}
                    max={300}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="Diastolic (e.g. 80)"
                    min={30}
                    max={200}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Blood Glucose (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={glucose}
                    onChange={(e) => setGlucose(e.target.value)}
                    placeholder="e.g. 105.0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 73.5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes / Symptoms
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Measured before breakfast, resting 5 mins."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Vitals'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HealthMonitoring;
