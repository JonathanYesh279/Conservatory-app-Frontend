import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScheduleSlot, StudentSchedule } from '../../types/schedule';
import { useScheduleStore } from '../../store/scheduleStore';
import { useScheduleConflicts } from '../../hooks/useScheduleConflicts';
import { formatDayOfWeek, formatTime, formatTimeSlot } from '../../utils/scheduleUtils';
import ScheduleConflictIndicator from './ScheduleConflictIndicator';

interface StudentScheduleViewProps {
  studentId: string;
  showTeacherLinks?: boolean;
  showPrintButton?: boolean;
  className?: string;
}

const StudentScheduleView: React.FC<StudentScheduleViewProps> = ({
  studentId,
  showTeacherLinks = true,
  showPrintButton = true,
  className = ''
}) => {
  // Get schedule state from store
  const {
    currentStudentSchedule,
    loadStudentSchedule,
    isLoadingStudentSchedule,
    error
  } = useScheduleStore();
  
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
  
  // Load student schedule on mount
  useEffect(() => {
    loadStudentSchedule(studentId);
  }, [studentId, loadStudentSchedule]);
  
  // Create a grouped view of the schedule by day
  const getScheduleByDay = (): { [dayOfWeek: number]: ScheduleSlot[] } => {
    if (!currentStudentSchedule) return {};
    
    const scheduleByDay: { [dayOfWeek: number]: ScheduleSlot[] } = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };
    
    // Group all slots by day
    currentStudentSchedule.teacherSchedules.forEach(teacherSchedule => {
      teacherSchedule.slots.forEach(slot => {
        scheduleByDay[slot.dayOfWeek].push({
          ...slot,
          teacherName: teacherSchedule.teacherName // Add teacher name to slot
        });
      });
    });
    
    // Sort slots within each day by start time
    Object.keys(scheduleByDay).forEach(day => {
      const dayNumber = Number(day);
      scheduleByDay[dayNumber].sort((a, b) => {
        const aTime = a.startTime.split(':').map(Number);
        const bTime = b.startTime.split(':').map(Number);
        
        // Compare hours first, then minutes
        if (aTime[0] !== bTime[0]) return aTime[0] - bTime[0];
        return aTime[1] - bTime[1];
      });
    });
    
    return scheduleByDay;
  };
  
  // Handle printing the schedule
  const handlePrint = () => {
    window.print();
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
  if (isLoadingStudentSchedule) {
    return (
      <div className={`student-schedule-view ${className}`}>
        <div className="loading-indicator">Loading schedule...</div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className={`student-schedule-view ${className}`}>
        <div className="error-message">
          <p>Error loading schedule: {error}</p>
          <button onClick={() => loadStudentSchedule(studentId)}>Retry</button>
        </div>
      </div>
    );
  }
  
  // Render empty state
  if (!currentStudentSchedule || currentStudentSchedule.teacherSchedules.length === 0) {
    return (
      <div className={`student-schedule-view ${className}`}>
        <div className="empty-schedule">
          <p>No lessons scheduled for this student.</p>
        </div>
      </div>
    );
  }
  
  // Get schedule grouped by day
  const scheduleByDay = getScheduleByDay();
  
  // Function to render slots for a specific day
  const renderDaySlots = (dayOfWeek: number) => {
    const daySlots = scheduleByDay[dayOfWeek] || [];
    
    if (daySlots.length === 0) {
      return <div className="empty-day">No lessons scheduled</div>;
    }
    
    return (
      <div className="day-slots">
        {daySlots.map((slot, index) => (
          <div key={`${slot.id}-${index}`} className="student-schedule-slot">
            <div className="slot-time">
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </div>
            
            <div className="slot-teacher">
              {showTeacherLinks ? (
                <Link to={`/teacher/${slot.teacherId}`} className="teacher-link">
                  {slot.teacherName || 'Teacher'}
                </Link>
              ) : (
                <span className="teacher-name">{slot.teacherName || 'Teacher'}</span>
              )}
            </div>
            
            {slot.location && (
              <div className="slot-location">
                <span className="location">{slot.location}</span>
              </div>
            )}
            
            {/* Show conflict indicator if needed */}
            <ScheduleConflictIndicator slotId={slot.id} />
          </div>
        ))}
      </div>
    );
  };
  
  // Render mobile view (single day)
  if (isMobileView) {
    return (
      <div className={`student-schedule-view mobile-view ${className}`}>
        <div className="schedule-header">
          <h2>Student Schedule</h2>
          {showPrintButton && (
            <button className="print-button" onClick={handlePrint}>
              Print Schedule
            </button>
          )}
        </div>
        
        <div className="day-navigation">
          <button onClick={goToPrevDay} className="nav-button prev-day">
            &lt; Prev
          </button>
          <h3 className="current-day">{formatDayOfWeek(currentDayView)}</h3>
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
    <div className={`student-schedule-view desktop-view ${className}`}>
      <div className="schedule-header">
        <h2>Student Schedule</h2>
        {showPrintButton && (
          <button className="print-button" onClick={handlePrint}>
            Print Schedule
          </button>
        )}
      </div>
      
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

export default StudentScheduleView;