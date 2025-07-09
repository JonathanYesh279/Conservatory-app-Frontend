// src/cmps/TeacherForm/TeacherScheduleManagement.tsx
// Enhanced teacher schedule management component

import React, { useState, useEffect } from 'react';
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
  Settings,
  Download,
  Upload,
} from 'lucide-react';
import { useScheduleStore } from '../../store/scheduleStore';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  ScheduleSlot,
  WeeklySchedule,
  CreateScheduleSlotRequest,
  UpdateScheduleSlotRequest,
} from '../../types/schedule';
import {
  groupSlotsByDay,
  getHebrewDaysInOrder,
  generateTimeSlotOptions,
  calculateEndTimeFromDuration,
} from '../../utils/scheduleTransformations';
import {
  formatDayOfWeek,
  formatTime,
} from '../../utils/scheduleUtils';
import {
  validateTimeSlot,
  detectScheduleConflicts,
} from '../../utils/scheduleValidation';

export interface TeacherScheduleManagementProps {
  teacherId: string;
  teacherName: string;
  onScheduleChange?: (schedule: WeeklySchedule) => void;
  readOnly?: boolean;
  className?: string;
}

interface SlotFormData {
  dayOfWeek: number;
  startTime: string;
  duration: number;
  location: string;
  notes: string;
  isRecurring: boolean;
}

