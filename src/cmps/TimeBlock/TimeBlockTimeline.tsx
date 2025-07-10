import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import {
  HebrewDayName,
  HEBREW_DAYS_ARRAY,
  NUMERIC_TO_HEBREW_DAYS,
} from '../../types/schedule';
import { TimeBlockResponse, LessonAssignment } from '../../services/timeBlockService';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import { timeToMinutes, minutesToTime } from '../../utils/scheduleUtils';

interface TimeBlockTimelineProps {
  teacherId: string;
  selectedDay?: HebrewDayName;
  onTimeBlockSelect?: (timeBlock: TimeBlockResponse | null) => void;
  onTimeBlockEdit?: (timeBlock: TimeBlockResponse) => void;
  onTimeBlockDelete?: (timeBlock: TimeBlockResponse) => void;
  onCreateTimeBlock?: (day: HebrewDayName, startTime: string, endTime: string) => void;
  onAssignmentClick?: (assignment: LessonAssignment, timeBlock: TimeBlockResponse) => void;
  showAllDays?: boolean;
  isEditable?: boolean;
  zoomLevel?: number;
}

interface TimelineConfig {
  startHour: number;
  endHour: number;
  hourHeight: number;
  dayWidth: number;
  timeSlotMinutes: number;
}

const DEFAULT_CONFIG: TimelineConfig = {
  startHour: 8,
  endHour: 22,
  hourHeight: 80,
  dayWidth: 200,
  timeSlotMinutes: 15,
};

