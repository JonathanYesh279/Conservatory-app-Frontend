// src/cmps/StudentForm/TeacherAssignmentSection.tsx
import React, { useState } from 'react';
import {
  User,
  X,
  UserPlus,
  ChevronDown,
  Music,
  Clock,
} from 'lucide-react';
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
}: TeacherAssignmentSectionProps) {
  // Get teachers from store
  const { teachers, isLoading: isLoadingTeachers } = useTeacherStore();

  // State for adding a new teacher
  const [showTeacherSelect, setShowTeacherSelect] = useState(
    formData.teacherAssignments.length === 0
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // State for schedule details
  const [scheduleItems, setScheduleItems] = useState<
    {
      teacherId: string;
      day: string;
      time: string;
      duration: number;
    }[]
  >([]);

  // State for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<{
    teacherId: string;
    day: string;
    time: string;
  } | null>(null);

  // Group existing assignments by teacher for display
  const teacherAssignmentsByTeacher: Record<string, TeacherAssignment[]> = {};
  formData.teacherAssignments.forEach((assignment) => {
    if (!teacherAssignmentsByTeacher[assignment.teacherId]) {
      teacherAssignmentsByTeacher[assignment.teacherId] = [];
    }
    teacherAssignmentsByTeacher[assignment.teacherId].push(assignment);
  });

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
      setScheduleItems([]);
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
      updated[index] = {
        ...updated[index],
        [field]: field === 'duration' ? Number(value) : value,
      };
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
      // Use correct field names for backend
      const scheduleToSend = {
        teacherId: item.teacherId,
        day: item.day,
        time: item.time,
        duration: item.duration,
      };

      addTeacherAssignment(scheduleToSend);
    });

    // Reset states to add another teacher
    setSelectedTeacherId('');
    setScheduleItems([]);
    setShowTeacherSelect(false); // Changed from true to false to show the added teacher
  };

  // Add a different teacher
  const handleAddTeacher = () => {
    setShowTeacherSelect(true);
    setSelectedTeacherId('');
    setScheduleItems([]);
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
    if (assignmentToRemove) {
      removeTeacherAssignment(
        assignmentToRemove.teacherId,
        assignmentToRemove.day,
        assignmentToRemove.time
      );
      setAssignmentToRemove(null);
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
      : 'מורה לא ידוע';
  };

  // Get teacher instrument by ID
  const getTeacherInstrument = (teacherId: string) => {
    if (teacherId === 'new-teacher' && newTeacherInfo?.instrument) {
      return newTeacherInfo.instrument;
    }

    const teacher = teachers.find((t) => t._id === teacherId);
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
      <h3>שיוך מורה</h3>

      {/* Display current teacher assignments if any */}
      {Object.keys(teacherAssignmentsByTeacher).length > 0 && (
        <div className='assigned-teachers-list'>
          {Object.entries(teacherAssignmentsByTeacher).map(
            ([teacherId, assignments]) => (
              <div key={teacherId} className='teacher-assignment-item'>
                {/* Teacher header - similar to instrument card */}
                <div className='instrument-card'>
                  <div className='instrument-header'>
                    <div className='instrument-info'>
                      <div className='instrument-name-wrapper'>
                        <div className='instrument-name'>
                          <User size={16} />
                          <span>{getTeacherName(teacherId)}</span>
                        </div>
                        {getTeacherInstrument(teacherId) && (
                          <div className='instrument-badge'>
                            <Music size={12} />
                            <span>{getTeacherInstrument(teacherId)}</span>
                          </div>
                        )}
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
                          <Clock size={14} />
                          <span>
                            {formatDay(assignment.day)},{' '}
                            {formatTime(assignment.time)},{' '}
                            {formatDuration(assignment.duration)}
                          </span>
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
                          <X size={14} />
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
        <div className='form-group'>
          <div className='form-label'>בחירת מורה</div>
          <div className='select-wrapper'>
            <select
              className='form-select'
              value={selectedTeacherId}
              onChange={handleTeacherChange}
              disabled={isLoadingTeachers}
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
            <ChevronDown size={16} className='select-icon' />
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
                  <div className='form-label'>יום</div>
                  <div className='select-wrapper'>
                    <select
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
                    <ChevronDown size={16} className='select-icon' />
                  </div>
                </div>

                <div className='form-group time-group'>
                  <div className='form-label'>שעה</div>
                  <input
                    type='time'
                    className='form-input'
                    value={item.time}
                    onChange={(e) =>
                      handleScheduleChange(index, 'time', e.target.value)
                    }
                  />
                </div>

                <div className='form-group duration-group'>
                  <div className='form-label'>משך</div>
                  <div className='select-wrapper'>
                    <select
                      className='form-select'
                      value={item.duration}
                      onChange={(e) =>
                        handleScheduleChange(index, 'duration', e.target.value)
                      }
                    >
                      {LESSON_DURATIONS.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className='select-icon' />
                  </div>
                </div>

                {index > 0 && (
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() => handleRemoveLesson(index)}
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
      {Object.keys(teacherAssignmentsByTeacher).length > 0 &&
        !showTeacherSelect &&
        !selectedTeacherId && (
          <button
            type='button'
            className='add-teacher-btn'
            onClick={handleAddTeacher}
          >
            <UserPlus size={16} />
            הוסף מורה נוסף
          </button>
        )}

      {/* Initial state - no teachers yet */}
      {Object.keys(teacherAssignmentsByTeacher).length === 0 &&
        !showTeacherSelect &&
        !selectedTeacherId && (
          <button
            type='button'
            className='add-teacher-btn'
            onClick={handleAddTeacher}
          >
            <UserPlus size={16} />
            הוסף מורה
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
