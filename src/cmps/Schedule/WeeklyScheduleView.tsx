import React, { useState, useEffect } from 'react';
import { ScheduleSlot } from '../../types/schedule';
import { useScheduleManagement } from '../../hooks/useScheduleManagement';
import ScheduleSlotCard from './ScheduleSlotCard';
import { formatDayOfWeek } from '../../utils/scheduleUtils';

interface WeeklyScheduleViewProps {
  teacherId: string;
  onSlotSelect?: (slot: ScheduleSlot) => void;
  onSlotEdit?: (slot: ScheduleSlot) => void;
  onAssignStudent?: (slot: ScheduleSlot) => void;
  onRemoveStudent?: (slot: ScheduleSlot) => void;
  onAddSlot?: (dayOfWeek: number) => void;
  showActions?: boolean;
  className?: string;
}

const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  teacherId,
  onSlotSelect,
  onSlotEdit,
  onAssignStudent,
  onRemoveStudent,
  onAddSlot,
  showActions = true,
  className = ''
}) => {
  // Use schedule management hook
  const {
    weeklySchedule,
    selectedSlot,
    isLoading,
    error,
    loadTeacherSchedule,
    selectSlot
  } = useScheduleManagement({ teacherId, autoLoad: true });
  
  // State for current view (desktop shows all days, mobile shows one day)
  const [currentDayView, setCurrentDayView] = useState<number>(new Date().getDay());
  const [isMobileView, setIsMobileView] = useState<boolean>(false);
  
  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);
  
  // Handle slot selection
  const handleSlotSelect = (slot: ScheduleSlot) => {
    selectSlot(slot);
    if (onSlotSelect) {
      onSlotSelect(slot);
    }
  };
  
  // Handle slot edit
  const handleSlotEdit = (slot: ScheduleSlot) => {
    if (onSlotEdit) {
      onSlotEdit(slot);
    }
  };
  
  // Handle student assignment
  const handleAssignStudent = (slot: ScheduleSlot) => {
    if (onAssignStudent) {
      onAssignStudent(slot);
    }
  };
  
  // Handle student removal
  const handleRemoveStudent = (slot: ScheduleSlot) => {
    if (onRemoveStudent) {
      onRemoveStudent(slot);
    }
  };
  
  // Handle adding a new slot
  const handleAddSlot = (dayOfWeek: number) => {
    if (onAddSlot) {
      onAddSlot(dayOfWeek);
    }
  };
  
  // Navigate to previous day in mobile view
  const goToPrevDay = () => {
    setCurrentDayView((prev) => (prev === 0 ? 6 : prev - 1));
  };
  
  // Navigate to next day in mobile view
  const goToNextDay = () => {
    setCurrentDayView((prev) => (prev === 6 ? 0 : prev + 1));
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className={`weekly-schedule-view ${className}`}>
        <div className="loading-indicator">Loading schedule...</div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`weekly-schedule-view ${className}`}>
        <div className="error-message">
          <p>Error loading schedule: {error}</p>
          <button onClick={() => loadTeacherSchedule(teacherId)}>Retry</button>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!weeklySchedule) {
    return (
      <div className={`weekly-schedule-view ${className}`}>
        <div className="empty-schedule">
          <p>No schedule available.</p>
          <button onClick={() => loadTeacherSchedule(teacherId)}>Load Schedule</button>
        </div>
      </div>
    );
  }
  
  // Function to render slots for a specific day
  const renderDaySlots = (dayOfWeek: number) => {
    const daySlots = weeklySchedule[dayOfWeek] || [];
    
    return (
      <div className="day-slots">
        {daySlots.length === 0 ? (
          <div className="empty-day">No slots scheduled</div>
        ) : (
          daySlots.map((slot) => (
            <ScheduleSlotCard
              key={slot.id}
              slot={slot}
              isSelected={selectedSlot?.id === slot.id}
              onSelect={handleSlotSelect}
              onEdit={handleSlotEdit}
              onAssignStudent={handleAssignStudent}
              onRemoveStudent={handleRemoveStudent}
              showActions={showActions}
            />
          ))
        )}
        
        {showActions && (
          <div className="add-slot-container">
            <button
              className="add-slot-button"
              onClick={() => handleAddSlot(dayOfWeek)}
            >
              + Add Slot
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Render mobile view (single day)
  if (isMobileView) {
    return (
      <div className={`weekly-schedule-view mobile-view ${className}`}>
        <div className="day-navigation">
          <button onClick={goToPrevDay} className="nav-button prev-day">
            &lt; Prev
          </button>
          <h2 className="current-day">{formatDayOfWeek(currentDayView)}</h2>
          <button onClick={goToNextDay} className="nav-button next-day">
            Next &gt;
          </button>
        </div>
        <div className="day-container">
          {renderDaySlots(currentDayView)}
        </div>
      </div>
    );
  }
  
  // Render desktop view (all days)
  return (
    <div className={`weekly-schedule-view desktop-view ${className}`}>
      <div className="week-container">
        {/* Render columns for each day of the week */}
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="day-column">
            <div className="day-header">
              <h3>{formatDayOfWeek(i, 'medium')}</h3>
            </div>
            {renderDaySlots(i)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyScheduleView;