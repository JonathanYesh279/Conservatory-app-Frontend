import React, { useState, useEffect, useMemo } from 'react';
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
  showAdvancedFilters = true,
  maxResults = 20,
  compact = false,
  selectedSlot: controlledSelectedSlot = null,
  refreshTrigger = 0,
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

  // Perform search when criteria changes
  useEffect(() => {
    if (searchCriteria.duration && teacherId) {
      performSearch();
    }
  }, [searchCriteria, teacherId]);

  // Notify parent of found slots
  useEffect(() => {
    onSlotsFound?.(availableSlots);
  }, [availableSlots, onSlotsFound]);

  // Update recommended slots when store changes
  useEffect(() => {
    setRecommendedSlots(storeRecommendedSlots);
  }, [storeRecommendedSlots]);

  // Load existing assignments for conflict detection
  useEffect(() => {
    if (teacherId) {
      loadExistingAssignments();
    }
  }, [teacherId, refreshTrigger]);

  const loadExistingAssignments = async () => {
    try {
      console.log('Loading existing assignments for teacher:', teacherId);
      
      // Get all students
      const allStudents = await studentService.getStudents();
      
      // Filter students who have assignments with this teacher
      const assignmentsForTeacher: Array<{
        day: string;
        time: string;
        duration: number;
        studentId: string;
        studentName: string;
      }> = [];

      allStudents.forEach((student: Student) => {
        if (student.teacherAssignments) {
          student.teacherAssignments.forEach(assignment => {
            if (assignment.teacherId === teacherId && assignment.isActive !== false) {
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

      console.log('Found existing assignments:', assignmentsForTeacher);
      setExistingAssignments(assignmentsForTeacher);
    } catch (error) {
      console.error('Failed to load existing assignments:', error);
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

    const slotStartTime = slot.possibleStartTime || '';
    const slotStart = timeToMinutes(slotStartTime);
    const slotEnd = slotStart + slot.duration;
    
    const assignmentStart = timeToMinutes(assignment.time);
    const assignmentEnd = assignmentStart + assignment.duration;

    // Check for overlap: slots conflict if they overlap at all
    return (slotStart < assignmentEnd && slotEnd > assignmentStart);
  };

  const performSearch = async () => {
    try {
      setIsSearching(true);
      console.log('AvailableSlotsFinder - performSearch called with criteria:', searchCriteria);
      console.log('AvailableSlotsFinder - criteria keys:', Object.keys(searchCriteria));
      if ('schoolYearId' in searchCriteria) {
        console.error('CONTAMINATION DETECTED in AvailableSlotsFinder - criteria contains schoolYearId:', searchCriteria);
        console.trace();
      }
      await findAvailableSlots(teacherId, searchCriteria);
    } catch (error) {
      console.error('Failed to search for available slots:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const updateSearchCriteria = (updates: Partial<SlotSearchCriteria>) => {
    console.log('updateSearchCriteria called with:', updates);
    if ('schoolYearId' in updates) {
      console.error('CONTAMINATION DETECTED: schoolYearId in updates', updates);
      console.trace(); // This will show the call stack
    }
    setSearchCriteria(prev => ({ ...prev, ...updates }));
  };

  const resetSearch = () => {
    setSearchCriteria({
      ...DEFAULT_SEARCH_CRITERIA,
      duration: initialDuration,
    });
    setRecommendedSlots([]);
    // Note: selectedSlot is now controlled by parent, so we don't reset it here
  };

  const handleSlotClick = (slot: AvailableSlot) => {
    console.log('🎯 handleSlotClick called for slot:', slot.day, slot.possibleStartTime);
    console.log('🎯 Previous selectedSlot:', controlledSelectedSlot);
    console.log('🎯 Will call onSlotSelect with:', slot);
    onSlotSelect?.(slot);
    console.log('✅ onSlotSelect called - parent will update selectedSlot');
  };

  // Sort and filter slots based on current criteria
  const processedSlots = useMemo(() => {
    // Ensure availableSlots is an array before processing
    if (!availableSlots || !Array.isArray(availableSlots)) {
      return [];
    }
    
    let slots = [...availableSlots];
    
    // CRITICAL FIX: Filter out slots that conflict with existing assignments
    slots = slots.filter(slot => {
      const hasConflict = existingAssignments.some(assignment => 
        hasTimeConflict(slot, assignment)
      );
      
      if (hasConflict) {
        console.log(`🚫 Filtering out conflicting slot: ${slot.day} ${slot.possibleStartTime} - conflicts with existing assignment`);
      }
      
      return !hasConflict;
    });
    
    // Apply additional client-side filtering if needed
    if (searchCriteria.preferredDays?.length) {
      slots = slots.filter(slot => searchCriteria.preferredDays!.includes(slot.day));
    }
    
    if (searchCriteria.preferredTimeRange) {
      const { startTime, endTime } = searchCriteria.preferredTimeRange;
      slots = slots.filter(slot => {
        const slotStartTime = slot.possibleStartTime || '';
        const slotEndTime = slot.possibleEndTime || '';
        return slotStartTime >= startTime && slotEndTime <= endTime;
      });
    }
    
    // Sort slots by optimal score (highest first)
    slots.sort((a, b) => b.optimalScore - a.optimalScore);
    
    return slots;
  }, [availableSlots, searchCriteria, existingAssignments]);

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
      {/* First Row - Duration Selector */}
      <div className="controls-row first-row">
        <div className="control-group">
          <label className="control-label">
            <Clock size={14} />
            משך השיעור
          </label>
          <div className="duration-buttons">
            {[30, 45, 60].map(duration => (
              <button
                key={duration}
                type="button"
                className={`duration-btn ${
                  searchCriteria.duration === duration ? 'active' : ''
                }`}
                onClick={() => updateSearchCriteria({ duration: duration as LessonDurationMinutes })}
              >
                {duration} דקות
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row - Advanced Filters and Reset */}
      <div className="controls-row second-row">
        {/* Advanced Filters Toggle */}
        {showAdvancedFilters && (
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
            {recommendedSlots.slice(0, 3).map((slot, index) => (
              <div
                key={`recommended-${slot.timeBlockId}-${slot.possibleStartTime || 'unknown'}-${index}`}
                className={`suggestion-slot optimal ${
                  controlledSelectedSlot?.timeBlockId === slot.timeBlockId &&
                  controlledSelectedSlot?.possibleStartTime === slot.possibleStartTime
                    ? 'selected'
                    : ''
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Optimal suggestion clicked:', slot.day, slot.possibleStartTime);
                  handleSlotClick(slot);
                }}
              >
                <div className="slot-rank">#{index + 1}</div>
                <div className="slot-info">
                  <div className="slot-day-time">
                    {slot.day} • {slot.possibleStartTime}
                  </div>
                  <div className="slot-score">
                    ציון: {slot.optimalScore}/100
                  </div>
                </div>
                <div className="slot-action">
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSlotCard = (slot: AvailableSlot) => {
    // Use startTime if possibleStartTime is undefined
    const slotStartTime = slot.possibleStartTime;
    const selectedStartTime = controlledSelectedSlot?.possibleStartTime;
    
    const isSelected = controlledSelectedSlot?.timeBlockId === slot.timeBlockId &&
                      selectedStartTime === slotStartTime;
    
    // Debug only when selection changes
    if (isSelected && !controlledSelectedSlot) {
      console.log('🔍 renderSlotCard - selection state changed for slot:', slot.day, slotStartTime);
    }
    
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
              {slot.possibleStartTime} - {slot.possibleEndTime}
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
              console.log('🎯 Slot select button clicked for:', slot.day, slot.possibleStartTime);
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
          {processedSlots.map((slot, index) => (
            <div key={`slot-${slot.timeBlockId}-${slot.possibleStartTime || 'unknown'}-${index}`}>
              {renderSlotCard(slot)}
            </div>
          ))}
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
              {daySlots.map((slot, index) => (
                <div key={`day-slot-${slot.timeBlockId}-${slot.possibleStartTime || 'unknown'}-${index}`}>
                  {renderSlotCard(slot)}
                </div>
              ))}
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
      {/* Search Controls */}
      {renderSearchControls()}
      
      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && renderAdvancedFilters()}
      
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