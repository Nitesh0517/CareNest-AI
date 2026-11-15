import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  HeartHandshake,
  ExternalLink
} from 'lucide-react';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from '../context/AuthContext';

const EmergencyModal = ({ onClose }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringSOS, setTriggeringSOS] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosEvent, setSosEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await emergencyService.getContacts();
        setContacts(data);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const handleBroadcastSOS = async () => {
    setTriggeringSOS(true);
    setError(null);
    try {
      const event = await emergencyService.triggerSOS(
        `Immediate SOS triggered by ${user?.name || 'User'} from web application.`
      );
      setSosEvent(event);
      setSosSent(true);
    } catch (err) {
      console.error("SOS trigger error:", err);
      setError("Failed to broadcast SOS to server. Please call emergency services directly.");
    } finally {
      setTriggeringSOS(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-4 border-red-500 overflow-hidden relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-modal-title"
      >
        {/* Header Banner */}
        <div className="bg-red-600 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 id="emergency-modal-title" className="text-xl sm:text-2xl font-black tracking-tight">
                Emergency Assistance
              </h2>
              <p className="text-red-100 text-xs sm:text-sm">
                ElderCare Rapid Response & SOS Alert
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">

          {/* Life-threatening guidance */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-sm">
            <p className="font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              If you are facing severe chest pain or breathing issues:
            </p>
            <div className="mt-2 flex items-center gap-3">
              <a 
                href="tel:911"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl shadow-md text-base transition-transform active:scale-95"
              >
                <PhoneCall className="w-5 h-5" />
                Call 911 Immediately
              </a>
              <span className="text-xs text-amber-700 font-medium">Available 24/7 in North America</span>
            </div>
          </div>

          {/* SOS Broadcast Status */}
          {sosSent ? (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <p className="font-bold text-base">Emergency SOS Broadcast Created</p>
              </div>
              <p className="text-xs text-emerald-800">
                Your emergency event ID #{sosEvent?.id} is now registered in the system and visible on your connected caregiver's dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleBroadcastSOS}
                disabled={triggeringSOS}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-75 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 text-lg transition-all active:scale-98 cursor-pointer"
              >
                {triggeringSOS ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Broadcasting SOS Alert...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6" />
                    <span>Send SOS Alert to Connected Caregiver</span>
                  </>
                )}
              </button>
              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
            </div>
          )}

          {/* Registered Emergency Contacts with One-Tap Call */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Your Trusted Emergency Contacts</span>
              <span className="text-xs font-normal text-slate-500">Tap to call</span>
            </h3>

            {loading ? (
              <div className="py-4 text-center text-slate-400">Loading contacts...</div>
            ) : contacts.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                No emergency contacts added yet. Add one in Emergency Contacts settings.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{contact.name}</span>
                        {contact.is_primary && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{contact.relationship} • {contact.phone_number}</p>
                    </div>

                    <a
                      href={`tel:${contact.phone_number.replace(/[^0-9+]/g, '')}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 sm:px-3.5 sm:py-2 rounded-xl flex items-center gap-1.5 shadow-sm text-xs sm:text-sm active:scale-95 transition-all"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Close Dialog
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmergencyModal;
