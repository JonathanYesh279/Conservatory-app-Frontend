// src/cmps/StudentForm/TeacherAssignmentSection.tsx
import React, { useState, useEffect } from 'react';
import { User, Trash2, X, AlertCircle } from 'lucide-react';
import { useFormikContext } from 'formik';
import {
  StudentFormData,
  DAYS_OF_WEEK,
  LESSON_DURATIONS,
} from '../../constants/formConstants';
import { useTeacherStore } from '../../store/teacherStore';
import { ConfirmDialog } from '../ConfirmDialog';

export interface TeacherAssignmentSectionProps {
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

export function TeacherAssignmentSection({
  newTeacherInfo,
}: TeacherAssignmentSectionProps) {
  // Get Formik context for form operations
  const { values, setFieldValue, errors, touched, isSubmitting } =
    useFormikContext<StudentFormData>();

  // Get teachers from store
  const {
    teachers,
    loadTeachers,
    isLoading: isLoadingTeachers,
  } = useTeacherStore();

  // State for adding a new teacher
  const [showTeacherSelect, setShowTeacherSelect] = useState(
    values.teacherAssignments.length === 0
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // State for schedule details
  const [scheduleItems, setScheduleItems] = useState([
    {
      teacherId: '',
      day: DAYS_OF_WEEK[0],
      time: '08:00',
      duration: 45,
    },
  ]);

  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState({
    teacherId: '',
    day: '',
    time: '',
  });

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

  // Group existing assignments by teacher for display
  const teacherAssignmentsByTeacher: Record<
    string,
    (typeof values.teacherAssignments)[0][]
  > = {};
  values.teacherAssignments.forEach((assignment) => {
    if (!teacherAssignmentsByTeacher[assignment.teacherId]) {
      teacherAssignmentsByTeacher[assignment.teacherId] = [];
    }
    teacherAssignmentsByTeacher[assignment.teacherId].push(assignment);
  });

  // If no assignments but we have teacherIds, create dummy assignments for display
  useEffect(() => {
    if (
      Object.keys(teacherAssignmentsByTeacher).length === 0 &&
      values.teacherIds &&
      values.teacherIds.length > 0
    ) {
      // Create a default assignment for each teacherId if none exists
      const newAssignments = values.teacherIds.map((teacherId) => ({
        teacherId,
        day: DAYS_OF_WEEK[0],
        time: '08:00',
        duration: 45,
      }));

      if (newAssignments.length > 0) {
        setFieldValue('teacherAssignments', newAssignments);
      }
    }
  }, [values.teacherIds, teacherAssignmentsByTeacher, setFieldValue]);

  // Handle teacher selection
  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = e.target.value;
    setSelectedTeacherId(teacherId);

    // Add initial schedule item for this teacher
    if (teacherId) {
      setScheduleItems([
        {
          teacherId,
          day: DAYS_OF_WEEK[0],
          time: '08:00',
          duration: 45,
        },
      ]);
    } else {
      setScheduleItems([
        {
          teacherId: '',
          day: DAYS_OF_WEEK[0],
          time: '08:00',
          duration: 45,
        },
      ]);
    }
  };

  // Handle schedule detail changes
  const handleScheduleChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setScheduleItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: field === 'duration' ? Number(value) : value,
        };
      }
      return updated;
    });
  };

  // Add another lesson time for the current teacher
  const handleAddLesson = () => {
    if (!selectedTeacherId) return;

    setScheduleItems((prev) => [
      ...prev,
      {
        teacherId: selectedTeacherId,
        day: DAYS_OF_WEEK[0],
        time: '08:00',
        duration: 45,
      },
    ]);
  };

  // Remove a lesson time from the schedule items
  const handleRemoveLesson = (index: number) => {
    setScheduleItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Save all lessons for current teacher to Formik
  const handleSaveTeacherLessons = () => {
    // Get valid schedule items
    const validItems = scheduleItems.filter((item) => item.teacherId);

    if (validItems.length === 0) return;

    // Add to teacherAssignments
    setFieldValue('teacherAssignments', [
      ...values.teacherAssignments,
      ...validItems,
    ]);

    // Add to teacherIds if not already there
    const teacherId = validItems[0].teacherId;
    if (!values.teacherIds.includes(teacherId)) {
      setFieldValue('teacherIds', [...values.teacherIds, teacherId]);
    }

    // Reset states to add another teacher
    setSelectedTeacherId('');
    setScheduleItems([
      {
        teacherId: '',
        day: DAYS_OF_WEEK[0],
        time: '08:00',
        duration: 45,
      },
    ]);
    setShowTeacherSelect(false);
  };

  // Add a different teacher
  const handleAddTeacher = () => {
    setShowTeacherSelect(true);
    setSelectedTeacherId('');
    setScheduleItems([
      {
        teacherId: '',
        day: DAYS_OF_WEEK[0],
        time: '08:00',
        duration: 45,
      },
    ]);
  };

  // Start the assignment removal process with confirmation
  const initiateRemoveAssignment = (
    teacherId: string,
    day: string,
    time: string
  ) => {
    setAssignmentToRemove({ teacherId, day, time });
    setIsConfirmDialogOpen(true);
  };

  // Confirm removing the assignment
  const confirmRemoveAssignment = () => {
    if (assignmentToRemove.teacherId) {
      // Filter out the assignment to remove
      const updatedAssignments = values.teacherAssignments.filter(
        (assignment) =>
          !(
            assignment.teacherId === assignmentToRemove.teacherId &&
            assignment.day === assignmentToRemove.day &&
            assignment.time === assignmentToRemove.time
          )
      );

      setFieldValue('teacherAssignments', updatedAssignments);

      // Check if all assignments for this teacher are gone
      const remainingTeacherAssignments = updatedAssignments.filter(
        (assignment) => assignment.teacherId === assignmentToRemove.teacherId
      );

      // If no more assignments for this teacher, remove from teacherIds
      if (remainingTeacherAssignments.length === 0) {
        const updatedTeacherIds = values.teacherIds.filter(
          (id) => id !== assignmentToRemove.teacherId
        );
        setFieldValue('teacherIds', updatedTeacherIds);
      }
    }
    setIsConfirmDialogOpen(false);
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

  // Format a time string with proper padding
  const formatTime = (time: string) => {
    return time || '--:--';
  };

  // Format duration with units
  const formatDuration = (duration: number) => {
    return `${duration} דקות`;
  };

  // Format day of week
  const formatDay = (day: string) => {
    return day || 'יום ?';
  };

  return (
    <div className='form-section teacher-assignment-section'>
      <h3>
        שיוך מורה{' '}
        {values.teacherIds.length > 0 ? `(${values.teacherIds.length})` : ''}
      </h3>

      {/* Display validation errors */}
      {hasErrors && typeof errors.teacherAssignments === 'string' && (
        <div className='form-error-message'>
          <AlertCircle size={16} />
          <span>{errors.teacherAssignments}</span>
        </div>
      )}

      {/* Display current teacher assignments if any */}
      {Object.keys(teacherAssignmentsByTeacher).length > 0 && (
        <div className='assigned-teachers-list'>
          {Object.entries(teacherAssignmentsByTeacher).map(
            ([teacherId, assignments]) => (
              <div key={teacherId} className='teacher-assignment-item'>
                {/* Teacher header - styled like instrument card */}
                <div className='instrument-card'>
                  <div className='instrument-header'>
                    <div className='instrument-info'>
                      <div className='instrument-name-wrapper'>
                        <div className='instrument-name'>
                          <User size={16} />
                          <span>{getTeacherName(teacherId)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Display lessons for this teacher */}
                  <div className='lessons-list'>
                    {assignments.map((assignment, index) => (
                      <div
                        key={`${assignment.teacherId}-${assignment.day}-${assignment.time}-${index}`}
                        className='lesson-item'
                      >
                        <div className='lesson-info'>
                          <span>{formatDay(assignment.day)}</span>
                        </div>
                        <div className='lesson-info'>
                          <span>{formatTime(assignment.time)}</span>
                        </div>
                        <div className='lesson-info'>
                          <span>{formatDuration(assignment.duration)}</span>
                        </div>
                        <button
                          type='button'
                          className='remove-btn'
                          onClick={() =>
                            initiateRemoveAssignment(
                              assignment.teacherId,
                              assignment.day,
                              assignment.time
                            )
                          }
                          aria-label='הסר שיעור'
                          disabled={isSubmitting}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Teacher Selection */}
      {showTeacherSelect && (
        <div className='teacher-selection-panel'>
          <div className='form-group'>
            <label htmlFor='teacherSelect' className='required-field'>בחירת מורה</label>
            <select
              id='teacherSelect'
              className='form-select'
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              disabled={isLoadingTeachers || isSubmitting}
            >
              <option value=''>בחר מורה</option>
              {newTeacherInfo && (
                <option value='new-teacher'>
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
              <div className='loading-indicator'>טוען מורים...</div>
            )}
          </div>
        </div>
      )}

      {/* Schedule section for selected teacher */}
      {selectedTeacherId && scheduleItems.length > 0 && (
        <div className='teacher-schedule'>
          <div className='schedule-heading'>
            <h4>מערכת שעות עבור {getTeacherName(selectedTeacherId)}</h4>
          </div>

          {scheduleItems.map((item, index) => (
            <div key={index} className='schedule-row'>
              <div className='form-row'>
                <div className='form-group day-group'>
                  <label htmlFor={`day-${index}`}>יום</label>
                  <select
                    id={`day-${index}`}
                    className='form-select'
                    value={item.day}
                    onChange={(e) =>
                      handleScheduleChange(index, 'day', e.target.value)
                    }
                    disabled={isSubmitting}
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='form-group time-group'>
                  <label htmlFor={`time-${index}`}>שעה</label>
                  <input
                    id={`time-${index}`}
                    type='time'
                    className='form-input'
                    value={item.time}
                    onChange={(e) =>
                      handleScheduleChange(index, 'time', e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className='form-group duration-group'>
                  <label htmlFor={`duration-${index}`}>משך</label>
                  <select
                    id={`duration-${index}`}
                    className='form-select'
                    value={item.duration}
                    onChange={(e) =>
                      handleScheduleChange(index, 'duration', e.target.value)
                    }
                    disabled={isSubmitting}
                  >
                    {LESSON_DURATIONS.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} דקות
                      </option>
                    ))}
                  </select>
                </div>

                {index > 0 && (
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() => handleRemoveLesson(index)}
                    aria-label='הסר שיעור'
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className='schedule-actions'>
            <button
              type='button'
              className='add-lesson-btn'
              onClick={handleAddLesson}
              disabled={isSubmitting}
            >
              הוסף שיעור נוסף
            </button>

            <button
              type='button'
              className='save-btn'
              onClick={handleSaveTeacherLessons}
              disabled={isSubmitting}
            >
              שמור שיעורים למורה
            </button>
          </div>
        </div>
      )}

      {/* Add teacher button */}
      {!showTeacherSelect && !selectedTeacherId && (
        <button
          type='button'
          className='add-teacher-btn'
          onClick={handleAddTeacher}
          disabled={isSubmitting}
        >
          <User size={16} />
          {Object.keys(teacherAssignmentsByTeacher).length > 0
            ? 'הוסף מורה נוסף'
            : 'הוסף מורה'}
        </button>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmRemoveAssignment}
        title='הסרת שיעור'
        message='האם אתה בטוח שברצונך להסיר את השיעור הזה?'
        confirmText='הסר'
        cancelText='ביטול'
        type='warning'
      />
    </div>
  );
}