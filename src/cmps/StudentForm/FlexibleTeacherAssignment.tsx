import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, User, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  LessonDurationMinutes, 
  AvailableSlot, 
  HebrewDayName,
  SlotSearchCriteria 
} from '../../types/schedule';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import { Teacher } from '../../types/teacher';
import { formatTime } from '../../utils/scheduleUtils';

interface FlexibleTeacherAssignmentProps {
  teacherId: string;
  teacherName?: string;
  studentId?: string;
  onAssignmentSelect?: (assignment: {
    teacherId: string;
    timeBlockId: string;
    day: HebrewDayName;
    startTime: string;
    endTime: string;
    duration: LessonDurationMinutes;
  }) => void;
  initialDuration?: LessonDurationMinutes;
  disabled?: boolean;
  showOptimalSuggestions?: boolean;
}

const LESSON_DURATIONS: LessonDurationMinutes[] = [30, 45, 60];

const FlexibleTeacherAssignment: React.FC<FlexibleTeacherAssignmentProps> = ({
  teacherId,
  teacherName,
  studentId,
  onAssignmentSelect,
  initialDuration = 60,
  disabled = false,
  showOptimalSuggestions = true
}) => {
  const [selectedDuration, setSelectedDuration] = useState<LessonDurationMinutes>(initialDuration);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const {
    availableSlots,
    findAvailableSlots,
    isCalculatingSlots,
    lastSearchResults
  } = useTimeBlockStore();

  // Search criteria based on current selections
  const searchCriteria = useMemo((): SlotSearchCriteria => ({
    teacherId,
    duration: selectedDuration,
    excludeStudentId: studentId,
    maxResults: 50,
    sortBy: 'optimal'
  }), [teacherId, selectedDuration, studentId]);

  // Load available slots when criteria changes
  useEffect(() => {
    if (teacherId && selectedDuration) {
      setIsCalculating(true);
      findAvailableSlots(teacherId, searchCriteria)
        .finally(() => setIsCalculating(false));
    }
  }, [searchCriteria, findAvailableSlots]);

  // Group slots by day for better organization
  const slotsByDay = useMemo(() => {
    const grouped: Record<HebrewDayName, AvailableSlot[]> = {} as Record<HebrewDayName, AvailableSlot[]>;
    
    availableSlots.forEach(slot => {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    });
    
    return grouped;
  }, [availableSlots]);

  // Get optimal suggestions (top 3 highest scoring slots)
  const optimalSlots = useMemo(() => {
    return availableSlots
      .filter(slot => slot.optimalScore >= 70)
      .sort((a, b) => b.optimalScore - a.optimalScore)
      .slice(0, 3);
  }, [availableSlots]);

  // Handle duration change
  const handleDurationChange = (duration: LessonDurationMinutes) => {
    setSelectedDuration(duration);
    setSelectedSlot(null); // Reset selection when duration changes
  };

  // Handle slot selection
  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    
    if (onAssignmentSelect) {
      const endTime = calculateEndTime(slot.possibleStartTime, slot.duration);
      onAssignmentSelect({
        teacherId,
        timeBlockId: slot.timeBlockId,
        day: slot.day,
        startTime: slot.possibleStartTime,
        endTime,
        duration: slot.duration
      });
    }
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Render duration selector
  const renderDurationSelector = () => (
    <div className="duration-selector">
      <label className="duration-label">
        <Clock size={16} />
        <span>משך השיעור</span>
      </label>
      <div className="duration-options">
        {LESSON_DURATIONS.map(duration => (
          <button
            key={duration}
            type="button"
            className={`duration-btn ${selectedDuration === duration ? 'active' : ''}`}
            onClick={() => handleDurationChange(duration)}
            disabled={disabled}
          >
            {duration} דקות
          </button>
        ))}
      </div>
      {lastSearchResults && (
        <div className="duration-stats">
          נמצאו <strong>{availableSlots.length}</strong> זמינות עבור שיעורי {selectedDuration} דקות
        </div>
      )}
    </div>
  );

  // Render optimal suggestions
  const renderOptimalSuggestions = () => {
    if (!showOptimalSuggestions || optimalSlots.length === 0) return null;

    return (
      <div className="optimal-suggestions">
        <h4 className="suggestions-title">
          <Star size={16} />
          המלצות מיטביות
        </h4>
        <div className="suggestions-list">
          {optimalSlots.map((slot, index) => (
            <div
              key={`${slot.timeBlockId}-${slot.possibleStartTime}`}
              className={`suggestion-card ${
                selectedSlot?.timeBlockId === slot.timeBlockId &&
                selectedSlot?.possibleStartTime === slot.possibleStartTime
                  ? 'selected'
                  : ''
              }`}
              onClick={() => handleSlotSelect(slot)}
            >
              <div className="suggestion-rank">#{index + 1}</div>
              <div className="suggestion-details">
                <div className="suggestion-time">
                  <Calendar size={12} />
                  <span>{slot.day}</span>
                  <Clock size={12} />
                  <span>{formatTime(slot.possibleStartTime)}</span>
                </div>
                <div className="suggestion-score">
                  ציון: {slot.optimalScore}/100
                </div>
              </div>
              <div className="suggestion-action">
                {selectedSlot?.timeBlockId === slot.timeBlockId &&
                 selectedSlot?.possibleStartTime === slot.possibleStartTime ? (
                  <CheckCircle size={16} color="#10b981" />
                ) : (
                  <button className="select-btn">בחר</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render slot card
  const renderSlotCard = (slot: AvailableSlot) => {
    const isSelected = selectedSlot?.timeBlockId === slot.timeBlockId &&
                      selectedSlot?.possibleStartTime === slot.possibleStartTime;
    const endTime = calculateEndTime(slot.possibleStartTime, slot.duration);

    return (
      <div
        key={`${slot.timeBlockId}-${slot.possibleStartTime}`}
        className={`slot-card ${isSelected ? 'selected' : ''} ${
          slot.optimalScore >= 80 ? 'high-score' :
          slot.optimalScore >= 60 ? 'medium-score' : 'low-score'
        }`}
        onClick={() => handleSlotSelect(slot)}
      >
        <div className="slot-header">
          <div className="slot-time">
            <Clock size={14} />
            <span>{formatTime(slot.possibleStartTime)} - {formatTime(endTime)}</span>
          </div>
          <div className="slot-score">
            {slot.optimalScore}/100
          </div>
        </div>
        
        <div className="slot-details">
          <div className="slot-duration">
            {slot.duration} דקות
          </div>
          
          {slot.location && (
            <div className="slot-location">
              <span>{slot.location}</span>
            </div>
          )}
          
          {(slot.gapMinutesBefore !== undefined || slot.gapMinutesAfter !== undefined) && (
            <div className="slot-gaps">
              <span className="gap-info">
                רווח: {slot.gapMinutesBefore || 0}' לפני • {slot.gapMinutesAfter || 0}' אחרי
              </span>
            </div>
          )}
        </div>
        
        <div className="slot-actions">
          {isSelected ? (
            <div className="selected-indicator">
              <CheckCircle size={14} />
              נבחר
            </div>
          ) : (
            <button className="select-btn">בחר</button>
          )}
        </div>
      </div>
    );
  };

  // Render slots by day
  const renderSlotsByDay = () => {
    if (isCalculating || isCalculatingSlots) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>מחשב זמינות...</span>
        </div>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <div className="empty-state">
          <AlertCircle size={48} color="#f59e0b" />
          <h3>אין שעות זמינות</h3>
          <p>המורה אינו זמין עבור שיעורי {selectedDuration} דקות</p>
          <p>נסה משך שיעור שונה או בחר מורה אחר</p>
        </div>
      );
    }

    return (
      <div className="slots-by-day">
        {Object.entries(slotsByDay).map(([day, daySlots]) => (
          <div key={day} className="day-section">
            <h4 className="day-header">
              <Calendar size={16} />
              {day}
              <span className="day-count">({daySlots.length} זמינות)</span>
            </h4>
            <div className="day-slots">
              {daySlots.map(renderSlotCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render teacher info
  const renderTeacherInfo = () => (
    <div className="teacher-info">
      <div className="teacher-header">
        <User size={16} />
        <span className="teacher-name">{teacherName || 'מורה'}</span>
      </div>
      {selectedSlot && (
        <div className="selection-summary">
          <strong>בחירה נוכחית:</strong> {selectedSlot.day}, {formatTime(selectedSlot.possibleStartTime)} 
          ({selectedSlot.duration} דקות)
        </div>
      )}
    </div>
  );

  return (
    <div className={`flexible-teacher-assignment ${disabled ? 'disabled' : ''}`}>
      {renderTeacherInfo()}
      {renderDurationSelector()}
      {renderOptimalSuggestions()}
      <div className="available-slots">
        <h4 className="slots-title">שעות זמינות</h4>
        {renderSlotsByDay()}
      </div>
    </div>
  );
};

export default FlexibleTeacherAssignment;