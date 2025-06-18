import React, { useState, useEffect } from 'react';
import { User, Calendar, Trash2, AlertCircle } from 'lucide-react';
import { useFormikContext } from 'formik';
import { StudentFormData } from '../../constants/formConstants';
import { useTeacherStore } from '../../store/teacherStore';
import { useScheduleStore } from '../../store/scheduleStore';
import { ConfirmDialog } from '../ConfirmDialog';
import { ScheduleSlot } from '../../services/scheduleService';
import { formatTime, formatDayOfWeek } from '../../utils/scheduleUtils';

export interface ScheduleBasedTeacherAssignmentProps {
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

export function ScheduleBasedTeacherAssignment({
  newTeacherInfo,
}: ScheduleBasedTeacherAssignmentProps) {
  // Get Formik context for form operations
  const { values, setFieldValue, errors, touched, isSubmitting } =
    useFormikContext<StudentFormData>();

  // Get teachers from store
  const {
    teachers,
    loadTeachers,
    isLoading: isLoadingTeachers,
  } = useTeacherStore();

  // Get schedule store
  const {
    getAvailableSlots,
    isLoadingAvailableSlots,
    assignStudentToSlot,
    isAssigningStudent,
  } = useScheduleStore();

  // State for UI
  const [showTeacherSelect, setShowTeacherSelect] = useState(values.teacherIds.length === 0);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [availableSlots, setAvailableSlots] = useState<ScheduleSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState('');

  // Check for validation errors
  const hasErrors = touched.teacherAssignments && errors.teacherAssignments;

  // Load required teachers if they're not already loaded
  useEffect(() => {
    const loadRequiredTeachers = async () => {
      // If we have teacherIds but no teachers loaded, load them
      if (
        values.teacherIds &&
        values.teacherIds.length > 0 &&
        teachers.length === 0
      ) {
        console.log('Loading teachers for IDs:', values.teacherIds);

        try {
          // Load all teachers
          await loadTeachers();
        } catch (err) {
          console.error('Failed to load required teachers:', err);
        }
      }
    };

    loadRequiredTeachers();
  }, [values.teacherIds, teachers.length, loadTeachers]);

  // Handle teacher selection
  const handleTeacherChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = e.target.value;
    setSelectedTeacherId(teacherId);
    
    if (teacherId) {
      try {
        // Load available slots for this teacher
        console.log('Loading available slots for teacher ID:', teacherId);
        const slots = await getAvailableSlots(teacherId);
        console.log('Available slots received:', slots);
        
        if (slots.length === 0) {
          // If no slots are available, create a default slot
          console.log('No slots available, creating a default schedule option');
          
          // Add a default slot for each day of the week
          const defaultSlots = [];
          for (let day = 0; day < 7; day++) {
            defaultSlots.push({
              id: `default-${day}`,
              teacherId: teacherId,
              dayOfWeek: day,
              startTime: '16:00',
              endTime: '16:45',
              isRecurring: true,
              location: '',
              notes: 'Default slot'
            });
          }
          
          setAvailableSlots(defaultSlots);
        } else {
          setAvailableSlots(slots);
        }
      } catch (err) {
        console.error('Failed to load available slots:', err);
        // Create default slots on error as well
        const defaultSlots = [];
        for (let day = 0; day < 7; day++) {
          defaultSlots.push({
            id: `default-${day}`,
            teacherId: teacherId,
            dayOfWeek: day,
            startTime: '16:00',
            endTime: '16:45',
            isRecurring: true,
            location: '',
            notes: 'Default slot (error fallback)'
          });
        }
        setAvailableSlots(defaultSlots);
      }
    } else {
      setAvailableSlots([]);
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      // Toggle selection
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Assign selected slots to student
  const handleAssignSlots = async () => {
    if (selectedSlotIds.length === 0 || !selectedTeacherId) return;
    
    try {
      // Add the teacher to teacherIds if not already there
      if (!values.teacherIds.includes(selectedTeacherId)) {
        setFieldValue('teacherIds', [...values.teacherIds, selectedTeacherId]);
      }
      
      // Create assignments for Formik state
      const slotsToAssign = availableSlots.filter(slot => 
        selectedSlotIds.includes(slot.id)
      );
      
      const newAssignments = slotsToAssign.map(slot => ({
        teacherId: selectedTeacherId,
        scheduleSlotId: slot.id,
        day: formatDayOfWeek(slot.dayOfWeek, 'medium'),
        time: slot.startTime,
        duration: Math.round((
          new Date(`2000-01-01T${slot.endTime}:00`).getTime() -
          new Date(`2000-01-01T${slot.startTime}:00`).getTime()
        ) / 60000) // Convert to minutes
      }));
      
      // Add to existing assignments
      setFieldValue('teacherAssignments', [
        ...values.teacherAssignments,
        ...newAssignments
      ]);
      
      // Reset selection state
      setSelectedTeacherId('');
      setAvailableSlots([]);
      setSelectedSlotIds([]);
      setShowTeacherSelect(false);
      
    } catch (err) {
      console.error('Failed to assign slots:', err);
    }
  };

  // Initiate assignment removal
  const initiateRemoveAssignment = (assignmentId: string) => {
    setAssignmentToRemove(assignmentId);
    setConfirmDialogOpen(true);
  };

  // Confirm removal of assignment
  const confirmRemoveAssignment = () => {
    if (!assignmentToRemove) {
      setConfirmDialogOpen(false);
      return;
    }

    // Find the assignment to remove
    const assignmentIndex = values.teacherAssignments.findIndex(
      a => a.scheduleSlotId === assignmentToRemove
    );

    if (assignmentIndex === -1) {
      setConfirmDialogOpen(false);
      return;
    }

    const assignment = values.teacherAssignments[assignmentIndex];
    const teacherId = assignment.teacherId;

    // Remove the assignment
    const updatedAssignments = [...values.teacherAssignments];
    updatedAssignments.splice(assignmentIndex, 1);
    setFieldValue('teacherAssignments', updatedAssignments);

    // Check if teacher has any remaining assignments
    const hasRemainingAssignments = updatedAssignments.some(
      a => a.teacherId === teacherId
    );

    // If no remaining assignments, remove teacher from teacherIds
    if (!hasRemainingAssignments) {
      const updatedTeacherIds = values.teacherIds.filter(id => id !== teacherId);
      setFieldValue('teacherIds', updatedTeacherIds);
    }

    setConfirmDialogOpen(false);
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
        שיוך מורה{' '}
        {values.teacherIds.length > 0 ? `(${values.teacherIds.length})` : ''}
      </h3>

      {/* Display validation errors */}
      {hasErrors && typeof errors.teacherAssignments === 'string' && (
        <div className="form-error-message">
          <AlertCircle size={16} />
          <span>{errors.teacherAssignments}</span>
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
                        <span>{assignment.day}</span>
                      </div>
                      <div className="lesson-info">
                        <span>{assignment.time}</span>
                      </div>
                      <div className="lesson-info">
                        <span>{assignment.duration} דקות</span>
                      </div>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => initiateRemoveAssignment(assignment.scheduleSlotId || '')}
                        aria-label="הסר שיעור"
                        disabled={isSubmitting}
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
              אין שעות זמינות למורה זה. יש לפנות למורה להגדרת שעות פנויות.
            </div>
          ) : (
            <div className="slots-container">
              {availableSlots.map(slot => (
                <div 
                  key={slot.id}
                  className={`slot-item ${selectedSlotIds.includes(slot.id) ? 'selected' : ''}`}
                  onClick={() => handleSlotSelect(slot.id)}
                >
                  <div className="slot-day">{formatDayOfWeek(slot.dayOfWeek, 'medium')}</div>
                  <div className="slot-time">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </div>
                  {slot.location && (
                    <div className="slot-location">{slot.location}</div>
                  )}
                  {selectedSlotIds.includes(slot.id) && (
                    <div className="slot-selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {availableSlots.length > 0 && (
            <div className="slot-actions">
              <button
                type="button"
                className="assign-slots-btn"
                onClick={handleAssignSlots}
                disabled={selectedSlotIds.length === 0 || isSubmitting}
              >
                שייך {selectedSlotIds.length} שיעורים נבחרים
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
        message="האם אתה בטוח שברצונך להסיר את השיעור הזה?"
        confirmText="הסר"
        cancelText="ביטול"
        type="warning"
      />
    </div>
  );
}

export default ScheduleBasedTeacherAssignment;