// src/cmps/StudentForm/TeacherAssignmentSection.tsx
import React, { useState, useEffect } from 'react';
import { User, Trash2, UserPlus, Clock, Calendar, Plus } from 'lucide-react';
import {
  StudentFormData,
  TeacherAssignment,
  DAYS_OF_WEEK,
  LESSON_DURATIONS,
} from '../../hooks/useStudentForm';
import { useTeacherStore } from '../../store/teacherStore';
import { ConfirmDialog } from '../ConfirmDialog';

export interface TeacherAssignmentSectionProps {
  formData: StudentFormData;
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
  addTeacherAssignment: (assignment: TeacherAssignment) => void;
  removeTeacherAssignment: (
    teacherId: string,
    day: string,
    time: string
  ) => void;
  errors: Record<string, string>;
}

export function TeacherAssignmentSection({
  formData,
  newTeacherInfo,
  addTeacherAssignment,
  removeTeacherAssignment,
  errors,
}: TeacherAssignmentSectionProps) {
  // Get teachers from store
  const teacherStore = useTeacherStore();

  // State for adding a new teacher
  const [showTeacherSelect, setShowTeacherSelect] = useState(
    formData.teacherAssignments.length === 0
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

  // Load required teachers if they're not already loaded
  useEffect(() => {
    const loadRequiredTeachers = async () => {
      // If we have teacherIds but no teachers loaded, load them
      if (
        formData.teacherIds &&
        formData.teacherIds.length > 0 &&
        teacherStore.teachers.length === 0
      ) {
        console.log('Loading teachers for IDs:', formData.teacherIds);

        try {
          // First try loading all teachers
          await teacherStore.loadTeachers();

          // If specific teachers aren't loaded, load them individually
          const missingTeachers = formData.teacherIds.filter(
            (id) => !teacherStore.teachers.find((t) => t._id === id)
          );

          if (missingTeachers.length > 0) {
            console.log('Loading missing teachers:', missingTeachers);
            for (const teacherId of missingTeachers) {
              await teacherStore.loadTeacherById(teacherId);
            }
          }
        } catch (err) {
          console.error('Failed to load required teachers:', err);
        }
      }
    };

    loadRequiredTeachers();
  }, [formData.teacherIds, teacherStore]);

  // Debug teacherIds and loaded teachers
  useEffect(() => {
    console.log('TeacherAssignmentSection - teacherIds:', formData.teacherIds);
    console.log(
      'TeacherAssignmentSection - teacherAssignments:',
      formData.teacherAssignments
    );
    console.log(
      'TeacherAssignmentSection - teachers loaded:',
      teacherStore.teachers.length
    );
  }, [
    formData.teacherIds,
    formData.teacherAssignments,
    teacherStore.teachers.length,
  ]);

  // Group existing assignments by teacher for display
  const teacherAssignmentsByTeacher: Record<string, TeacherAssignment[]> = {};
  formData.teacherAssignments.forEach((assignment) => {
    if (!teacherAssignmentsByTeacher[assignment.teacherId]) {
      teacherAssignmentsByTeacher[assignment.teacherId] = [];
    }
    teacherAssignmentsByTeacher[assignment.teacherId].push(assignment);
  });

  // If no assignments but we have teacherIds, create dummy assignments for display
  // This helps when a student has teacherIds but no schedule information
  useEffect(() => {
    if (
      Object.keys(teacherAssignmentsByTeacher).length === 0 &&
      formData.teacherIds &&
      formData.teacherIds.length > 0
    ) {
      console.log(
        'Creating default assignments for teacherIds:',
        formData.teacherIds
      );

      // Create a default assignment for each teacherId if none exists
      formData.teacherIds.forEach((teacherId) => {
        if (
          !formData.teacherAssignments.some((a) => a.teacherId === teacherId)
        ) {
          addTeacherAssignment({
            teacherId,
            day: DAYS_OF_WEEK[0],
            time: '08:00',
            duration: 45,
          });
        }
      });
    }
  }, [
    formData.teacherIds,
    formData.teacherAssignments,
    addTeacherAssignment,
    teacherAssignmentsByTeacher,
  ]);

  // Handler for teacher selection
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

  // Handler for schedule detail changes
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

  // Remove a lesson time
  const handleRemoveLesson = (index: number) => {
    setScheduleItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Save all lessons for current teacher
  const handleSaveTeacherLessons = () => {
    // Add all current schedule items as assignments
    scheduleItems.forEach((item) => {
      if (item.teacherId) {
        // Use correct field names for backend
        const scheduleToSend = {
          teacherId: item.teacherId,
          day: item.day,
          time: item.time,
          duration: item.duration,
        };

        addTeacherAssignment(scheduleToSend);
      }
    });

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
      removeTeacherAssignment(
        assignmentToRemove.teacherId,
        assignmentToRemove.day,
        assignmentToRemove.time
      );
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

    const teacher = teacherStore.teachers.find((t) => t._id === teacherId);
    return teacher
      ? `${teacher.personalInfo.fullName} ${
          teacher.professionalInfo?.instrument
            ? `(${teacher.professionalInfo.instrument})`
            : ''
        }`
      : `מורה (${teacherId.substring(0, 6)}...)`;
  };

  // Get teacher instrument by ID
  const getTeacherInstrument = (teacherId: string) => {
    if (teacherId === 'new-teacher' && newTeacherInfo?.instrument) {
      return newTeacherInfo.instrument;
    }

    const teacher = teacherStore.teachers.find((t) => t._id === teacherId);
    return teacher?.professionalInfo?.instrument || '';
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
        {formData.teacherIds.length > 0
          ? `(${formData.teacherIds.length})`
          : ''}
      </h3>

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
                          <Calendar size={14} />
                          <span>{formatDay(assignment.day)}</span>
                        </div>
                        <div className='lesson-info'>
                          <Clock size={14} />
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

      {/* Display any errors */}
      {errors && errors['teacherAssignments'] && (
        <div className='form-error'>{errors['teacherAssignments']}</div>
      )}

      {/* Teacher Selection */}
      {showTeacherSelect && (
        <div className='teacher-selection-panel'>
          <div className='form-group'>
            <label htmlFor='teacherSelect'>בחירת מורה</label>
            <select
              id='teacherSelect'
              className='form-select'
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              disabled={teacherStore.isLoading}
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
              {teacherStore.teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.personalInfo.fullName}{' '}
                  {teacher.professionalInfo?.instrument
                    ? `(${teacher.professionalInfo.instrument})`
                    : ''}
                </option>
              ))}
            </select>
            {teacherStore.isLoading && (
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
            >
              <Plus size={14} />
              הוסף שיעור נוסף
            </button>

            <button
              type='button'
              className='save-btn'
              onClick={handleSaveTeacherLessons}
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
        >
          <UserPlus size={16} />
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
