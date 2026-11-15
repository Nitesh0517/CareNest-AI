import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  Loader2, 
  X,
  User,
  HeartHandshake,
  Clock,
  Phone
} from 'lucide-react';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import EmergencyModal from '../components/EmergencyModal';

const EmergencyContactsPage = () => {
  const { user } = useAuth();
  const { playTone } = useAccessibility();

  const [contacts, setContacts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, hList] = await Promise.all([
        emergencyService.getContacts(),
        emergencyService.getHistory()
      ]);
      setContacts(cList);
      setHistory(hList);
    } catch (err) {
      console.error("Failed loading emergency data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setFormError("Please enter name and phone number.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await emergencyService.addContact({
        name: name.trim(),
        phone_number: phone.trim(),
        relationship: relationship.trim(),
        is_primary: isPrimary
      });
      setShowAddContact(false);
      setName('');
      setPhone('');
      setIsPrimary(false);
      await loadData();
    } catch (err) {
      console.error("Failed adding contact:", err);
      setFormError(err.response?.data?.detail || "Failed to add emergency contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contact) => {
    if (!window.confirm(`Remove ${contact.name} from emergency contacts?`)) return;
    try {
      await emergencyService.deleteContact(contact.id);
      await loadData();
    } catch (err) {
      console.error("Delete contact error:", err);
    }
  };

  const handleResolveEvent = async (id) => {
    try {
      await emergencyService.resolveEvent(id, 'RESOLVED');
      await loadData();
    } catch (err) {
      console.error("Failed to resolve event:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
            Rapid Response & Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Emergency Contacts & SOS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered family members, physicians, and emergency services for rapid assistance.
          </p>
        </div>

        <button
          onClick={() => {
            playTone('sos');
            setShowModal(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-2xl text-sm flex items-center gap-2.5 shadow-lg shadow-red-600/30 transition-transform active:scale-95 cursor-pointer shrink-0 animate-pulse"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>TRIGGER SOS NOW</span>
        </button>
      </div>

      {/* 911 Direct Help Box */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-3xl p-6 shadow-md shadow-red-600/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <PhoneCall className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black">National Emergency Dispatch (911)</h3>
            <p className="text-xs text-red-100">For life-threatening acute distress, fire, or severe injury, dial immediately.</p>
          </div>
        </div>

        <a
          href="tel:911"
          className="bg-white hover:bg-red-50 text-red-700 font-extrabold px-6 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95 shrink-0"
        >
          <Phone className="w-4 h-4" />
          <span>Call 911 Direct</span>
        </a>
      </div>

      {/* Trusted Contacts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Trusted Personal Contacts ({contacts.length})</span>
          </h2>

          <button
            onClick={() => {
              setFormError(null);
              setShowAddContact(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <p className="font-bold text-slate-700">No emergency contacts registered yet.</p>
            <p className="text-xs text-slate-500">
              Please register at least one family member or primary caregiver.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                    {c.is_primary && (
                      <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.relationship}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{c.phone_number}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${c.phone_number.replace(/[^0-9+]/g, '')}`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-2xl flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                    title={`Call ${c.name}`}
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span className="text-xs hidden sm:inline">Call</span>
                  </a>

                  <button
                    onClick={() => handleDeleteContact(c)}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Event History Log */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          <span>Emergency Event Audit Log ({history.length})</span>
        </h2>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No emergency incidents recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-black">
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">
                      #{ev.id}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {ev.event_type}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase ${
                        ev.status === 'ACTIVE' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">
                      {ev.notes || '—'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {ev.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleResolveEvent(ev.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow-2xs"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Add Emergency Contact</h3>
              <button
                onClick={() => setShowAddContact(false)}
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

            <form onSubmit={handleAddContactSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. David Chen, Sarah Miller"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Daughter, Primary Care Physician"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContact"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded-md text-blue-600 border-slate-300"
                />
                <label htmlFor="primaryContact" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Set as primary emergency contact
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && <EmergencyModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default EmergencyContactsPage;
