import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Clock,
  Calendar,
  User,
  MapPin,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RotateCcw,
  Settings,
} from 'lucide-react';
import {
  AvailableSlot,
  SlotSearchCriteria,
  LessonDurationMinutes,
  HebrewDayName,
  HEBREW_DAYS
} from '../../services/timeBlockService';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import { studentService, Student } from '../../services/studentService';

interface AvailableSlotsFinderProps {
  teacherId: string;
  studentId?: string;
  onSlotSelect?: (slot: AvailableSlot) => void;
  onSlotsFound?: (slots: AvailableSlot[]) => void;
  initialDuration?: LessonDurationMinutes;
  showAdvancedFilters?: boolean;
  maxResults?: number;
  compact?: boolean;
  selectedSlot?: AvailableSlot | null; // Add controlled selectedSlot prop
  refreshTrigger?: number; // Add refresh trigger prop
  currentStudentAssignments?: Array<{ // Add current student's assignments for immediate conflict detection
    teacherId: string;
    day: string;
    time: string;
    duration: number;
  }>;
}

type SortOption = 'optimal' | 'earliest' | 'latest' | 'day' | 'duration';
type FilterMode = 'basic' | 'advanced' | 'preferences';

const DEFAULT_SEARCH_CRITERIA: SlotSearchCriteria = {
  duration: 60,
};

