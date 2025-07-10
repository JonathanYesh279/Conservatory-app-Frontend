import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  AlertCircle,
  CheckCircle,
  User,
  BarChart3,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import TimeBlockCreator from '../TimeBlock/TimeBlockCreator';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  TimeBlockResponse,
  LessonAssignment,
  HebrewDayName,
  HEBREW_DAYS,
  TeacherScheduleWithBlocks
} from '../../services/timeBlockService';

interface TeacherTimeBlockManagerProps {
  teacherId: string;
  teacherName: string;
  onTimeBlockChange?: (timeBlocks: TimeBlockResponse[]) => void;
}

interface TimeBlockFormData {
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

export function TeacherTimeBlockManager({ 
  teacherId, 
  teacherName, 
  onTimeBlockChange 
}: TeacherTimeBlockManagerProps) {
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
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlockResponse | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [timeBlockToDelete, setTimeBlockToDelete] = useState<TimeBlockResponse | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

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
      await deleteTimeBlock(timeBlockToDelete._id);
      setShowDeleteConfirm(false);
      setTimeBlockToDelete(null);
    } catch (err) {
      console.error('Failed to delete time block:', err);
    }
  };

  // Handle time block creation/update success
  const handleTimeBlockCreated = (timeBlock: TimeBlockResponse | TimeBlockResponse[]) => {
    console.log('Time block created successfully:', timeBlock);
    setShowCreator(false);
    setEditingTimeBlock(null);
    // Reload the schedule to get updated data
    loadTeacherSchedule(teacherId);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadTeacherSchedule(teacherId);
  };

  // Toggle expanded view for time block
  const toggleBlockExpanded = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

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

  // Render compact time block card
  const renderTimeBlockCard = (timeBlock: TimeBlockResponse) => {
    const isExpanded = expandedBlocks.has(timeBlock._id);
    const utilization = calculateUtilization(timeBlock);
    const hasAssignments = timeBlock.assignedLessons.length > 0;

    return (
      <div
        key={timeBlock._id}
        className={`time-block-card ${!timeBlock.isActive ? 'inactive' : ''}`}
      >
        <div className="time-block-header">
          <div className="block-main-info">
            <div className="block-time">
              <Clock size={14} />
              <span>{timeBlock.startTime} - {timeBlock.endTime}</span>
              <span className="duration">({formatDuration(timeBlock.totalDuration)})</span>
            </div>
            
            <div className="utilization-badge">
              <div 
                className={`utilization-fill ${
                  utilization >= 80 ? 'high' : utilization >= 50 ? 'medium' : 'low'
                }`}
                style={{ width: `${utilization}%` }}
              ></div>
              <span className="utilization-text">{utilization}%</span>
            </div>
          </div>

          <div className="block-actions">
            <button
              type="button"
              className="action-btn view-btn"
              onClick={() => toggleBlockExpanded(timeBlock._id)}
              title={isExpanded ? "הסתר פרטים" : "הצג פרטים"}
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              className="action-btn edit-btn"
              onClick={() => handleEditTimeBlock(timeBlock)}
              title="ערוך יום לימוד"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              className="action-btn delete-btn"
              onClick={() => handleDeleteTimeBlock(timeBlock)}
              title="מחק יום לימוד"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {timeBlock.location && (
          <div className="block-location">
            <MapPin size={12} />
            <span>{timeBlock.location}</span>
          </div>
        )}

        <div className="availability-info">
          <span className="available-time">
            זמין: {formatDuration(timeBlock.availableMinutes)}
            {hasAssignments && ` | ${timeBlock.assignedLessons.length} שיעורים`}
          </span>
        </div>

        {isExpanded && (
          <div className="block-details">
            {hasAssignments ? (
              <div className="assigned-lessons">
                <h5>שיעורים מוקצים:</h5>
                {timeBlock.assignedLessons.map(renderLessonAssignment)}
              </div>
            ) : (
              <div className="no-assignments">
                <CheckCircle size={14} color="var(--success)" />
                <span>אין שיעורים מוקצים</span>
              </div>
            )}

            {timeBlock.notes && (
              <div className="block-notes">
                <strong>הערות:</strong>
                <span>{timeBlock.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render statistics summary
  const renderStats = () => {
    if (!currentTeacherSchedule?.weeklyStats) return null;

    const { weeklyStats } = currentTeacherSchedule;

    return (
      <div className="stats-summary">
        <div className="stat-item">
          <BarChart3 size={16} />
          <span>{weeklyStats.totalTimeBlocks} ימי לימוד</span>
        </div>
        <div className="stat-item">
          <Clock size={16} />
          <span>{formatDuration(weeklyStats.totalAvailableMinutes)} זמינות</span>
        </div>
        <div className="stat-item">
          <User size={16} />
          <span>{weeklyStats.utilizationPercentage}% ניצול</span>
        </div>
      </div>
    );
  };

  const timeBlocksByDay = getTimeBlocksByDay();
  const totalBlocks = currentTeacherSchedule?.timeBlocks?.length || 0;

  if (isLoading && !currentTeacherSchedule) {
    return (
      <div className="time-block-manager loading">
        <div className="loading-spinner"></div>
        <span>טוען ימי לימוד...</span>
      </div>
    );
  }

  return (
    <div className="teacher-time-block-manager">
      <div className="manager-header">
        <div className="header-info">
          <h3>
            <Calendar size={18} />
            ימי לימוד - {teacherName}
          </h3>
          {renderStats()}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="action-btn refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading}
            title="רענן נתונים"
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleCreateTimeBlock}
            disabled={isLoading}
          >
            <Plus size={16} />
            הוסף יום לימוד
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Time Blocks Display */}
      {totalBlocks === 0 ? (
        <div className="empty-state">
          <Calendar size={48} color="var(--text-muted)" />
          <h4>אין ימי לימוד</h4>
          <p>לא הוגדרו עדיין ימי לימוד עבור המורה הזה</p>
          <button
            type="button"
            className="btn primary"
            onClick={handleCreateTimeBlock}
          >
            <Plus size={16} />
            צור יום לימוד ראשון
          </button>
        </div>
      ) : (
        <div className="time-blocks-container">
          {HEBREW_DAYS.map(day => {
            const dayBlocks = timeBlocksByDay[day] || [];
            
            if (dayBlocks.length === 0) return null;

            return (
              <div key={day} className="day-section">
                <div className="day-header">
                  <h4>{day}</h4>
                  <span className="block-count">({dayBlocks.length} ימי לימוד)</span>
                </div>
                
                <div className="day-blocks">
                  {dayBlocks.map(renderTimeBlockCard)}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
}

export default TeacherTimeBlockManager;