export function TeacherScheduleManagement({
  teacherId,
  teacherName,
  onScheduleChange,
  readOnly = false,
  className = '',
}: TeacherScheduleManagementProps) {
  const {
    currentTeacherSchedule,
    currentTeacherScheduleMetadata,
    selectedSlot,
    conflicts,
    isLoadingTeacherSchedule,
    isCreatingSlot,
    isUpdatingSlot,
    error,
    loadTeacherSchedule,
    loadTeacherScheduleMetadata,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    setSelectedSlot,
    clearErrors,
  } = useScheduleStore();

  // Component state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<ScheduleSlot | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<SlotFormData>({
    dayOfWeek: 0,
    startTime: '16:00',
    duration: 45,
    location: '',
    notes: '',
    isRecurring: true,
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Load teacher schedule on mount
  useEffect(() => {
    if (teacherId) {
      loadTeacherSchedule(teacherId, true);
      loadTeacherScheduleMetadata(teacherId, true);
    }
  }, [teacherId, loadTeacherSchedule, loadTeacherScheduleMetadata]);

  // Notify parent of schedule changes
  useEffect(() => {
    if (currentTeacherSchedule && onScheduleChange) {
      onScheduleChange(currentTeacherSchedule);
    }
  }, [currentTeacherSchedule, onScheduleChange]);

  // Clear errors when component mounts
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Handle create new slot
  const handleCreateSlot = () => {
    setFormData({
      dayOfWeek: selectedDay || 0,
      startTime: '16:00',
      duration: 45,
      location: '',
      notes: '',
      isRecurring: true,
    });
    setEditingSlot(null);
    setShowCreateForm(true);
    setFormErrors([]);
  };

  // Handle edit existing slot
  const handleEditSlot = (slot: ScheduleSlot) => {
    setFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      duration: slot.duration || 45,
      location: slot.location || '',
      notes: slot.notes || '',
      isRecurring: slot.isRecurring,
    });
    setEditingSlot(slot);
    setShowCreateForm(true);
    setFormErrors([]);
  };

  // Handle delete slot
  const handleDeleteSlot = (slot: ScheduleSlot) => {
    setSlotToDelete(slot);
    setShowDeleteConfirm(true);
  };

  // Confirm delete slot
  const confirmDeleteSlot = async () => {
    if (!slotToDelete) return;

    try {
      await deleteTimeSlot(slotToDelete.id);
      setShowDeleteConfirm(false);
      setSlotToDelete(null);
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    setFormErrors([]);
    const errors: string[] = [];

    // Basic validation
    if (formData.duration < 15 || formData.duration > 240) {
      errors.push('משך השיעור חייב להיות בין 15 ל-240 דקות');
    }

    // Time validation
    const endTime = calculateEndTimeFromDuration(formData.startTime, formData.duration);
    const timeValidation = validateTimeSlot(formData.startTime, endTime, formData.duration);
    
    if (!timeValidation.isValid) {
      errors.push(...timeValidation.errors);
    }

    // Conflict detection
    if (currentTeacherSchedule) {
      const allSlots = Object.values(currentTeacherSchedule).flat();
      const tempSlot: ScheduleSlot = {
        id: editingSlot?.id || 'temp',
        teacherId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime,
        duration: formData.duration,
        location: formData.location,
        notes: formData.notes,
        isRecurring: formData.isRecurring,
        isActive: true,
      };

      const conflictResult = detectScheduleConflicts([...allSlots, tempSlot]);
      const relevantConflicts = conflictResult.conflicts.filter(conflict => 
        (typeof conflict.slotA === 'string' ? conflict.slotA === 'temp' : conflict.slotA.id === 'temp') || 
        (conflict.slotB && (typeof conflict.slotB === 'string' ? conflict.slotB === 'temp' : conflict.slotB.id === 'temp'))
      );

      if (relevantConflicts.length > 0) {
        errors.push('משבצת הזמן מתנגשת עם שיעור קיים');
      }
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const endTime = calculateEndTimeFromDuration(formData.startTime, formData.duration);
      
      if (editingSlot) {
        // Update existing slot
        const updateData: UpdateScheduleSlotRequest = {
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
          isRecurring: formData.isRecurring,
        };
        
        await updateTimeSlot(editingSlot.id, updateData);
      } else {
        // Create new slot
        const createData: CreateScheduleSlotRequest = {
          teacherId,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime,
          location: formData.location || undefined,
          notes: formData.notes || undefined,
          isRecurring: formData.isRecurring,
        };
        
        await createTimeSlot(teacherId, createData);
      }
      
      setShowCreateForm(false);
      setEditingSlot(null);
    } catch (err) {
      console.error('Failed to save slot:', err);
      setFormErrors(['שגיאה בשמירת השיעור']);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowCreateForm(false);
    setEditingSlot(null);
    setFormErrors([]);
  };

  // Get filtered slots for display
  const getFilteredSlots = () => {
    if (!currentTeacherSchedule) return [];
    
    const allSlots = Object.values(currentTeacherSchedule).flat();
    
    if (selectedDay !== null) {
      return allSlots.filter(slot => slot.dayOfWeek === selectedDay);
    }
    
    return allSlots;
  };

  // Render slot card
  const renderSlotCard = (slot: ScheduleSlot) => {
    const isSelected = selectedSlot?.id === slot.id;
    const hasConflict = conflicts.some(conflict => 
      (typeof conflict.slotA === 'string' ? conflict.slotA === slot.id : conflict.slotA.id === slot.id) || 
      (conflict.slotB && (typeof conflict.slotB === 'string' ? conflict.slotB === slot.id : conflict.slotB.id === slot.id))
    );

    return (
      <div
        key={slot.id}
        className={`
          schedule-slot-card 
          ${isSelected ? 'selected' : ''}
          ${hasConflict ? 'conflict' : ''}
          ${slot.studentId ? 'occupied' : 'available'}
        `}
        onClick={() => setSelectedSlot(slot)}
      >
        <div className="slot-header">
          <div className="slot-time">
            <Clock size={14} />
            <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
          </div>
          <div className="slot-actions">
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSlot(slot);
                  }}
                  title="ערוך שיעור"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSlot(slot);
                  }}
                  title="מחק שיעור"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {slot.studentId ? (
          <div className="slot-student">
            <User size={14} />
            <span>{slot.studentName || 'תלמיד לא ידוע'}</span>
          </div>
        ) : (
          <div className="slot-available">
            <CheckCircle size={14} color="green" />
            <span>זמין</span>
          </div>
        )}

        {slot.location && (
          <div className="slot-location">
            <MapPin size={14} />
            <span>{slot.location}</span>
          </div>
        )}

        {slot.notes && (
          <div className="slot-notes">
            <span title={slot.notes}>
              {slot.notes.length > 30 ? `${slot.notes.substring(0, 30)}...` : slot.notes}
            </span>
          </div>
        )}

        {hasConflict && (
          <div className="slot-conflict">
            <AlertCircle size={14} color="red" />
            <span>התנגשות</span>
          </div>
        )}
      </div>
    );
  };

  // Render weekly view
  const renderWeeklyView = () => {
    if (!currentTeacherSchedule) return null;

    const slotsByDay = groupSlotsByDay(Object.values(currentTeacherSchedule).flat());

    return (
      <div className="weekly-schedule-view">
        {getHebrewDaysInOrder().map((hebrewDay, index) => {
          const daySlots = slotsByDay[index] || [];
          
          return (
            <div key={index} className="day-column">
              <div className="day-header">
                <h4>{hebrewDay}</h4>
                <span className="slot-count">({daySlots.length})</span>
                {!readOnly && (
                  <button
                    type="button"
                    className="add-slot-btn"
                    onClick={() => {
                      setSelectedDay(index);
                      handleCreateSlot();
                    }}
                    title="הוסף שיעור"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              
              <div className="day-slots">
                {daySlots.length === 0 ? (
                  <div className="no-slots">אין שיעורים</div>
                ) : (
                  daySlots.map(renderSlotCard)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render list view
  const renderListView = () => {
    const filteredSlots = getFilteredSlots();
    
    if (filteredSlots.length === 0) {
      return (
        <div className="no-slots-message">
          <Calendar size={48} color="#6c757d" />
          <h4>אין שיעורים</h4>
          <p>עדיין לא הוגדרו שיעורים למורה זה</p>
        </div>
      );
    }

    return (
      <div className="schedule-list-view">
        {filteredSlots.map(renderSlotCard)}
      </div>
    );
  };

  // Render form modal
  const renderFormModal = () => {
    if (!showCreateForm) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content schedule-form-modal">
          <div className="modal-header">
            <h3>{editingSlot ? 'עריכת שיעור' : 'הוספת שיעור חדש'}</h3>
            <button type="button" onClick={handleFormCancel} className="close-btn">
              ×
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="schedule-slot-form">
            {/* Display form errors */}
            {formErrors.length > 0 && (
              <div className="form-errors">
                {formErrors.map((error, index) => (
                  <div key={index} className="error-message">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dayOfWeek">יום השבוע</label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({...formData, dayOfWeek: Number(e.target.value)})}
                  className="form-select"
                >
                  {getHebrewDaysInOrder().map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="startTime">שעת התחלה</label>
                <select
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="form-select"
                >
                  {generateTimeSlotOptions(8, 20, 15).map(time => (
                    <option key={time} value={time}>{formatTime(time)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="duration">משך השיעור (דקות)</label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                  className="form-select"
                >
                  <option value={30}>30 דקות</option>
                  <option value={45}>45 דקות</option>
                  <option value={60}>60 דקות</option>
                  <option value={90}>90 דקות</option>
                  <option value={120}>120 דקות</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">מיקום (אופציונלי)</label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="form-input"
                  placeholder="חדר, בניין, כתובת..."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">הערות (אופציונלי)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="form-textarea"
                rows={3}
                placeholder="הערות נוספות על השיעור..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                />
                <span>שיעור קבוע (חוזר כל שבוע)</span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="save-btn"
                disabled={isCreatingSlot || isUpdatingSlot}
              >
                {isCreatingSlot || isUpdatingSlot ? 'שומר...' : 'שמור'}
              </button>
              <button
                type="button"
                onClick={handleFormCancel}
                className="cancel-btn"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoadingTeacherSchedule) {
    return (
      <div className="schedule-loading">
        <div className="loading-spinner"></div>
        <span>טוען מערכת שעות...</span>
      </div>
    );
  }

  return (
    <div className={`teacher-schedule-management ${className}`}>
      {/* Header */}
      <div className="schedule-header">
        <div className="header-info">
          <h3>מערכת שעות - {teacherName}</h3>
          {currentTeacherScheduleMetadata && (
            <div className="schedule-stats">
              <span>סה"כ שיעורים: {currentTeacherScheduleMetadata.totalSlots}</span>
              <span>תפוסים: {currentTeacherScheduleMetadata.occupiedSlots}</span>
              <span>זמינים: {currentTeacherScheduleMetadata.availableSlots}</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          <div className="view-controls">
            <button
              type="button"
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              <Calendar size={16} />
              שבועי
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              רשימה
            </button>
          </div>

          {!readOnly && (
            <button
              type="button"
              className="add-slot-btn primary"
              onClick={handleCreateSlot}
            >
              <Plus size={16} />
              הוסף שיעור
            </button>
          )}
        </div>
      </div>

      {/* Conflicts display */}
      {conflicts.length > 0 && (
        <div className="schedule-conflicts">
          <AlertCircle size={16} color="red" />
          <span>זוהו {conflicts.length} התנגשויות במערכת השעות</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="schedule-error">
          <AlertCircle size={16} color="red" />
          <span>{error}</span>
        </div>
      )}

      {/* Day filter for list view */}
      {viewMode === 'list' && (
        <div className="day-filter">
          <select
            value={selectedDay || ''}
            onChange={(e) => setSelectedDay(e.target.value ? Number(e.target.value) : null)}
            className="day-filter-select"
          >
            <option value="">כל הימים</option>
            {getHebrewDaysInOrder().map((day, index) => (
              <option key={index} value={index}>{day}</option>
            ))}
          </select>
        </div>
      )}

      {/* Schedule display */}
      <div className="schedule-content">
        {viewMode === 'week' ? renderWeeklyView() : renderListView()}
      </div>

      {/* Form modal */}
      {renderFormModal()}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteSlot}
        title="מחיקת שיעור"
        message={`האם אתה בטוח שברצונך למחוק את השיעור ביום ${slotToDelete ? formatDayOfWeek(slotToDelete.dayOfWeek, 'medium') : ''} בשעה ${slotToDelete ? formatTime(slotToDelete.startTime) : ''}?`}
        confirmText="מחק"
        cancelText="ביטול"
        type="danger"
      />
    </div>
  );
}

export default TeacherScheduleManagement;