const AvailableSlotsFinder: React.FC<AvailableSlotsFinderProps> = ({
  teacherId,
  studentId,
  onSlotSelect,
  onSlotsFound,
  initialDuration = 60,
  showAdvancedFilters: parentShowAdvancedFilters = true,
  maxResults = 20,
  compact = false,
  selectedSlot: controlledSelectedSlot = null,
  refreshTrigger = 0,
  currentStudentAssignments = [],
}) => {
  const [searchCriteria, setSearchCriteria] = useState<SlotSearchCriteria>({
    ...DEFAULT_SEARCH_CRITERIA,
    duration: initialDuration,
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recommendedSlots, setRecommendedSlots] = useState<AvailableSlot[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<Array<{
    day: string;
    time: string;
    duration: number;
    studentId: string;
    studentName: string;
  }>>([]);
  
  const {
    availableSlots,
    recommendedSlots: storeRecommendedSlots,
    findAvailableSlots,
    isLoading,
    error,
  } = useTimeBlockStore();

  // Update search criteria when initialDuration changes
  useEffect(() => {
    setSearchCriteria(prev => ({
      ...prev,
      duration: initialDuration,
    }));
  }, [initialDuration]);

  // Define performSearch function before useEffect that uses it
  const performSearch = useCallback(async () => {
    if (!teacherId || !searchCriteria.duration) {
      // Search skipped: missing required parameters
      return;
    }

    try {
      setIsSearching(true);
      // Starting slot search
      if ('schoolYearId' in searchCriteria) {
        console.error('CONTAMINATION DETECTED in AvailableSlotsFinder - criteria contains schoolYearId:', searchCriteria);
        console.trace();
      }
      await findAvailableSlots(teacherId, searchCriteria);
      // Note: availableSlots will be updated asynchronously by the store
      // Slot search completed
    } catch (error) {
      console.error('❌ SEARCH FAILED:', error);
    } finally {
      setIsSearching(false);
    }
  }, [teacherId, searchCriteria, findAvailableSlots]);

  // Perform search when criteria changes - debounced to prevent excessive calls
  useEffect(() => {
    if (searchCriteria.duration && teacherId) {
      // Only log if debugging is enabled
      if (process.env.NODE_ENV === 'development') {
        // Search triggered by criteria or teacher change
      }
      
      // Debounce the search to prevent excessive API calls
      const searchTimeout = setTimeout(() => {
        performSearch();
      }, 300);
      
      return () => clearTimeout(searchTimeout);
    }
  }, [searchCriteria.duration, searchCriteria.preferredDays, searchCriteria.preferredTimeRange, teacherId, performSearch]);

  // Notify parent of found slots - only when actually needed
  useEffect(() => {
    if (availableSlots && onSlotsFound) {
      // Reduce logging frequency
      if (process.env.NODE_ENV === 'development' && availableSlots.length > 0) {
        // Available slots updated
      }
      onSlotsFound(availableSlots);
    }
  }, [availableSlots, onSlotsFound]);

  // Update recommended slots when store changes
  useEffect(() => {
    setRecommendedSlots(storeRecommendedSlots);
  }, [storeRecommendedSlots]);

  // Load existing assignments for conflict detection - separate from search trigger
  useEffect(() => {
    if (teacherId && refreshTrigger > 0) {
      // Assignment refresh triggered
      // Debounce assignment loading to prevent excessive calls
      const assignmentTimeout = setTimeout(() => {
        loadExistingAssignments();
      }, 100);
      
      return () => clearTimeout(assignmentTimeout);
    }
  }, [teacherId, refreshTrigger]);

  // Initial assignment load when teacher changes
  useEffect(() => {
    if (teacherId) {
      // Loading initial assignments
      loadExistingAssignments();
    }
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadExistingAssignments = async () => {
    try {
      // Reduced logging
      if (process.env.NODE_ENV === 'development') {
        // Loading teacher assignments
      }
      
      // CRITICAL FIX: Get fresh data from server with explicit filter to ensure all students
      const allStudents = await studentService.getStudents({}); // Pass empty filter to get all students
      
      // Debug: Check if the API call is working
      if (allStudents.length === 0) {
        console.warn('⚠️ No students returned from API - trying alternative approach');
        
        // FALLBACK: Try to get students from the student store
        try {
          // Fallback to student store data
          // Import and use student store as fallback
          const { useStudentStore } = await import('../../store/studentStore');
          const studentStore = useStudentStore.getState();
          if (studentStore.students.length > 0) {
            // Using student store data
            return studentStore.students;
          }
        } catch (error) {
          console.error('❌ Student store fallback failed:', error);
        }
      }
      
      // Filter students who have assignments with this teacher
      const assignmentsForTeacher: Array<{
        day: string;
        time: string;
        duration: number;
        studentId: string;
        studentName: string;
      }> = [];

      (allStudents || []).forEach((student: Student) => {
        if (student.teacherAssignments && Array.isArray(student.teacherAssignments)) {
          student.teacherAssignments.forEach(assignment => {
            // CRITICAL FIX: Check for active assignments more thoroughly
            if (assignment.teacherId === teacherId && 
                assignment.isActive !== false && 
                assignment.day && 
                assignment.time && 
                assignment.duration) {
              // Found active assignment
              
              assignmentsForTeacher.push({
                day: assignment.day,
                time: assignment.time,
                duration: assignment.duration,
                studentId: student._id,
                studentName: student.personalInfo?.fullName || 'תלמיד לא ידוע'
              });
            }
          });
        }
      });

      // Assignments loaded successfully
      
      setExistingAssignments(assignmentsForTeacher);
      
      // Assignments set, conflict detection will update
    } catch (error) {
      console.error('❌ ASSIGNMENT LOAD FAILED:', error);
      // Set empty array on error to prevent infinite loading
      setExistingAssignments([]);
    }
  };

  // Helper function to convert time to minutes
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to check if two time slots conflict
  const hasTimeConflict = (
    slot: AvailableSlot,
    assignment: { day: string; time: string; duration: number }
  ): boolean => {
    // Different days = no conflict
    if (slot.day !== assignment.day) {
      return false;
    }

    const slotStartTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime || '';
    
    if (!slotStartTime) {
      // No start time found for slot
      return false;
    }
    
    const slotStart = timeToMinutes(slotStartTime);
    const slotEnd = slotStart + slot.duration;
    
    const assignmentStart = timeToMinutes(assignment.time);
    const assignmentEnd = assignmentStart + assignment.duration;

    // Check for overlap: slots conflict if they overlap at all
    const hasOverlap = (slotStart < assignmentEnd && slotEnd > assignmentStart);
    
    if (hasOverlap) {
      // Time overlap detected
    }
    
    return hasOverlap;
  };


  const updateSearchCriteria = useCallback((updates: Partial<SlotSearchCriteria>) => {
    // Search criteria updated
    if ('schoolYearId' in updates) {
      console.error('CONTAMINATION DETECTED: schoolYearId in updates', updates);
      console.trace(); // This will show the call stack
    }
    setSearchCriteria(prev => ({ ...prev, ...updates }));
  }, []);

  const resetSearch = () => {
    setSearchCriteria({
      ...DEFAULT_SEARCH_CRITERIA,
      duration: initialDuration,
    });
    setRecommendedSlots([]);
    // Note: selectedSlot is now controlled by parent, so we don't reset it here
  };

  const handleSlotClick = (slot: AvailableSlot) => {
    const slotTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime;
    // Slot clicked
    onSlotSelect?.(slot);
    // Slot selection handled
  };

  // Sort and filter slots based on current criteria - optimized to prevent excessive re-renders
  const processedSlots = useMemo(() => {
    // Minimal logging to reduce performance impact
    const shouldLog = process.env.NODE_ENV === 'development' && 
                     (availableSlots?.length > 0 || existingAssignments.length > 0);
    
    if (shouldLog) {
      // Processing slots with conflict detection
    }
    
    // Ensure availableSlots is an array before processing
    if (!availableSlots || !Array.isArray(availableSlots)) {
      console.warn('Available slots is not an array:', typeof availableSlots);
      return [];
    }
    
    let slots = [...availableSlots];
    // Reduced logging frequency
    if (shouldLog && availableSlots?.length > 0) {
      // Processing available slots
    }
    
    // CRITICAL FIX: Filter out slots that conflict with existing assignments OR current student assignments
    const allConflictSources = [
      ...existingAssignments.map(a => ({ ...a, source: 'database' })),
      ...currentStudentAssignments
        .filter(a => a.teacherId === teacherId)
        .map(a => ({ 
          day: a.day, 
          time: a.time, 
          duration: a.duration, 
          studentName: 'Current Student', 
          source: 'current-form' 
        }))
    ];
    
    if (allConflictSources.length > 0) {
      // Only log detailed conflict info when needed
      if (shouldLog) {
        // Checking for conflicts
      }
      
      slots = slots.filter(slot => {
        const slotTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime;
        
        const hasConflict = allConflictSources.some(assignment => {
          const conflict = hasTimeConflict(slot, assignment);
          
          // Only log conflicts when debugging specific issues
          if (conflict && shouldLog && process.env.NODE_ENV === 'development') {
            // Conflict detected
          }
          
          return conflict;
        });
        
        return !hasConflict;
      });
      
      if (shouldLog) {
        // Conflict filtering completed
      }
    }
    
    // Apply additional client-side filtering if needed
    if (searchCriteria.preferredDays?.length) {
      slots = slots.filter(slot => searchCriteria.preferredDays!.includes(slot.day));
    }
    
    if (searchCriteria.preferredTimeRange) {
      const { startTime, endTime } = searchCriteria.preferredTimeRange;
      slots = slots.filter(slot => {
        const slotStartTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime || '';
        const slotEndTime = slot.possibleEndTime || (slot as any).endTime || (slot as any).lessonEndTime || '';
        return slotStartTime >= startTime && slotEndTime <= endTime;
      });
    }
    
    // Sort slots by optimal score (highest first)
    slots.sort((a, b) => b.optimalScore - a.optimalScore);
    
    return slots;
  }, [availableSlots, searchCriteria, existingAssignments, currentStudentAssignments, teacherId]);

  // Group slots by day for better organization
  const slotsByDay = useMemo(() => {
    const grouped: Record<HebrewDayName, AvailableSlot[]> = {} as Record<HebrewDayName, AvailableSlot[]>;
    
    processedSlots.forEach(slot => {
      if (!grouped[slot.day]) {
        grouped[slot.day] = [];
      }
      grouped[slot.day].push(slot);
    });
    
    return grouped;
  }, [processedSlots]);

  const renderSearchControls = () => (
    <div className="search-controls">
      {/* Advanced Filters Toggle - only when not controlled by parent */}
      {!compact && (
        <div className="control-group">
          <button
            type="button"
            className={`filter-toggle ${
              showFilters ? 'active' : ''
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            מסננים מתקדמים
          </button>
        </div>
      )}

      {/* Reset Button */}
      <div className="control-group">
        <button
          type="button"
          className="reset-btn"
          onClick={resetSearch}
          title="איפוס חיפוש"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );

  const renderAdvancedFilters = () => (
    <div className="advanced-filters">
      {/* Preferred Days */}
      <div className="filter-group">
        <label className="filter-label">
          <Calendar size={14} />
          ימים מועדפים
        </label>
        <div className="day-selector">
          {HEBREW_DAYS.map(day => (
            <button
              key={day}
              type="button"
              className={`day-btn ${
                searchCriteria.preferredDays?.includes(day) ? 'selected' : ''
              }`}
              onClick={() => {
                const preferredDays = searchCriteria.preferredDays || [];
                const newDays = preferredDays.includes(day)
                  ? preferredDays.filter(d => d !== day)
                  : [...preferredDays, day];
                updateSearchCriteria({ preferredDays: newDays.length > 0 ? newDays : undefined });
              }}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="filter-group">
        <label className="filter-label">
          <Clock size={14} />
          טווח שעות מועדף
        </label>
        <div className="time-range">
          <input
            type="time"
            className="time-input"
            value={searchCriteria.preferredTimeRange?.startTime || '09:00'}
            onChange={(e) => {
              const timeRange = searchCriteria.preferredTimeRange || { startTime: '09:00', endTime: '17:00' };
              updateSearchCriteria({
                preferredTimeRange: {
                  ...timeRange,
                  startTime: e.target.value,
                },
              });
            }}
          />
          <span className="time-separator">—</span>
          <input
            type="time"
            className="time-input"
            value={searchCriteria.preferredTimeRange?.endTime || '17:00'}
            onChange={(e) => {
              const timeRange = searchCriteria.preferredTimeRange || { startTime: '09:00', endTime: '17:00' };
              updateSearchCriteria({
                preferredTimeRange: {
                  ...timeRange,
                  endTime: e.target.value,
                },
              });
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderOptimalSuggestions = () => {
    if (!recommendedSlots || !Array.isArray(recommendedSlots) || recommendedSlots.length === 0) {
      return null;
    }

    return (
      <div className="optimal-suggestions">
        <div className="suggestion-section">
          <h4 className="suggestion-title">
            <Star size={16} />
            המלצות מתקדמות
          </h4>
          <div className="suggestion-slots">
            {recommendedSlots.slice(0, 3).map((slot, index) => {
              const slotTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime || 'unknown';
              const uniqueKey = `recommended-${slot.timeBlockId || 'noId'}-${slot.day}-${slotTime}-${slot.duration}-${index}`;
              return (
                <div
                  key={uniqueKey}
                  className={`suggestion-slot optimal ${
                    controlledSelectedSlot?.timeBlockId === slot.timeBlockId &&
                    (controlledSelectedSlot?.possibleStartTime || (controlledSelectedSlot as any)?.startTime) === slotTime
                      ? 'selected'
                      : ''
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Optimal suggestion selected
                  handleSlotClick(slot);
                }}
              >
                <div className="slot-rank">#{index + 1}</div>
                <div className="slot-info">
                  <div className="slot-day-time">
                    {slot.day} • {slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime || 'N/A'}
                  </div>
                  <div className="slot-score">
                    ציון: {slot.optimalScore}/100
                  </div>
                </div>
                <div className="slot-action">
                  <ArrowRight size={14} />
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderSlotCard = (slot: AvailableSlot) => {
    // REMOVED: Excessive debug logging that was causing performance issues
    // Only log when specifically debugging slot selection
    // console.log('🕰️ Complete slot object:', slot);
    // console.log('🕰️ Available properties:', Object.keys(slot));
    
    // Check for different possible property names
    const slotStartTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime;
    let slotEndTime = slot.possibleEndTime || (slot as any).endTime || (slot as any).lessonEndTime;
    
    // If we don't have end time but we have start time and duration, calculate it
    if (!slotEndTime && slotStartTime && slot.duration) {
      const startParts = slotStartTime.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = startMinutes + slot.duration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      slotEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }
    const selectedStartTime = controlledSelectedSlot?.possibleStartTime || (controlledSelectedSlot as any)?.startTime;
    
    const isSelected = controlledSelectedSlot?.timeBlockId === slot.timeBlockId &&
                      selectedStartTime === slotStartTime;
    
    // REMOVED: Excessive debug logging that was causing performance issues
    // Only enable when specifically debugging slot properties
    // console.log('🕰️ Slot time properties:', { ... });
    
    return (
      <div
        className={`slot-card ${
          isSelected ? 'selected' : ''
        } ${
          slot.optimalScore >= 80 ? 'high-score' :
          slot.optimalScore >= 60 ? 'medium-score' : 'low-score'
        }`}
      >
        <div className="slot-main-info">
          <div className="slot-day-time">
            <div className="day-name">{slot.day}</div>
            <div className="time-range">
              {slotStartTime || 'N/A'} - {slotEndTime || 'N/A'}
            </div>
          </div>
          <div className="slot-duration-badge">
            {slot.duration} דקות
          </div>
        </div>
        
        {slot.location && (
          <div className="slot-location-info">
            <MapPin size={14} />
            <span>{slot.location}</span>
          </div>
        )}
        
        <div className="slot-actions">
          <button
            type="button"
            className="select-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Slot selected
              handleSlotClick(slot);
            }}
          >
            {isSelected ? (
              <>
                <CheckCircle size={14} />
                נבחר
              </>
            ) : (
              <>
                בחר
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSlotsList = () => {
    if (isSearching || isLoading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>מחפש שעות זמינות...</span>
        </div>
      );
    }

    if (processedSlots.length === 0) {
      return (
        <div className="empty-state">
          <AlertCircle size={48} color="#f59e0b" />
          <h3>לא נמצאו שעות זמינות</h3>
          <p>נסה לשנות את קריטריוני החיפוש או בחר משכי שיעור שונים</p>
          <button
            type="button"
            className="retry-btn"
            onClick={resetSearch}
          >
            <RotateCcw size={16} />
            איפוס חיפוש
          </button>
        </div>
      );
    }

    if (compact) {
      // Compact view - show as simple list
      return (
        <div className="slots-list compact">
          {processedSlots.map((slot, index) => {
            const slotTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime || 'unknown';
            const uniqueKey = `compact-slot-${slot.timeBlockId || 'noId'}-${slot.day}-${slotTime}-${slot.duration}-${index}`;
            return (
              <div key={uniqueKey}>
                {renderSlotCard(slot)}
              </div>
            );
          })}
        </div>
      );
    }

    // Grouped view by day
    return (
      <div className="slots-grouped">
        {Object.entries(slotsByDay).map(([day, daySlots]) => (
          <div key={day} className="day-group">
            <h4 className="day-header">
              <Calendar size={16} />
              {day}
              <span className="day-count">({daySlots.length} זמינות)</span>
            </h4>
            <div className="day-slots">
              {daySlots.map((slot, index) => {
                const slotTime = slot.possibleStartTime || (slot as any).startTime || (slot as any).lessonStartTime || 'unknown';
                const uniqueKey = `grouped-slot-${slot.timeBlockId || 'noId'}-${slot.day}-${slotTime}-${slot.duration}-${index}`;
                return (
                  <div key={uniqueKey}>
                    {renderSlotCard(slot)}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSearchSummary = () => {
    if (isSearching || isLoading) return null;

    return (
      <div className="search-summary">
        <div className="summary-stats">
          <span className="stat">
            <strong>{processedSlots.length}</strong> זמינות נמצאו
          </span>
          {searchCriteria.duration && (
            <span className="stat">
              לשיעורי <strong>{searchCriteria.duration} דקות</strong>
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`available-slots-finder ${
      compact ? 'compact' : ''
    }`}>
      {/* Search Controls - only show when not in compact mode */}
      {!compact && renderSearchControls()}
      
      {/* Advanced Filters - show when filters are enabled */}
      {parentShowAdvancedFilters && renderAdvancedFilters()}
      
      {/* Optimal Suggestions */}
      {renderOptimalSuggestions()}
      
      {/* Available Slots */}
      <div className="slots-container">
        <div className="slots-header">
          <h5>שעות זמינות ({processedSlots.length})</h5>
          <p>לחץ על שעה כדי לבחור אותה</p>
        </div>
        {renderSlotsList()}
      </div>
    </div>
  );
};

export default AvailableSlotsFinder;