import React from 'react';
import { Bell, AlertCircle, Clock, Check, BellRing } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const ReminderBanner = ({ nextReminder, overdueCount = 0, onMarkTaken }) => {
  const { notificationsAllowed, requestNotificationPermission } = useAccessibility();

  if (!nextReminder && overdueCount === 0 && notificationsAllowed) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Overdue alert banner if any meds are overdue */}
      {overdueCount > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500 text-amber-950 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base">
                {overdueCount} Medication {overdueCount > 1 ? 'doses are' : 'dose is'} Overdue
              </p>
              <p className="text-xs text-amber-800">
                Please take your scheduled medication with water or check with your caregiver.
              </p>
            </div>
          </div>
          <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
            ACTION NEEDED
          </span>
        </div>
      )}

      {/* Next reminder notification banner */}
      {nextReminder && (
        <div className="bg-blue-50 border border-blue-200 text-blue-950 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Next Scheduled Dose:</span>
                <span className="font-black text-sm bg-blue-200/70 text-blue-900 px-2 py-0.5 rounded-md">
                  {nextReminder.scheduled_time}
                </span>
              </div>
              <p className="font-bold text-base text-slate-900 mt-0.5">
                {nextReminder.medicine_name} <span className="text-sm font-normal text-slate-600">({nextReminder.dosage})</span>
              </p>
              {nextReminder.instructions && (
                <p className="text-xs text-slate-500 mt-0.5">{nextReminder.instructions}</p>
              )}
            </div>
          </div>

          {onMarkTaken && (
            <button
              onClick={() => onMarkTaken(nextReminder)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Mark as Taken</span>
            </button>
          )}
        </div>
      )}

      {/* Browser notification opt-in pill if not granted yet */}
      {!notificationsAllowed && (
        <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Enable browser alerts to receive medication reminders while this tab is open.</span>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs shrink-0 cursor-pointer"
          >
            Turn On Alerts
          </button>
        </div>
      )}
    </div>
  );
};

export default ReminderBanner;
