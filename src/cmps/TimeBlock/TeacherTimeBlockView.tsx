// src/cmps/TimeBlock/TeacherTimeBlockView.tsx
<<<<<<< Updated upstream
import React, { useState, useEffect, useCallback } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> Stashed changes
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
<<<<<<< Updated upstream
=======
  Settings,
>>>>>>> Stashed changes
  BarChart3,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import TimeBlockCreator from './TimeBlockCreator';
<<<<<<< Updated upstream
=======
import AvailableSlotsFinder from './AvailableSlotsFinder';
>>>>>>> Stashed changes
import { ConfirmDialog } from '../ConfirmDialog';
import {
  TimeBlockResponse,
  LessonAssignment,
<<<<<<< Updated upstream
=======
  AvailableSlot,
>>>>>>> Stashed changes
  HebrewDayName,
  HEBREW_DAYS,
  LessonDurationMinutes,
} from '../../services/timeBlockService';

interface TeacherTimeBlockViewProps {
  teacherId: string;
  teacherName: string;
  onTimeBlockChange?: (timeBlocks: TimeBlockResponse[]) => void;
  readOnly?: boolean;
  className?: string;
<<<<<<< Updated upstream
  isAdmin?: boolean;
=======
>>>>>>> Stashed changes
}

interface TimeBlockFormData {
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

export const TeacherTimeBlockView: React.FC<TeacherTimeBlockViewProps> = ({
  teacherId,
  teacherName,
  onTimeBlockChange,
  readOnly = false,
<<<<<<< Updated upstream
  className = '',
  isAdmin = false
=======
  className = ''
>>>>>>> Stashed changes
}) => {
  const {
    currentTeacherSchedule,
    selectedTimeBlock,
    isLoading,
    error,
    loadTeacherSchedule,
    createTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    setSelectedTimeBlock,
    clearError,
  } = useTimeBlockStore();

  // Component state
  const [showCreator, setShowCreator] = useState(false);
<<<<<<< Updated upstream
=======
  const [showSlotFinder, setShowSlotFinder] = useState(false);
>>>>>>> Stashed changes
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlockResponse | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timeBlockToDelete, setTimeBlockToDelete] = useState<TimeBlockResponse | null>(null);
  const [viewMode, setViewMode] = useState<'blocks' | 'calendar' | 'stats'>('blocks');
  const [selectedDay, setSelectedDay] = useState<HebrewDayName | null>(null);

<<<<<<< Updated upstream
  // Ensure non-admin users can't access stats view
  useEffect(() => {
    if (!isAdmin && viewMode === 'stats') {
      setViewMode('blocks');
    }
  }, [isAdmin, viewMode]);

=======
>>>>>>> Stashed changes
  // Load teacher schedule on mount
  useEffect(() => {
    if (teacherId) {
      loadTeacherSchedule(teacherId);
    }
  }, [teacherId, loadTeacherSchedule]);

  // Notify parent of schedule changes
  useEffect(() => {
    if (currentTeacherSchedule?.timeBlocks && onTimeBlockChange) {
      onTimeBlockChange(currentTeacherSchedule.timeBlocks);
    }
  }, [currentTeacherSchedule?.timeBlocks, onTimeBlockChange]);

  // Format duration in hours format
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

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle create new time block
  const handleCreateTimeBlock = () => {
    setEditingTimeBlock(null);
    setShowCreator(true);
  };

  // Handle edit existing time block
  const handleEditTimeBlock = (timeBlock: TimeBlockResponse) => {
    setEditingTimeBlock(timeBlock);
    setShowCreator(true);
  };

  // Handle delete time block
  const handleDeleteTimeBlock = (timeBlock: TimeBlockResponse) => {
    setTimeBlockToDelete(timeBlock);
    setShowDeleteConfirm(true);
  };

