// src/cmps/Schedule/ScheduleSlotPicker.tsx
// Reusable component for selecting schedule slots

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle } from 'lucide-react';
import { ScheduleSlot, ScheduleFilters } from '../../types/schedule';
import { useScheduleStore } from '../../store/scheduleStore';
import {
  groupSlotsByDay,
} from '../../utils/scheduleTransformations';
import {
  formatDayOfWeek,
  formatTime,
} from '../../utils/scheduleUtils';
import {
  canAssignStudentToSlot,
} from '../../utils/scheduleValidation';

export interface ScheduleSlotPickerProps {
  teacherId: string;
  selectedSlotIds: string[];
  onSlotSelect: (slotId: string) => void;
  onSlotsChange?: (slots: ScheduleSlot[]) => void;
  filters?: Partial<ScheduleFilters>;
  multiSelect?: boolean;
  showOccupied?: boolean;
  showTeacherInfo?: boolean;
  studentSchedule?: ScheduleSlot[]; // For conflict detection
  className?: string;
}

export function ScheduleSlotPicker({
  teacherId,
  selectedSlotIds,
  onSlotSelect,
  onSlotsChange,
  filters,
  multiSelect = true,
  showOccupied = false,
  showTeacherInfo = true,
  studentSchedule = [],
  className = '',
}: ScheduleSlotPickerProps) {
  const {
    loadAvailableSlots,
    isLoadingAvailableSlots,
    error,
    clearErrors,
  } = useScheduleStore();

  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [dayFilter, setDayFilter] = useState<number | null>(null);

  // Load available slots when component mounts or teacherId changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!teacherId) return;
      
      try {
        clearErrors();
        const availableSlots = await loadAvailableSlots(teacherId, filters);
        
        // Filter slots based on showOccupied setting
        const filteredSlots = showOccupied 
          ? availableSlots 
          : availableSlots.filter(slot => !slot.studentId);
          
        setSlots(filteredSlots);
        onSlotsChange?.(filteredSlots);
      } catch (err) {
        console.error('Failed to load slots:', err);
      }
    };

    loadSlots();
  }, [teacherId, filters, showOccupied, loadAvailableSlots, onSlotsChange, clearErrors]);

  // Handle slot selection
  const handleSlotClick = (slot: ScheduleSlot) => {
    // Don't allow selection of occupied slots
    if (slot.studentId && !showOccupied) return;
    
    onSlotSelect(slot.id);
  };

  // Check if slot can be assigned to student
  const getSlotStatus = (slot: ScheduleSlot) => {
    if (slot.studentId) {
      return {
        canSelect: false,
        status: 'occupied',
        message: `תפוס על ידי ${slot.studentName || 'תלמיד אחר'}`,
        color: 'red',
      };
    }

    if (studentSchedule.length > 0) {
      const validation = canAssignStudentToSlot(slot, studentSchedule);
      if (!validation.canAssign) {
        return {
          canSelect: false,
          status: 'conflict',
          message: validation.reason || 'התנגשות',
          color: 'orange',
        };
      }
    }

    return {
      canSelect: true,
      status: 'available',
      message: 'זמין',
      color: 'green',
    };
  };

  // Filter slots by day if selected
  const filteredSlots = dayFilter !== null 
    ? slots.filter(slot => slot.dayOfWeek === dayFilter)
    : slots;

  // Group slots by day for grid view
  const slotsByDay = groupSlotsByDay(filteredSlots);

  const renderSlotCard = (slot: ScheduleSlot) => {
    const isSelected = selectedSlotIds.includes(slot.id);
    const slotStatus = getSlotStatus(slot);

    return (
      <div
        key={slot.id}
        className={`
          slot-card 
          ${isSelected ? 'selected' : ''}
          ${slotStatus.status}
          ${slotStatus.canSelect ? 'selectable' : 'disabled'}
          ${className}
        `}
        onClick={() => slotStatus.canSelect && handleSlotClick(slot)}
        style={{
          cursor: slotStatus.canSelect ? 'pointer' : 'not-allowed',
          borderColor: isSelected ? '#007bff' : 
                      slotStatus.color === 'red' ? '#dc3545' :
                      slotStatus.color === 'orange' ? '#fd7e14' : '#28a745',
        }}
      >
        <div className="slot-header">
          <div className="slot-day">
            <Calendar size={14} />
            {formatDayOfWeek(slot.dayOfWeek, 'medium')}
          </div>
          {isSelected && (
            <CheckCircle size={16} color="#007bff" />
          )}
        </div>

        <div className="slot-time">
          <Clock size={14} />
          <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
        </div>

        {slot.location && (
          <div className="slot-location">
            <MapPin size={14} />
            <span>{slot.location}</span>
          </div>
        )}

        {showTeacherInfo && slot.teacherName && (
          <div className="slot-teacher">
            <User size={14} />
            <span>{slot.teacherName}</span>
          </div>
        )}

        <div className={`slot-status ${slotStatus.status}`}>
          <span>{slotStatus.message}</span>
        </div>

        {slot.notes && (
          <div className="slot-notes">
            <span title={slot.notes}>
              {slot.notes.length > 30 ? `${slot.notes.substring(0, 30)}...` : slot.notes}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => (
    <div className="slots-list">
      {filteredSlots.map(renderSlotCard)}
    </div>
  );

  const renderGridView = () => (
    <div className="slots-grid">
      {[0, 1, 2, 3, 4, 5, 6].map(day => {
        const daySlots = slotsByDay[day] || [];
        if (daySlots.length === 0) return null;

        return (
          <div key={day} className="day-column">
            <h4 className="day-header">
              {formatDayOfWeek(day, 'medium')}
              <span className="slot-count">({daySlots.length})</span>
            </h4>
            <div className="day-slots">
              {daySlots.map(renderSlotCard)}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isLoadingAvailableSlots) {
    return (
      <div className="slot-picker-loading">
        <div className="loading-spinner"></div>
        <span>טוען שעות זמינות...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slot-picker-error">
        <AlertCircle size={24} color="#dc3545" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={`schedule-slot-picker ${className}`}>
      {/* Controls */}
      <div className="picker-controls">
        <div className="view-controls">
          <button
            type="button"
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            רשימה
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            לוח שבועי
          </button>
        </div>

        <div className="filter-controls">
          <select
            value={dayFilter || ''}
            onChange={(e) => setDayFilter(e.target.value ? Number(e.target.value) : null)}
            className="day-filter"
          >
            <option value="">כל הימים</option>
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <option key={day} value={day}>
                {formatDayOfWeek(day, 'medium')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="picker-stats">
        <span>סה"כ {filteredSlots.length} שעות</span>
        <span>נבחרו {selectedSlotIds.length}</span>
        <span>זמינות {filteredSlots.filter(s => !s.studentId).length}</span>
      </div>

      {/* Slots Display */}
      {filteredSlots.length === 0 ? (
        <div className="no-slots-message">
          <Calendar size={48} color="#6c757d" />
          <h4>אין שעות זמינות</h4>
          <p>
            {dayFilter !== null 
              ? `אין שעות זמינות ביום ${formatDayOfWeek(dayFilter, 'medium')}`
              : 'אין שעות זמינות למורה זה'
            }
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? renderListView() : renderGridView()}
        </>
      )}

      {/* Selection Summary */}
      {selectedSlotIds.length > 0 && (
        <div className="selection-summary">
          <h5>שיעורים נבחרים ({selectedSlotIds.length})</h5>
          <div className="selected-slots">
            {selectedSlotIds.map(slotId => {
              const slot = filteredSlots.find(s => s.id === slotId);
              if (!slot) return null;
              
              return (
                <div key={slotId} className="selected-slot-tag">
                  <span>
                    {formatDayOfWeek(slot.dayOfWeek, 'short')} {formatTime(slot.startTime)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSlotSelect(slotId)}
                    className="remove-selection"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleSlotPicker;