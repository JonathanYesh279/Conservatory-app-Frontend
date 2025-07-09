// src/cmps/StudentForm/RealScheduleTeacherAssignment.tsx
// Improved teacher assignment component that uses real schedule integration

import React, { useState, useEffect } from 'react';
import { User, Calendar, Trash2, AlertCircle, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useFormikContext } from 'formik';
import { StudentFormData } from '../../constants/formConstants';
import { useTeacherStore } from '../../store/teacherStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  ScheduleSlot,
  TeacherAssignmentFormData,
  AssignStudentRequest,
  AvailableSlot,
  SlotSearchCriteria,
  LessonDurationMinutes,
} from '../../types/schedule';
import {
  transformSlotToTeacherAssignment,
  numericDayToHebrew,
} from '../../utils/scheduleTransformations';
import {
  formatDayOfWeek,
  formatTime,
} from '../../utils/scheduleUtils';
import {
  canAssignStudentToSlot,
  validateTeacherAssignment,
} from '../../utils/scheduleValidation';

export interface RealScheduleTeacherAssignmentProps {
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

export function RealScheduleTeacherAssignment({
  newTeacherInfo,
}: RealScheduleTeacherAssignmentProps) {
  // Get Formik context for form operations
  const { values, setFieldValue, errors, touched, isSubmitting } =
    useFormikContext<StudentFormData>();

  // Get stores
  const {
    teachers,
    loadTeachers,
    isLoading: isLoadingTeachers,
  } = useTeacherStore();

  const {
    availableSlots,
    loadAvailableSlots,
    assignStudent,
    removeStudent,
    isLoadingAvailableSlots,
    isAssigningStudent,
    error: scheduleError,
    clearErrors,
  } = useScheduleStore();

  // State for UI
  const [showTeacherSelect, setShowTeacherSelect] = useState(values.teacherIds.length === 0);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check for validation errors
  const hasErrors = touched.teacherAssignments && errors.teacherAssignments;

  // Load required teachers if they're not already loaded
  useEffect(() => {
    const loadRequiredTeachers = async () => {
      if (values.teacherIds?.length > 0 && teachers.length === 0) {
        console.log('Loading teachers for IDs:', values.teacherIds);
        try {
          await loadTeachers();
        } catch (err) {
          console.error('Failed to load required teachers:', err);
        }
      }
    };

    loadRequiredTeachers();
  }, [values.teacherIds, teachers.length, loadTeachers]);

  // Clear schedule errors when component mounts
  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Handle teacher selection
  const handleTeacherChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = e.target.value;
    setSelectedTeacherId(teacherId);
    setSelectedSlots(new Set());
    setValidationErrors([]);
    
    if (teacherId) {
      try {
        console.log('Loading available slots for teacher ID:', teacherId);
        await loadAvailableSlots(teacherId);
      } catch (err) {
        console.error('Failed to load available slots:', err);
        setValidationErrors(['שגיאה בטעינת השעות הזמינות של המורה']);
      }
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slotId: string) => {
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slotId)) {
        newSet.delete(slotId);
      } else {
        newSet.add(slotId);
      }
      return newSet;
    });
  };

  // Validate selected slots
  const validateSelectedSlots = (): boolean => {
    setValidationErrors([]);
    
    if (selectedSlots.size === 0) {
      setValidationErrors(['יש לבחור לפחות משבצת זמן אחת']);
      return false;
    }

    const errors: string[] = [];
    const slotsToValidate = availableSlots.filter(slot => selectedSlots.has(slot.id));
    
    // Get student's existing schedule for conflict detection
    const existingAssignments = values.teacherAssignments || [];
    const existingSlots: ScheduleSlot[] = existingAssignments.map(assignment => ({
      id: assignment.scheduleSlotId || `temp-${assignment.teacherId}-${assignment.day}-${assignment.time}`,
      teacherId: assignment.teacherId,
      dayOfWeek: assignment.day === 'ראשון' ? 0 : 
                  assignment.day === 'שני' ? 1 :
                  assignment.day === 'שלישי' ? 2 :
                  assignment.day === 'רביעי' ? 3 :
                  assignment.day === 'חמישי' ? 4 :
                  assignment.day === 'שישי' ? 5 : 6,
      startTime: assignment.time,
      endTime: '', // Will be calculated
      isRecurring: true,
      isActive: true,
    }));

    slotsToValidate.forEach(slot => {
      const validation = canAssignStudentToSlot(slot, existingSlots);
      if (!validation.canAssign && validation.reason) {
        errors.push(`${formatDayOfWeek(slot.dayOfWeek, 'medium')} ${formatTime(slot.startTime)}: ${validation.reason}`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    return true;
  };

  // Assign selected slots to student
  const handleAssignSlots = async () => {
    if (!validateSelectedSlots() || !selectedTeacherId) return;
    
    try {
      const slotsToAssign = availableSlots.filter(slot => selectedSlots.has(slot.id));
      const assignments: AssignStudentRequest[] = slotsToAssign.map(slot => ({
        scheduleSlotId: slot.id,
        studentId: values._id || 'new-student', // Handle new students
      }));

      // Assign slots via the schedule service
      for (const assignment of assignments) {
        await assignStudent(assignment);
      }

      // Update form state with new assignments
      const newAssignments = slotsToAssign.map(slot => 
        transformSlotToTeacherAssignment(slot)
      );

      // Add to existing assignments
      setFieldValue('teacherAssignments', [
        ...values.teacherAssignments,
        ...newAssignments,
      ]);

      // Add teacher to teacherIds if not already there
      if (!values.teacherIds.includes(selectedTeacherId)) {
        setFieldValue('teacherIds', [...values.teacherIds, selectedTeacherId]);
      }

      // Reset UI state
      setSelectedTeacherId('');
      setSelectedSlots(new Set());
      setShowTeacherSelect(false);
      setValidationErrors([]);
      
    } catch (err) {
      console.error('Failed to assign slots:', err);
      setValidationErrors(['שגיאה בשיוך השיעורים']);
    }
  };

  // Initiate assignment removal
  const initiateRemoveAssignment = (assignmentId: string) => {
    setAssignmentToRemove(assignmentId);
    setConfirmDialogOpen(true);
  };

  // Confirm removal of assignment
  const confirmRemoveAssignment = async () => {
    if (!assignmentToRemove) {
      setConfirmDialogOpen(false);
      return;
    }

    try {
      // Find the assignment to remove
      const assignmentIndex = values.teacherAssignments.findIndex(
        a => a.scheduleSlotId === assignmentToRemove
      );

      if (assignmentIndex === -1) {
        setConfirmDialogOpen(false);
        return;
      }

      const assignment = values.teacherAssignments[assignmentIndex];
      
      // Remove student from schedule slot if it has a real schedule slot ID
      if (assignment.scheduleSlotId) {
        await removeStudent(assignment.scheduleSlotId);
      }

      // Remove from form state
      const updatedAssignments = [...values.teacherAssignments];
      updatedAssignments.splice(assignmentIndex, 1);
      setFieldValue('teacherAssignments', updatedAssignments);

      // Check if teacher has any remaining assignments
      const hasRemainingAssignments = updatedAssignments.some(
        a => a.teacherId === assignment.teacherId
      );

      // If no remaining assignments, remove teacher from teacherIds
      if (!hasRemainingAssignments) {
        const updatedTeacherIds = values.teacherIds.filter(id => id !== assignment.teacherId);
        setFieldValue('teacherIds', updatedTeacherIds);
      }

      setConfirmDialogOpen(false);
      setAssignmentToRemove('');
      
    } catch (err) {
      console.error('Failed to remove assignment:', err);
      setValidationErrors(['שגיאה בהסרת השיוך']);
    }
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    if (teacherId === 'new-teacher' && newTeacherInfo) {
      return `${newTeacherInfo.fullName} ${
        newTeacherInfo.instrument ? `(${newTeacherInfo.instrument})` : ''
      } (המורה החדש)`;
    }

    const teacher = teachers.find((t) => t._id === teacherId);
    return teacher
      ? `${teacher.personalInfo.fullName} ${
          teacher.professionalInfo?.instrument
            ? `(${teacher.professionalInfo.instrument})`
            : ''
        }`
      : `מורה (${teacherId.substring(0, 6)}...)`;
  };

  // Group assignments by teacher for display
  const assignmentsByTeacher: Record<string, typeof values.teacherAssignments> = {};
  
  values.teacherAssignments.forEach(assignment => {
    if (!assignmentsByTeacher[assignment.teacherId]) {
      assignmentsByTeacher[assignment.teacherId] = [];
    }
    assignmentsByTeacher[assignment.teacherId].push(assignment);
  });

  return (
    <div className="form-section teacher-assignment-section">
      <h3>
        שיוך מורה (מערכת שעות אמיתית)
        {values.teacherIds.length > 0 ? ` (${values.teacherIds.length})` : ''}
      </h3>

      {/* Display validation errors */}
      {(hasErrors && typeof errors.teacherAssignments === 'string') && (
        <div className="form-error-message">
          <AlertCircle size={16} />
          <span>{errors.teacherAssignments}</span>
        </div>
      )}

      {/* Display schedule errors */}
      {scheduleError && (
        <div className="form-error-message">
          <AlertCircle size={16} />
          <span>{scheduleError}</span>
        </div>
      )}

      {/* Display validation errors */}
      {validationErrors.length > 0 && (
        <div className="form-error-message">
          <AlertCircle size={16} />
          <div>
            {validationErrors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        </div>
      )}

      {/* Display current teacher assignments */}
      {Object.keys(assignmentsByTeacher).length > 0 && (
        <div className="assigned-teachers-list">
          {Object.entries(assignmentsByTeacher).map(([teacherId, assignments]) => (
            <div key={teacherId} className="teacher-assignment-item">
              <div className="instrument-card">
                <div className="instrument-header">
                  <div className="instrument-info">
                    <div className="instrument-name-wrapper">
                      <div className="instrument-name">
                        <User size={16} />
                        <span>{getTeacherName(teacherId)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lessons-list">
                  {assignments.map((assignment) => (
                    <div 
                      key={assignment.scheduleSlotId || `${assignment.teacherId}-${assignment.day}-${assignment.time}`} 
                      className="lesson-item"
                    >
                      <div className="lesson-info">
                        <Calendar size={14} />
                        <span>{assignment.day}</span>
                      </div>
                      <div className="lesson-info">
                        <Clock size={14} />
                        <span>{assignment.time}</span>
                      </div>
                      <div className="lesson-info">
                        <span>{assignment.duration} דקות</span>
                      </div>
                      {assignment.location && (
                        <div className="lesson-info">
                          <MapPin size={14} />
                          <span>{assignment.location}</span>
                        </div>
                      )}
                      {assignment.scheduleSlotId && (
                        <div className="lesson-info">
                          <CheckCircle size={14} color="green" />
                          <span>משוייך</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => initiateRemoveAssignment(assignment.scheduleSlotId || '')}
                        aria-label="הסר שיעור"
                        disabled={isSubmitting || isAssigningStudent}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher selection */}
      {showTeacherSelect && (
        <div className="teacher-selection-panel">
          <div className="form-group">
            <label htmlFor="teacherSelect" className="required-field">בחירת מורה</label>
            <select
              id="teacherSelect"
              className="form-select"
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              disabled={isLoadingTeachers || isSubmitting}
            >
              <option value="">בחר מורה</option>
              {newTeacherInfo && (
                <option value="new-teacher">
                  {newTeacherInfo.fullName}{' '}
                  {newTeacherInfo.instrument
                    ? `(${newTeacherInfo.instrument})`
                    : ''}{' '}
                  (המורה החדש)
                </option>
              )}
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.personalInfo.fullName}{' '}
                  {teacher.professionalInfo?.instrument
                    ? `(${teacher.professionalInfo.instrument})`
                    : ''}
                </option>
              ))}
            </select>
            {isLoadingTeachers && (
              <div className="loading-indicator">טוען מורים...</div>
            )}
          </div>
        </div>
      )}

      {/* Available slots section */}
      {selectedTeacherId && (
        <div className="available-slots-section">
          <h4>שעות זמינות עבור {getTeacherName(selectedTeacherId)}</h4>
          
          {isLoadingAvailableSlots ? (
            <div className="loading-indicator">טוען שעות זמינות...</div>
          ) : availableSlots.length === 0 ? (
            <div className="no-slots-message">
              <AlertCircle size={16} />
              <span>אין שעות זמינות למורה זה. יש לפנות למורה להגדרת שעות פנויות.</span>
            </div>
          ) : (
            <div className="slots-container">
              {availableSlots.map(slot => (
                <div 
                  key={slot.id}
                  className={`slot-item ${selectedSlots.has(slot.id) ? 'selected' : ''} ${slot.studentId ? 'occupied' : ''}`}
                  onClick={() => !slot.studentId && handleSlotSelect(slot.id)}
                  style={{ cursor: slot.studentId ? 'not-allowed' : 'pointer' }}
                >
                  <div className="slot-day">{formatDayOfWeek(slot.dayOfWeek, 'medium')}</div>
                  <div className="slot-time">
                    <Clock size={14} />
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  {slot.location && (
                    <div className="slot-location">
                      <MapPin size={14} />
                      {slot.location}
                    </div>
                  )}
                  {slot.studentId ? (
                    <div className="slot-occupied">תפוס</div>
                  ) : selectedSlots.has(slot.id) ? (
                    <div className="slot-selected-indicator">✓ נבחר</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {availableSlots.length > 0 && selectedSlots.size > 0 && (
            <div className="slot-actions">
              <button
                type="button"
                className="assign-slots-btn"
                onClick={handleAssignSlots}
                disabled={selectedSlots.size === 0 || isSubmitting || isAssigningStudent}
              >
                {isAssigningStudent ? 'משייך...' : `שייך ${selectedSlots.size} שיעורים נבחרים`}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setSelectedSlots(new Set());
                  setValidationErrors([]);
                }}
                disabled={isAssigningStudent}
              >
                בטל בחירה
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add teacher button */}
      {!showTeacherSelect && !selectedTeacherId && (
        <button
          type="button"
          className="add-teacher-btn"
          onClick={() => setShowTeacherSelect(true)}
          disabled={isSubmitting}
        >
          <Calendar size={16} />
          {Object.keys(assignmentsByTeacher).length > 0
            ? 'הוסף מורה נוסף'
            : 'הוסף מורה'}
        </button>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmRemoveAssignment}
        title="הסרת שיעור"
        message="האם אתה בטוח שברצונך להסיר את השיעור הזה? פעולה זו תשחרר את משבצת הזמן במערכת השעות."
        confirmText="הסר"
        cancelText="ביטול"
        type="warning"
      />
    </div>
  );
}

export default RealScheduleTeacherAssignment;