import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Pill, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle, 
  Loader2, 
  X,
  Search,
  Filter,
  Info
} from 'lucide-react';
import { medicationService } from '../services/medicationService';
import { caregiverService } from '../services/caregiverService';
import { useAuth } from '../context/AuthContext';
import MedicationCard from '../components/MedicationCard';

const MedicationManagement = () => {
  const { user, isCaregiver } = useAuth();
  const [searchParams] = useSearchParams();
  const elderlyIdParam = searchParams.get('elderly_id');

  const [medications, setMedications] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(elderlyIdParam ? parseInt(elderlyIdParam, 10) : null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Form Fields
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once Daily');
  const [instructions, setInstructions] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('Blood Pressure');
  const [color, setColor] = useState('#2563EB');
  const [schedules, setSchedules] = useState(['08:00']);

  const colorOptions = [
    { label: 'Blue', value: '#2563EB' },
    { label: 'Teal', value: '#0F766E' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Orange', value: '#EA580C' },
    { label: 'Purple', value: '#7C3AED' },
    { label: 'Rose', value: '#E11D48' },
  ];

  const categoryOptions = [
    'Blood Pressure',
    'Diabetes',
    'Heart & Cardio',
    'Cholesterol',
    'Joint Care',
    'Pain Relief',
    'Supplements',
    'General',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      if (isCaregiver) {
        const patientsList = await caregiverService.getElderlyUsers();
        setPatients(patientsList);
        const targetId = selectedPatientId || (patientsList.length > 0 ? patientsList[0].id : null);
        if (targetId) {
          setSelectedPatientId(targetId);
          const [meds, today] = await Promise.all([
            medicationService.getMedications(targetId),
            medicationService.getTodaySchedule(targetId)
          ]);
          setMedications(meds);
          setTodaySchedule(today);
        }
      } else {
        const [meds, today] = await Promise.all([
          medicationService.getMedications(),
          medicationService.getTodaySchedule()
        ]);
        setMedications(meds);
        setTodaySchedule(today);
      }
    } catch (err) {
      console.error("Failed loading medications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatientId]);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setMedicineName('');
    setDosage('');
    setFrequency('Once Daily');
    setInstructions('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setCategory('General');
    setColor('#2563EB');
    setSchedules(['08:00']);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setMedicineName(med.medicine_name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setInstructions(med.instructions || '');
    setStartDate(med.start_date || new Date().toISOString().split('T')[0]);
    setEndDate(med.end_date || '');
    setCategory(med.category || 'General');
    setColor(med.color || '#2563EB');
    const existingTimes = med.schedules && med.schedules.length > 0
      ? med.schedules.map(s => s.scheduled_time)
      : ['08:00'];
    setSchedules(existingTimes);
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveMedication = async (e) => {
    e.preventDefault();
    if (!medicineName.trim() || !dosage.trim()) {
      setFormError("Please enter medicine name and dosage.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      medicine_name: medicineName.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      instructions: instructions.trim() || null,
      start_date: startDate,
      end_date: endDate || null,
      category,
      color,
      schedules: schedules.filter(t => t.trim().length > 0),
    };

    if (isCaregiver && selectedPatientId) {
      payload.user_id = selectedPatientId;
    }

    try {
      if (editingMed) {
        await medicationService.updateMedication(editingMed.id, payload);
      } else {
        await medicationService.createMedication(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (err) {
      console.error("Save error:", err);
      setFormError(err.response?.data?.detail || "Failed saving medication. Please check the inputs.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedication = async (med) => {
    if (!window.confirm(`Are you sure you want to delete ${med.medicine_name}? This cannot be undone.`)) {
      return;
    }
    try {
      await medicationService.deleteMedication(med.id);
      await loadData();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete medication.");
    }
  };

  const handleMarkTaken = async (item) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      await medicationService.recordLog({
        medication_id: item.medication_id,
        scheduled_time: item.scheduled_time,
        log_date: todayStr,
        status: 'taken',
        notes: `Marked taken via medication management by ${user?.name}`
      });
      await loadData();
    } catch (err) {
      console.error("Mark taken error:", err);
    }
  };

  const addScheduleTime = () => {
    setSchedules([...schedules, '12:00']);
  };

  const removeScheduleTime = (idx) => {
    if (schedules.length === 1) return;
    setSchedules(schedules.filter((_, i) => i !== idx));
  };

  const updateScheduleTime = (idx, val) => {
    const updated = [...schedules];
    updated[idx] = val;
    setSchedules(updated);
  };

  const filteredMeds = medications.filter(m => 
    m.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Prescriptions & Timings
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Medication Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure prescribed medicines, dosages, and exact daily alert times.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Medication</span>
        </button>
      </div>

      {/* Patient Selector if Caregiver */}
      {isCaregiver && patients.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-teal-950 font-bold text-sm">
            <span>Viewing medications for:</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {patients.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPatientId === p.id 
                    ? 'bg-teal-700 text-white shadow-xs' 
                    : 'bg-white text-slate-700 hover:bg-teal-100'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by medicine name, condition or category..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
        />
      </div>

      {/* Today's Live Medication Schedule Cards */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Today's Dosage Status & Action</span>
        </h2>

        {todaySchedule.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center text-slate-500 text-sm border border-slate-200">
            No active schedules for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaySchedule.map((item, idx) => (
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

      {/* All Prescribed Medications Table / Cards */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <span>All Prescriptions ({filteredMeds.length})</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading prescriptions...</div>
        ) : filteredMeds.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Pill className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-base">No medications found</p>
            <p className="text-xs text-slate-500">
              Click the "Add New Medication" button above to add a prescription.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeds.map((med) => (
              <div 
                key={med.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: med.color || '#2563EB' }}
                      >
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight">
                          {med.medicine_name}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500">
                          {med.dosage}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(med)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit prescription"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMedication(med)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete prescription"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <p><strong className="text-slate-800">Frequency:</strong> {med.frequency}</p>
                    {med.category && (
                      <p><strong className="text-slate-800">Category:</strong> {med.category}</p>
                    )}
                    {med.instructions && (
                      <p className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-xl">
                        "{med.instructions}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Daily Doses:</span>
                  {med.schedules && med.schedules.map(s => (
                    <span 
                      key={s.id} 
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{s.scheduled_time}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">
                {editingMed ? 'Edit Medication' : 'Add New Medication'}
              </h3>
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

            <form onSubmit={handleSaveMedication} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                    placeholder="e.g. Lisinopril, Metformin"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 10 mg (1 tablet)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Three Times Daily">Three Times Daily</option>
                    <option value="Every 8 Hours">Every 8 Hours</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Medical Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Timings Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                  <span>Scheduled Dose Times</span>
                  <button
                    type="button"
                    onClick={addScheduleTime}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Time</span>
                  </button>
                </label>

                <div className="space-y-2">
                  {schedules.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        required
                        value={time}
                        onChange={(e) => updateScheduleTime(idx, e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                      />
                      {schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeScheduleTime(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Food & Administration Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with food or a glass of water. Avoid lying down immediately."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Color Tag Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Visual Badge Color
                </label>
                <div className="flex items-center gap-3">
                  {colorOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setColor(opt.value)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === opt.value ? 'scale-125 ring-2 ring-slate-400 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: opt.value }}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : editingMed ? 'Save Changes' : 'Create Prescription'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MedicationManagement;