const TimeBlockTimeline: React.FC<TimeBlockTimelineProps> = ({
  teacherId,
  selectedDay,
  onTimeBlockSelect,
  onTimeBlockEdit,
  onTimeBlockDelete,
  onCreateTimeBlock,
  onAssignmentClick,
  showAllDays = true,
  isEditable = true,
  zoomLevel = 1,
}) => {
  const [config, setConfig] = useState<TimelineConfig>({
    ...DEFAULT_CONFIG,
    hourHeight: DEFAULT_CONFIG.hourHeight * zoomLevel,
  });
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragType: 'create' | 'move' | 'resize';
    timeBlock?: TimeBlockResponse;
    startY: number;
    startTime?: string;
  } | null>(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlockResponse | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ day: HebrewDayName; time: string } | null>(null);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const {
    teacherTimeBlocks,
    loadTeacherTimeBlocks,
    selectedTimeBlock: storeSelectedTimeBlock,
    setSelectedTimeBlock: setStoreSelectedTimeBlock,
  } = useTimeBlockStore();

  const timeBlocks = teacherTimeBlocks[teacherId] || [];

  // Load teacher time blocks on mount
  useEffect(() => {
    loadTeacherTimeBlocks(teacherId);
  }, [teacherId, loadTeacherTimeBlocks]);

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

  // Update config when zoom level changes
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      hourHeight: DEFAULT_CONFIG.hourHeight * zoomLevel,
    }));
  }, [zoomLevel]);

  // Calculate timeline dimensions and data
  const timelineData = useMemo(() => {
    const days = showAllDays 
      ? HEBREW_DAYS_ARRAY 
      : selectedDay 
        ? [selectedDay] 
        : HEBREW_DAYS_ARRAY;

    const totalHours = config.endHour - config.startHour;
    const timelineHeight = totalHours * config.hourHeight;
    const timelineWidth = days.length * config.dayWidth;

    // Group time blocks by day
    const blocksByDay = timeBlocks.reduce((acc, block) => {
      if (!acc[block.day]) {
        acc[block.day] = [];
      }
      acc[block.day].push(block);
      return acc;
    }, {} as Record<HebrewDayName, TimeBlockResponse[]>);

    return {
      days,
      totalHours,
      timelineHeight,
      timelineWidth,
      blocksByDay,
    };
  }, [timeBlocks, showAllDays, selectedDay, config]);

  // Calculate position for time blocks
  const calculateBlockPosition = (timeBlock: TimeBlockResponse, dayIndex: number) => {
    const startMinutes = timeToMinutes(timeBlock.startTime);
    const endMinutes = timeToMinutes(timeBlock.endTime);
    const duration = endMinutes - startMinutes;
    
    const top = ((startMinutes - (config.startHour * 60)) / 60) * config.hourHeight;
    const height = (duration / 60) * config.hourHeight;
    const left = dayIndex * config.dayWidth + 4; // 4px margin
    const width = config.dayWidth - 8; // 8px total margin
    
    return { top, height, left, width };
  };

  // Calculate position for assignments within blocks
  const calculateAssignmentPosition = (
    assignment: LessonAssignment, 
    timeBlock: TimeBlockResponse, 
    blockPosition: { top: number; height: number; left: number; width: number }
  ) => {
    const blockStartMinutes = timeToMinutes(timeBlock.startTime);
    const blockEndMinutes = timeToMinutes(timeBlock.endTime);
    const blockDuration = blockEndMinutes - blockStartMinutes;
    
    const assignmentStartMinutes = timeToMinutes(assignment.lessonStartTime);
    const assignmentEndMinutes = timeToMinutes(assignment.lessonEndTime);
    
    const relativeStart = assignmentStartMinutes - blockStartMinutes;
    const assignmentDuration = assignmentEndMinutes - assignmentStartMinutes;
    
    const top = blockPosition.top + (relativeStart / blockDuration) * blockPosition.height;
    const height = (assignmentDuration / blockDuration) * blockPosition.height;
    
    return { top, height };
  };

  // Handle mouse events for creating/editing time blocks
  const handleMouseDown = (e: React.MouseEvent, day: HebrewDayName, dayIndex: number) => {
    if (!isEditable) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const y = e.clientY - rect.top;
    const timeInMinutes = config.startHour * 60 + (y / config.hourHeight) * 60;
    const roundedTime = Math.round(timeInMinutes / config.timeSlotMinutes) * config.timeSlotMinutes;
    const startTime = minutesToTime(roundedTime);
    
    setDragState({
      isDragging: true,
      dragType: 'create',
      startY: y,
      startTime,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    
    // Calculate hovered day and time
    const dayIndex = Math.floor(x / config.dayWidth);
    const day = timelineData.days[dayIndex];
    
    if (day) {
      const timeInMinutes = config.startHour * 60 + (y / config.hourHeight) * 60;
      const roundedTime = Math.round(timeInMinutes / config.timeSlotMinutes) * config.timeSlotMinutes;
      const time = minutesToTime(roundedTime);
      
      setHoveredSlot({ day, time });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragState || !isEditable) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;
    
    if (dragState.dragType === 'create') {
      const dayIndex = Math.floor(x / config.dayWidth);
      const day = timelineData.days[dayIndex];
      
      if (day && dragState.startTime) {
        const endTimeInMinutes = config.startHour * 60 + (y / config.hourHeight) * 60;
        const roundedEndTime = Math.round(endTimeInMinutes / config.timeSlotMinutes) * config.timeSlotMinutes;
        const endTime = minutesToTime(roundedEndTime);
        
        const startTimeMinutes = timeToMinutes(dragState.startTime);
        
        if (roundedEndTime > startTimeMinutes + 30) { // Minimum 30 minutes
          onCreateTimeBlock?.(day, dragState.startTime, endTime);
        }
      }
    }
    
    setDragState(null);
  };

  // Render time grid
  const renderTimeGrid = () => {
    const lines = [];
    
    // Hour lines
    for (let hour = config.startHour; hour <= config.endHour; hour++) {
      const y = (hour - config.startHour) * config.hourHeight;
      const isMainHour = hour % 2 === 0;
      
      lines.push(
        <g key={`hour-${hour}`}>
          <line
            x1={0}
            y1={y}
            x2={timelineData.timelineWidth}
            y2={y}
            stroke={isMainHour ? '#d1d5db' : '#f3f4f6'}
            strokeWidth={isMainHour ? 1 : 0.5}
          />
          <text
            x={-8}
            y={y + 4}
            textAnchor="end"
            fontSize="12"
            fill="#6b7280"
            className="timeline-hour-label"
          >
            {hour.toString().padStart(2, '0')}:00
          </text>
        </g>
      );
    }
    
    // Day separator lines
    for (let i = 1; i < timelineData.days.length; i++) {
      const x = i * config.dayWidth;
      lines.push(
        <line
          key={`day-sep-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={timelineData.timelineHeight}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }
    
    return lines;
  };

  // Render time blocks
  const renderTimeBlocks = () => {
    const blocks: React.JSX.Element[] = [];
    
    timelineData.days.forEach((day, dayIndex) => {
      const dayBlocks = timelineData.blocksByDay[day] || [];
      
      dayBlocks.forEach((timeBlock) => {
        const position = calculateBlockPosition(timeBlock, dayIndex);
        const isSelected = selectedTimeBlock?._id === timeBlock._id || 
                          storeSelectedTimeBlock?._id === timeBlock._id;
        const utilizationPercentage = timeBlock.utilizationPercentage || 0;
        
        blocks.push(
          <g key={timeBlock._id}>
            {/* Time Block Container */}
            <rect
              x={position.left}
              y={position.top}
              width={position.width}
              height={position.height}
              fill={isSelected ? '#dbeafe' : '#f9fafb'}
              stroke={isSelected ? '#3b82f6' : '#e5e7eb'}
              strokeWidth={isSelected ? 2 : 1}
              rx={6}
              className="time-block-rect"
              onClick={() => {
                setSelectedTimeBlock(timeBlock);
                setStoreSelectedTimeBlock(timeBlock);
                onTimeBlockSelect?.(timeBlock);
              }}
              style={{ cursor: 'pointer' }}
            />
            
            {/* Time Block Header */}
            <foreignObject
              x={position.left + 8}
              y={position.top + 8}
              width={position.width - 16}
              height={32}
            >
              <div className="time-block-header">
                <div className="time-block-time">
                  <Clock size={12} />
                  <span>{timeBlock.startTime} - {timeBlock.endTime}</span>
                </div>
                {isEditable && (
                  <div className="time-block-actions">
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimeBlockEdit?.(timeBlock);
                      }}
                      title="ערוך יום לימוד"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTimeBlockDelete?.(timeBlock);
                      }}
                      title="מחק יום לימוד"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </foreignObject>
            
            {/* Location */}
            {timeBlock.location && (
              <foreignObject
                x={position.left + 8}
                y={position.top + 45}
                width={position.width - 16}
                height={20}
              >
                <div className="time-block-location">
                  <MapPin size={10} />
                  <span>{timeBlock.location}</span>
                </div>
              </foreignObject>
            )}
            
            {/* Utilization Bar */}
            <rect
              x={position.left + 8}
              y={position.top + position.height - 20}
              width={position.width - 16}
              height={4}
              fill="#f3f4f6"
              rx={2}
            />
            <rect
              x={position.left + 8}
              y={position.top + position.height - 20}
              width={(position.width - 16) * (utilizationPercentage / 100)}
              height={4}
              fill={utilizationPercentage > 80 ? '#ef4444' : utilizationPercentage > 60 ? '#f59e0b' : '#10b981'}
              rx={2}
            />
            
            {/* Utilization Text */}
            <foreignObject
              x={position.left + 8}
              y={position.top + position.height - 14}
              width={position.width - 16}
              height={12}
            >
              <div className="utilization-text">
                {utilizationPercentage.toFixed(0)}% ניצול
              </div>
            </foreignObject>
            
            {/* Lesson Assignments */}
            {timeBlock.assignedLessons.map((assignment, assignmentIndex) => {
              const assignmentPos = calculateAssignmentPosition(assignment, timeBlock, position);
              
              return (
                <g key={`${timeBlock._id}-assignment-${assignmentIndex}`}>
                  <rect
                    x={position.left + 4}
                    y={assignmentPos.top}
                    width={position.width - 8}
                    height={assignmentPos.height}
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    rx={3}
                    className="lesson-assignment"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignmentClick?.(assignment, timeBlock);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  
                  <foreignObject
                    x={position.left + 8}
                    y={assignmentPos.top + 4}
                    width={position.width - 16}
                    height={assignmentPos.height - 8}
                  >
                    <div className="assignment-content">
                      <div className="assignment-student">
                        <User size={10} />
                        <span>{assignment.studentName}</span>
                      </div>
                      <div className="assignment-time">
                        {assignment.lessonStartTime} - {assignment.lessonEndTime}
                      </div>
                      <div className="assignment-duration">
                        {formatDuration(assignment.duration)}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        );
      });
    });
    
    return blocks;
  };

  // Render day headers
  const renderDayHeaders = () => {
    return timelineData.days.map((day, index) => (
      <div
        key={day}
        className="day-header"
        style={{
          left: index * config.dayWidth,
          width: config.dayWidth,
        }}
      >
        <div className="day-name">{day}</div>
        <div className="day-blocks-count">
          {(timelineData.blocksByDay[day] || []).length} ימי לימוד
        </div>
        {isEditable && (
          <button
            className="add-block-btn"
            onClick={() => {
              // Default to 2-hour block starting at 9 AM
              onCreateTimeBlock?.(day, '09:00', '11:00');
            }}
            title="הוסף יום לימוד"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    ));
  };

  // Render creation preview during drag
  const renderCreationPreview = () => {
    if (!dragState || dragState.dragType !== 'create' || !hoveredSlot) return null;
    
    const dayIndex = timelineData.days.indexOf(hoveredSlot.day);
    if (dayIndex === -1) return null;
    
    const startMinutes = timeToMinutes(dragState.startTime!);
    const currentMinutes = timeToMinutes(hoveredSlot.time);
    
    if (currentMinutes <= startMinutes) return null;
    
    const top = ((startMinutes - (config.startHour * 60)) / 60) * config.hourHeight;
    const height = ((currentMinutes - startMinutes) / 60) * config.hourHeight;
    const left = dayIndex * config.dayWidth + 4;
    const width = config.dayWidth - 8;
    
    return (
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        fill="#3b82f6"
        fillOpacity={0.3}
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4,4"
        rx={6}
        className="creation-preview"
      />
    );
  };

  return (
    <div className="time-block-timeline">
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-controls">
          <div className="zoom-controls">
            <button className="zoom-btn" title="הקטן">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button className="zoom-btn" title="הגדל">
              <ZoomIn size={16} />
            </button>
          </div>
          
          <button className="reset-btn" title="איפוס תצוגה">
            <RotateCcw size={16} />
            איפוס
          </button>
        </div>
        
        <div className="timeline-info">
          <span>{timeBlocks.length} ימי לימוד</span>
          <span>•</span>
          <span>
            {timeBlocks.reduce((total, block) => total + block.assignedLessons.length, 0)} שיעורים
          </span>
        </div>
      </div>
      
      {/* Day Headers */}
      <div className="day-headers" style={{ width: timelineData.timelineWidth }}>
        {renderDayHeaders()}
      </div>
      
      {/* Timeline Content */}
      <div className="timeline-container">
        <div className="time-labels">
          {Array.from({ length: config.endHour - config.startHour + 1 }, (_, i) => {
            const hour = config.startHour + i;
            return (
              <div
                key={hour}
                className="time-label"
                style={{ height: config.hourHeight }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            );
          })}
        </div>
        
        <div
          ref={timelineRef}
          className="timeline-svg-container"
          style={{
            width: timelineData.timelineWidth,
            height: timelineData.timelineHeight,
          }}
          onMouseDown={(e) => {
            if (hoveredSlot) {
              const dayIndex = timelineData.days.indexOf(hoveredSlot.day);
              handleMouseDown(e, hoveredSlot.day, dayIndex);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoveredSlot(null);
            setDragState(null);
          }}
        >
          <svg
            width={timelineData.timelineWidth}
            height={timelineData.timelineHeight}
            className="timeline-svg"
          >
            {/* Grid */}
            {renderTimeGrid()}
            
            {/* Time Blocks */}
            {renderTimeBlocks()}
            
            {/* Creation Preview */}
            {renderCreationPreview()}
          </svg>
          
          {/* Hover Indicator */}
          {hoveredSlot && !dragState && (
            <div
              className="hover-indicator"
              style={{
                left: timelineData.days.indexOf(hoveredSlot.day) * config.dayWidth + 4,
                top: ((timeToMinutes(hoveredSlot.time) - (config.startHour * 60)) / 60) * config.hourHeight - 1,
                width: config.dayWidth - 8,
                height: 2,
              }}
            />
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="timeline-status">
        {selectedTimeBlock ? (
          <div className="selected-block-info">
            <div className="status-item">
              <Calendar size={14} />
              <span>{selectedTimeBlock.day}</span>
            </div>
            <div className="status-item">
              <Clock size={14} />
              <span>{selectedTimeBlock.startTime} - {selectedTimeBlock.endTime}</span>
            </div>
            <div className="status-item">
              <User size={14} />
              <span>{selectedTimeBlock.assignedLessons.length} שיעורים</span>
            </div>
            {selectedTimeBlock.location && (
              <div className="status-item">
                <MapPin size={14} />
                <span>{selectedTimeBlock.location}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="default-status">
            {isEditable ? 'לחץ וגרור ליצירת יום לימוד חדש' : 'בחר יום לימוד לצפייה בפרטים'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeBlockTimeline;