// src/cmps/RehearsalPreview.tsx
import { Rehearsal } from '../services/rehearsalService';
import { Edit, Trash2, Clock, MapPin } from 'lucide-react';

interface RehearsalPreviewProps {
  rehearsal: Rehearsal;
  orchestraName: string;
  onView: (rehearsalId: string) => void;
  onEdit?: (rehearsalId: string) => void;
  onRemove?: (rehearsalId: string) => void;
  onRemoveOrchestra?: (orchestraId: string, rehearsalId: string) => void;
  isToday?: boolean;
}

export function RehearsalPreview({
  rehearsal,
  orchestraName,
  onView,
  onEdit,
  onRemove,
  onRemoveOrchestra,
  isToday = false,
}: RehearsalPreviewProps) {
  // Calculate duration in minutes
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;

    return end - start;
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} דקות`;
    } else if (hours === 1 && mins === 0) {
      return 'שעה אחת';
    } else if (hours === 1) {
      return `שעה ו-${mins} דקות`;
    } else if (mins === 0) {
      return `${hours} שעות`;
    } else {
      return `${hours} שעות ו-${mins} דקות`;
    }
  };

  const duration = calculateDuration(rehearsal.startTime, rehearsal.endTime);

  return (
    <div
      className={`rehearsal-preview ${isToday ? 'today-rehearsal' : ''}`}
      onClick={() => onView(rehearsal._id)}
    >
      {isToday && <div className='today-badge'>היום</div>}

      <div className='preview-header'>
        <h4>{orchestraName}</h4>
        <div className='time-info'>
          <span className='time-range'>
            <Clock size={18} />
            {rehearsal.startTime} - {rehearsal.endTime}
          </span>
          <span className='duration'>({formatDuration(duration)})</span>
        </div>
      </div>

      <div className='preview-content'>
        <div className='location-info'>
          <MapPin size={16} />
          <span className='location'>{rehearsal.location}</span>
        </div>

        {rehearsal.notes && (
          <div className='notes-info'>
            <span className='notes-label'>הערות:</span>
            <span className='notes-text'>{rehearsal.notes}</span>
          </div>
        )}
      </div>

      <div className='preview-footer'>
        <div className='action-buttons'>
          {onEdit && (
            <button
              className='action-btn edit'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(rehearsal._id);
              }}
              aria-label='ערוך חזרה'
            >
              <Edit size={20} />
            </button>
          )}

          {onRemoveOrchestra && (
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemoveOrchestra(rehearsal.groupId, rehearsal._id);
              }}
              aria-label='מחק חזרה'
              title='מחק חזרה (אפשרויות מחיקה)'
            >
              <Trash2 size={20} />
            </button>
          )}
          
          {onRemove && !onRemoveOrchestra && (
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(rehearsal._id);
              }}
              aria-label='מחק חזרה'
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