  // Confirm delete time block
  const confirmDeleteTimeBlock = async () => {
    if (!timeBlockToDelete) return;

    try {
<<<<<<< Updated upstream
      console.log('Attempting to delete time block:', timeBlockToDelete._id);
      const result = await deleteTimeBlock(timeBlockToDelete._id);
      console.log('Delete result:', result);
      setShowDeleteConfirm(false);
      setTimeBlockToDelete(null);
      // Reload the schedule to get updated data
      loadTeacherSchedule(teacherId);
    } catch (err) {
      console.error('Failed to delete time block:', err);
      console.error('Delete error details:', {
        timeBlockId: timeBlockToDelete._id,
        error: err
      });
      
      // Keep the dialog open and show error
      // The error will be displayed by the timeBlockStore error state
      setShowDeleteConfirm(false);
      setTimeBlockToDelete(null);
=======
      await deleteTimeBlock(timeBlockToDelete._id);
      setShowDeleteConfirm(false);
      setTimeBlockToDelete(null);
    } catch (err) {
      console.error('Failed to delete time block:', err);
>>>>>>> Stashed changes
    }
  };

  // Handle time block creation success
  const handleTimeBlockCreated = () => {
    setShowCreator(false);
    setEditingTimeBlock(null);
    // Reload the schedule to get updated data
    loadTeacherSchedule(teacherId);
  };

<<<<<<< Updated upstream
=======
  // Handle slot selection from finder
  const handleSlotSelected = (slot: AvailableSlot) => {
    console.log('Selected slot:', slot);
    // Here you would typically open a lesson assignment modal
  };
>>>>>>> Stashed changes

  // Get time blocks grouped by day
  const getTimeBlocksByDay = (): Record<HebrewDayName, TimeBlockResponse[]> => {
    if (!currentTeacherSchedule?.timeBlocks) return {} as Record<HebrewDayName, TimeBlockResponse[]>;

    const grouped: Record<HebrewDayName, TimeBlockResponse[]> = {} as Record<HebrewDayName, TimeBlockResponse[]>;
    
    currentTeacherSchedule.timeBlocks.forEach(timeBlock => {
      if (!grouped[timeBlock.day]) {
        grouped[timeBlock.day] = [];
      }
      grouped[timeBlock.day].push(timeBlock);
    });

    // Sort time blocks within each day by start time
    Object.keys(grouped).forEach(day => {
      grouped[day as HebrewDayName].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
  };

  // Calculate utilization percentage for a time block
  const calculateUtilization = (timeBlock: TimeBlockResponse): number => {
    if (timeBlock.totalDuration === 0) return 0;
    const usedMinutes = timeBlock.totalDuration - timeBlock.availableMinutes;
    return Math.round((usedMinutes / timeBlock.totalDuration) * 100);
  };

  // Render lesson assignment within a time block
  const renderLessonAssignment = (assignment: LessonAssignment) => (
    <div key={assignment._id} className="lesson-assignment">
      <div className="assignment-info">
        <div className="student-info">
          <User size={12} />
          <span>{assignment.studentName}</span>
        </div>
        <div className="assignment-time">
          <Clock size={12} />
          <span>{assignment.lessonStartTime} - {assignment.lessonEndTime}</span>
          <span className="duration">({formatDuration(assignment.duration)})</span>
        </div>
      </div>
      {assignment.notes && (
        <div className="assignment-notes" title={assignment.notes}>
          {assignment.notes.length > 30 ? `${assignment.notes.substring(0, 30)}...` : assignment.notes}
        </div>
      )}
    </div>
  );

  // Render time block card
  const renderTimeBlockCard = (timeBlock: TimeBlockResponse) => {
    const isSelected = selectedTimeBlock?._id === timeBlock._id;
    const utilization = calculateUtilization(timeBlock);
    const hasAssignments = timeBlock.assignedLessons.length > 0;

    return (
      <div
        key={timeBlock._id}
        className={`time-block-card ${isSelected ? 'selected' : ''} ${!timeBlock.isActive ? 'inactive' : ''}`}
        onClick={() => setSelectedTimeBlock(timeBlock)}
      >
        <div className="time-block-header">
          <div className="block-time">
            <Clock size={14} />
            <span>{timeBlock.startTime} - {timeBlock.endTime}</span>
            <span className="duration">({formatDuration(timeBlock.totalDuration)})</span>
          </div>
          <div className="block-actions">
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTimeBlock(timeBlock);
                  }}
                  title="ערוך יום לימוד"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTimeBlock(timeBlock);
                  }}
                  title="מחק יום לימוד"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="utilization-bar">
          <div 
            className="utilization-fill" 
            style={{ width: `${utilization}%` }}
          ></div>
          <span className="utilization-text">{utilization}% תפוסה</span>
        </div>

