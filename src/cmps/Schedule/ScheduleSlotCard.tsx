import React from 'react';
import { ScheduleSlot } from '../../types/schedule';
import { formatTime } from '../../utils/scheduleUtils';
import { useScheduleConflicts } from '../../hooks/useScheduleConflicts';

interface ScheduleSlotCardProps {
  slot: ScheduleSlot;
  isSelected?: boolean;
  onSelect?: (slot: ScheduleSlot) => void;
  onEdit?: (slot: ScheduleSlot) => void;
  onAssignStudent?: (slot: ScheduleSlot) => void;
  onRemoveStudent?: (slot: ScheduleSlot) => void;
  showActions?: boolean;
}

const ScheduleSlotCard: React.FC<ScheduleSlotCardProps> = ({
  slot,
  isSelected = false,
  onSelect,
  onEdit,
  onAssignStudent,
  onRemoveStudent,
  showActions = true
}) => {
  const { isSlotConflicting, getSlotConflicts } = useScheduleConflicts();
  const hasConflict = isSlotConflicting(slot.id);
  const conflicts = hasConflict ? getSlotConflicts(slot.id) : [];
  
  // Determine card status class
  let statusClass = 'schedule-slot-card';
  if (isSelected) {
    statusClass += ' selected';
  }
  if (hasConflict) {
    statusClass += ' conflict';
  } else if (slot.studentId) {
    statusClass += ' assigned';
  } else {
    statusClass += ' available';
  }
  
  // Determine the tooltip text for conflicts
  const conflictTooltip = conflicts.length > 0
    ? conflicts.map(conflict => conflict.description).join('\n')
    : '';
  
  // Handle click on the card
  const handleClick = () => {
    if (onSelect) {
      onSelect(slot);
    }
  };
  
  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(slot);
    }
  };
  
  // Handle assign student button click
  const handleAssignClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssignStudent) {
      onAssignStudent(slot);
    }
  };
  
  // Handle remove student button click
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveStudent) {
      onRemoveStudent(slot);
    }
  };
  
  return (
    <div 
      className={statusClass}
      onClick={handleClick}
      title={conflictTooltip}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="slot-time">
        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
      </div>
      
      {slot.studentId && (
        <div className="slot-student">
          <span className="student-name">{slot.studentName}</span>
        </div>
      )}
      
      {slot.location && (
        <div className="slot-location">
          <span className="location">{slot.location}</span>
        </div>
      )}
      
      {slot.isRecurring && (
        <div className="slot-recurring">
          <span className="recurring-badge">Recurring</span>
        </div>
      )}
      
      {hasConflict && (
        <div className="slot-conflict">
          <span className="conflict-badge" aria-label="Conflict detected">!</span>
        </div>
      )}
      
      {showActions && (
        <div className="slot-actions">
          <button 
            className="edit-button"
            onClick={handleEditClick}
            aria-label="Edit slot"
          >
            Edit
          </button>
          
          {slot.studentId ? (
            <button 
              className="remove-student-button"
              onClick={handleRemoveClick}
              aria-label="Remove student"
            >
              Remove
            </button>
          ) : (
            <button 
              className="assign-student-button"
              onClick={handleAssignClick}
              aria-label="Assign student"
            >
              Assign
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleSlotCard;