import React, { useState } from 'react';
import { 
  Pill, 
  Check, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const MedicationCard = ({ 
  item, 
  onMarkTaken, 
  onEdit, 
  onDelete, 
  canEdit = true,
  simplified = false 
}) => {
  const { playTone } = useAccessibility();
  const [submitting, setSubmitting] = useState(false);

  const handleTakenClick = async () => {
    if (submitting || item.status === 'taken') return;
    setSubmitting(true);
    try {
      await onMarkTaken(item);
      playTone('success');
    } catch (err) {
      console.error("Failed marking medication as taken:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isTaken = item.status === 'taken';
  const isMissed = item.status === 'missed';
  const isUpcoming = item.status === 'upcoming';

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const formatTakenAt = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className={`
      relative rounded-3xl p-5 border transition-all duration-200
      ${isTaken 
        ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs' 
        : isMissed 
          ? 'bg-red-50/60 border-red-200 shadow-xs' 
          : 'bg-white border-slate-200 shadow-xs hover:shadow-md'
      }
    `}>
      <div className="flex items-start justify-between gap-3">
        
        {/* Left: Pill Icon & Name & Details */}
        <div className="flex items-start gap-3.5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs text-white"
            style={{ backgroundColor: item.color || '#2563EB' }}
          >
            <Pill className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {item.medicine_name}
              </h3>
              {item.category && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {item.category}
                </span>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              Dosage: <span className="text-slate-900">{item.dosage}</span>
            </p>

            {item.instructions && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {item.instructions}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Scheduled: {formatTime(item.scheduled_time)}</span>
              </span>

              {/* Status Badge */}
              {isTaken && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Taken {item.taken_at ? `at ${formatTakenAt(item.taken_at)}` : ''}</span>
                </span>
              )}

              {isMissed && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-red-100 text-red-800">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Overdue</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {(onEdit || onDelete) && canEdit && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit Medication"
                  aria-label="Edit Medication"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(item)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Medication"
                  aria-label="Delete Medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Senior-Friendly "Mark as Taken" Button */}
      {onMarkTaken && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          {isTaken ? (
            <div className="w-full py-2.5 px-4 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-bold text-sm flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-emerald-700" />
              <span>Dose Completed for Today</span>
            </div>
          ) : (
            <button
              onClick={handleTakenClick}
              disabled={submitting}
              className={`
                w-full py-3 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer
                ${isMissed 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }
              `}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Recording dose...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Mark as Taken</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicationCard;