        {timeBlock.location && (
          <div className="block-location">
            <MapPin size={12} />
            <span>{timeBlock.location}</span>
          </div>
        )}

        <div className="availability-info">
          <span className="available-time">זמין: {formatDuration(timeBlock.availableMinutes)}</span>
        </div>

        {hasAssignments ? (
          <div className="assigned-lessons">
            <h5>שיעורים מוקצים:</h5>
            {timeBlock.assignedLessons.map(renderLessonAssignment)}
          </div>
        ) : (
          <div className="no-assignments">
            <CheckCircle size={14} color="green" />
            <span>אין שיעורים מוקצים</span>
          </div>
        )}

        {timeBlock.notes && (
          <div className="block-notes" title={timeBlock.notes}>
            <span>
              {timeBlock.notes.length > 50 ? `${timeBlock.notes.substring(0, 50)}...` : timeBlock.notes}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Render blocks view
  const renderBlocksView = () => {
    const timeBlocksByDay = getTimeBlocksByDay();

<<<<<<< Updated upstream
    // Filter days to show only those with time blocks
    const daysWithBlocks = HEBREW_DAYS.filter(day => {
      const dayBlocks = timeBlocksByDay[day] || [];
      return dayBlocks.length > 0;
    });

    return (
      <div className="time-blocks-view">
        {daysWithBlocks.length === 0 ? (
          <div className="no-working-days">
            <div className="no-blocks-message">
              <Calendar size={32} />
              <h4>אין ימי לימוד</h4>
              <p>למורה זה אין ימי לימוד מוגדרים</p>
            </div>
          </div>
        ) : (
          daysWithBlocks.map(day => {
            const dayBlocks = timeBlocksByDay[day] || [];
            
            return (
              <div key={day} className="day-column">
                <div className="day-header">
                  <h4>{day}</h4>
                  <span className="block-count">({dayBlocks.length})</span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="add-block-btn"
                      onClick={() => {
                        setSelectedDay(day);
                        handleCreateTimeBlock();
                      }}
                      title="הוסף יום לימוד"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                
                <div className="day-blocks">
                  {dayBlocks.map(renderTimeBlockCard)}
                </div>
              </div>
            );
          })
        )}
=======
    return (
      <div className="time-blocks-view">
        {HEBREW_DAYS.map(day => {
          const dayBlocks = timeBlocksByDay[day] || [];
          
          return (
            <div key={day} className="day-column">
              <div className="day-header">
                <h4>{day}</h4>
                <span className="block-count">({dayBlocks.length})</span>
                {!readOnly && (
                  <button
                    type="button"
                    className="add-block-btn"
                    onClick={() => {
                      setSelectedDay(day);
                      handleCreateTimeBlock();
                    }}
                    title="הוסף יום לימוד"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              
              <div className="day-blocks">
                {dayBlocks.length === 0 ? (
                  <div className="no-blocks">אין ימי לימוד</div>
                ) : (
                  dayBlocks.map(renderTimeBlockCard)
                )}
              </div>
            </div>
          );
        })}
>>>>>>> Stashed changes
      </div>
    );
  };

  // Render statistics view
  const renderStatsView = () => {
    if (!currentTeacherSchedule) return null;

    const { weeklyStats } = currentTeacherSchedule;

    return (
      <div className="stats-view">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h4>סה"כ ימי לימוד</h4>
              <span className="stat-value">{weeklyStats.totalTimeBlocks}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h4>זמן זמין (דקות)</h4>
              <span className="stat-value">{weeklyStats.totalAvailableMinutes}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <User size={24} />
            </div>
            <div className="stat-content">
              <h4>זמן מוקצה (דקות)</h4>
              <span className="stat-value">{weeklyStats.totalAssignedMinutes}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h4>אחוז ניצול</h4>
              <span className="stat-value">{weeklyStats.utilizationPercentage}%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Target size={24} />
            </div>
            <div className="stat-content">
              <h4>גודל יום לימוד ממוצע</h4>
              <span className="stat-value">{formatDuration(Math.round(weeklyStats.averageBlockSize))}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="time-block-loading">
        <div className="loading-spinner"></div>
        <span>טוען ימי לימוד...</span>
      </div>
    );
  }

  return (
    <div className={`teacher-time-block-view ${className}`}>
      {/* Header */}
      <div className="time-block-header">
        <div className="header-info">
          <h3>ימי לימוד - {teacherName}</h3>
          {currentTeacherSchedule?.weeklyStats && (
            <div className="schedule-stats">
              <span>ימי לימוד: {currentTeacherSchedule.weeklyStats.totalTimeBlocks}</span>
              <span>ניצול: {currentTeacherSchedule.weeklyStats.utilizationPercentage}%</span>
            </div>
          )}
        </div>

        <div className="header-actions">
<<<<<<< Updated upstream
          {isAdmin && (
            <div className="view-controls">
              <button
                type="button"
                className={`view-btn ${viewMode === 'blocks' ? 'active' : ''}`}
                onClick={() => setViewMode('blocks')}
              >
                <Calendar size={16} />
                ימי לימוד
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
                onClick={() => setViewMode('stats')}
              >
                <BarChart3 size={16} />
                סטטיסטיקות
              </button>
            </div>
          )}

          {!readOnly && (
            <button
              type="button"
              className="add-block-btn primary"
              onClick={handleCreateTimeBlock}
            >
              <Plus size={16} />
              הוסף יום לימוד
            </button>
=======
          <div className="view-controls">
            <button
              type="button"
              className={`view-btn ${viewMode === 'blocks' ? 'active' : ''}`}
              onClick={() => setViewMode('blocks')}
            >
              <Calendar size={16} />
              ימי לימוד
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              <BarChart3 size={16} />
              סטטיסטיקות
            </button>
          </div>

          {!readOnly && (
            <>
              <button
                type="button"
                className="find-slots-btn"
                onClick={() => setShowSlotFinder(!showSlotFinder)}
              >
                <Settings size={16} />
                חיפוש זמינות
              </button>
              <button
                type="button"
                className="add-block-btn primary"
                onClick={handleCreateTimeBlock}
              >
                <Plus size={16} />
                הוסף יום לימוד
              </button>
            </>
>>>>>>> Stashed changes
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="time-block-error">
          <AlertCircle size={16} color="red" />
          <span>{error}</span>
        </div>
      )}

<<<<<<< Updated upstream
=======
      {/* Slot finder */}
      {showSlotFinder && (
        <div className="slot-finder-section">
          <AvailableSlotsFinder
            teacherId={teacherId}
            onSlotSelect={handleSlotSelected}
            compact={true}
          />
        </div>
      )}
>>>>>>> Stashed changes

      {/* Content */}
      <div className="time-block-content">
        {viewMode === 'blocks' ? renderBlocksView() : renderStatsView()}
      </div>

      {/* Time Block Creator Modal */}
      {showCreator && (
        <TimeBlockCreator
          teacherId={teacherId}
          onBlockCreated={handleTimeBlockCreated}
          onCancel={() => setShowCreator(false)}
          initialData={editingTimeBlock ? {
            day: editingTimeBlock.day,
            startTime: editingTimeBlock.startTime,
            endTime: editingTimeBlock.endTime,
            location: editingTimeBlock.location,
            notes: editingTimeBlock.notes
          } : undefined}
          isOpen={showCreator}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteTimeBlock}
        title="מחיקת יום לימוד"
        message={`האם אתה בטוח שברצונך למחוק את יום הלימוד ביום ${timeBlockToDelete?.day} בשעה ${timeBlockToDelete?.startTime}?`}
        confirmText="מחק"
        cancelText="ביטול"
        type="danger"
      />
    </div>
  );
};

export default TeacherTimeBlockView;