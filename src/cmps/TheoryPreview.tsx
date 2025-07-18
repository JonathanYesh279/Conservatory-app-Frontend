// src/cmps/TheoryPreview.tsx
import { TheoryLesson } from '../services/theoryService';
import { Edit, Trash2, Clock, MapPin, Users } from 'lucide-react';

interface TheoryPreviewProps {
  theoryLesson: TheoryLesson;
  teacherName: string;
  onView: (theoryLessonId: string) => void;
  onEdit?: (theoryLessonId: string) => void;
  onRemove?: (theoryLessonId: string) => void;
  isToday?: boolean;
}

export function TheoryPreview({
  theoryLesson,
  teacherName,
  onView,
  onEdit,
  onRemove,
  isToday = false,
}: TheoryPreviewProps) {
  // Safety check for theory lesson data
  if (!theoryLesson || !theoryLesson._id) {
    console.error('TheoryPreview: Invalid theory lesson data', theoryLesson);
    return null;
  }
  // Calculate duration in minutes
  const calculateDuration = (startTime: string | undefined, endTime: string | undefined): number => {
    if (!startTime || !endTime) {
      return 60; // Default to 1 hour if times are missing
    }
    
    try {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);

      const start = startHours * 60 + startMinutes;
      const end = endHours * 60 + endMinutes;

      return end - start;
    } catch (error) {
      console.error('Error calculating duration:', error, { startTime, endTime });
      return 60; // Default to 1 hour if calculation fails
    }
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

  // Safely calculate duration with fallbacks
  const startTime = theoryLesson.startTime || '09:00';
  const endTime = theoryLesson.endTime || '10:00';
  const duration = calculateDuration(startTime, endTime);
  const studentCount = theoryLesson.studentIds?.length || 0;

  return (
    <div
      className={`theory-preview ${isToday ? 'today-theory' : ''}`}
      onClick={() => onView(theoryLesson._id)}
    >
      {isToday && <div className='today-badge'>היום</div>}

      <div className='preview-header'>
        <h4>{theoryLesson.category}</h4>
        <div className='time-info'>
          <span className='time-range'>
            <Clock size={18} />
            {theoryLesson.startTime} - {theoryLesson.endTime}
          </span>
          <span className='duration'>({formatDuration(duration)})</span>
        </div>
      </div>

      <div className='preview-content'>
        <div className='teacher-info'>
          <span className='teacher-name'>{teacherName}</span>
        </div>
        
        <div className='location-info'>
          <MapPin size={16} />
          <span className='location'>{theoryLesson.location}</span>
        </div>

        <div className='student-info'>
          <Users size={16} />
          <span className='student-count'>{studentCount} תלמידים</span>
        </div>

        {theoryLesson.notes && (
          <div className='notes-info'>
            <span className='notes-label'>הערות:</span>
            <span className='notes-text'>{theoryLesson.notes}</span>
          </div>
        )}

        {theoryLesson.syllabus && (
          <div className='syllabus-info'>
            <span className='syllabus-label'>סילבוס:</span>
            <span className='syllabus-text'>{theoryLesson.syllabus}</span>
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
                onEdit(theoryLesson._id);
              }}
              aria-label='ערוך שיעור'
            >
              <Edit size={20} />
            </button>
          )}

          {onRemove && (
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(theoryLesson._id);
              }}
              aria-label='מחק שיעור'
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}