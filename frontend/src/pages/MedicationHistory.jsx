import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Filter,
  RefreshCw,
  Users
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { medicationService } from '../services/medicationService';
import { caregiverService } from '../services/caregiverService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';

const MedicationHistory = () => {
  const { user, isCaregiver } = useAuth();
  const [adherenceData, setAdherenceData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [days, setDays] = useState(7);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isCaregiver) {
        const patientsList = await caregiverService.getElderlyUsers();
        setPatients(patientsList);
        const targetId = selectedPatientId || (patientsList.length > 0 ? patientsList[0].id : null);
        if (targetId) {
          setSelectedPatientId(targetId);
          const [adh, logList] = await Promise.all([
            medicationService.getAdherence(targetId, days),
            medicationService.getLogs(targetId, days)
          ]);
          setAdherenceData(adh);
          setLogs(logList);
        }
      } else {
        const [adh, logList] = await Promise.all([
          medicationService.getAdherence(null, days),
          medicationService.getLogs(null, days)
        ]);
        setAdherenceData(adh);
        setLogs(logList);
      }
    } catch (err) {
      console.error("Failed fetching adherence history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, selectedPatientId]);

  const filteredLogs = logs.filter(l => {
    if (filterStatus === 'all') return true;
    return l.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Adherence Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Medication History & Adherence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical records, timestamps, and compliance analytics over time.
          </p>
        </div>

        {/* Days Filter */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              days === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setDays(14)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              days === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              days === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Patient Selector if Caregiver */}
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

      {/* Key Metric Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Adherence Score"
          value={`${adherenceData?.adherence_percentage || 100}%`}
          subtitle={`Across past ${days} days`}
          icon={TrendingUp}
          color="emerald"
        />

        <StatCard 
          title="Total Logged Doses"
          value={adherenceData?.total_doses || 0}
          subtitle="Doses recorded"
          icon={CalendarCheck}
          color="blue"
        />

        <StatCard 
          title="Doses Taken"
          value={adherenceData?.taken_doses || 0}
          subtitle="Confirmed on-time or logged"
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard 
          title="Doses Missed"
          value={adherenceData?.missed_doses || 0}
          subtitle="Missed or skipped doses"
          icon={AlertCircle}
          color={adherenceData?.missed_doses > 0 ? "red" : "amber"}
        />
      </div>

      {/* Graphical Adherence Chart (Recharts) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Daily Adherence Breakdown (Taken vs Missed)
          </h2>
          <span className="text-xs font-bold text-slate-400">Past {days} days</span>
        </div>

        <div className="h-72 w-full pt-4">
          {adherenceData?.history && adherenceData.history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceData.history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '16px', color: '#FFF', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="taken" name="Taken Doses" fill="#16A34A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="missed" name="Missed Doses" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No historical chart data available.
            </div>
          )}
        </div>
      </div>

      {/* Historical Logs Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Detailed Dose Audit Log
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Filter:</span>
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-bold ${filterStatus === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
              >
                All ({logs.length})
              </button>
              <button
                onClick={() => setFilterStatus('taken')}
                className={`px-2.5 py-1 rounded-lg font-bold ${filterStatus === 'taken' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Taken
              </button>
              <button
                onClick={() => setFilterStatus('missed')}
                className={`px-2.5 py-1 rounded-lg font-bold ${filterStatus === 'missed' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600'}`}
              >
                Missed
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading history logs...</div>
        ) : filteredLogs.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400 italic">No logs found matching this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-black tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Scheduled</th>
                  <th className="py-3 px-3">Medicine</th>
                  <th className="py-3 px-3">Dosage</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Taken At Timestamp</th>
                  <th className="py-3 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-slate-800">
                      {log.log_date}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                      {log.scheduled_time}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      {log.medication_name}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      {log.dosage}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-1 rounded-full text-[10px] uppercase ${
                        log.status === 'taken' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'taken' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono">
                      {log.taken_at ? new Date(log.taken_at).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate">
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default MedicationHistory;
