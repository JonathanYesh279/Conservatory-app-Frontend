// src/cmps/StudentDetails/sections/TeachersSection.tsx
import { ChevronDown, ChevronUp, User, RefreshCw, Music, Clock, Calendar } from 'lucide-react';
import { Teacher } from '../../../services/teacherService';
import { useState, useEffect, useRef } from 'react';

interface TeachersSectionProps {
  teachersData: {
    teachers: Teacher[];
    assignments: any[]; // Keep for backward compatibility but won't use schedule data
  };
  teachersLoading: boolean;
  teachersError: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onTeacherClick: (teacherId: string) => void;
  onRetryLoadTeachers: () => void;
  // Add direct access to student teacherIds
  studentTeacherIds?: string[];
  // Add teacher assignments to show lesson details
  teacherAssignments?: Array<{
    teacherId: string;
    scheduleSlotId: string;
    day: string;
    time: string;
    duration: number;
  }>;
}

export function TeachersSection({
  teachersData,
  teachersLoading,
  teachersError,
  isOpen,
  onToggle,
  onTeacherClick,
  onRetryLoadTeachers,
  studentTeacherIds = [],
  teacherAssignments = [],
}: TeachersSectionProps) {
  // Debug output removed for production
  // Use a ref to track if placeholders have been created
  const placeholdersCreated = useRef(false);

  // Create a temporary placeholder for each teacher ID if not loaded yet
  const [placeholderTeachers, setPlaceholderTeachers] = useState<any[]>([]);

  // Check if we have teachers or at least teacher IDs
  const hasTeachers =
    (teachersData?.teachers && teachersData.teachers.length > 0) ||
    (studentTeacherIds && studentTeacherIds.length > 0);

  // Create placeholder data when student loads but teachers haven't loaded yet
  useEffect(() => {
    if (
      studentTeacherIds &&
      studentTeacherIds.length > 0 &&
      (!teachersData.teachers || teachersData.teachers.length === 0) &&
      !teachersLoading &&
      !placeholdersCreated.current
    ) {
      // Create temporary placeholders based on IDs
      const placeholders = studentTeacherIds.map((id) => ({
        _id: id,
        teacherId: id,
        personalInfo: {
          fullName: `מורה ${id.slice(-4)}`,
        },
        professionalInfo: {
          instrument: '',
        },
        isPlaceholder: true,
      }));

      setPlaceholderTeachers(placeholders);
      placeholdersCreated.current = true; // Mark that we've created placeholders
    }
  }, [studentTeacherIds, teachersData.teachers, teachersLoading]);

  // Reset placeholder flag when component unmounts or key dependencies change
  useEffect(() => {
    return () => {
      placeholdersCreated.current = false;
    };
  }, [studentTeacherIds.join(',')]); // Only reset when studentTeacherIds change

  // Function to generate teacher initials
  const getTeacherInitials = (fullName: string) => {
    if (!fullName) return 'מ';
    return fullName
      .split(' ')
      .map((part: string) => part[0] || '')
      .join('')
      .substring(0, 2);
  };

  // Function to get teacher assignments
  const getTeacherAssignments = (teacherId: string) => {
    return teacherAssignments.filter(assignment => assignment.teacherId === teacherId);
  };

  // Function to calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Function to format lesson time with duration
  const formatLessonTime = (startTime: string, duration: number): string => {
    const endTime = calculateEndTime(startTime, duration);
    return `${startTime} - ${endTime}`;
  };

  // If no teachers data, but we have teacher IDs, use those directly
  const shouldUseDirectTeacherIds =
    studentTeacherIds &&
    studentTeacherIds.length > 0 &&
    (!teachersData.teachers || teachersData.teachers.length === 0) &&
    placeholderTeachers.length > 0;

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <User size={16} />
        <span>
          מורים{' '}
          {shouldUseDirectTeacherIds
            ? `(${studentTeacherIds.length})`
            : teachersData.teachers
            ? `(${teachersData.teachers.length})`
            : ''}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {teachersLoading ? (
            <div className='sd-loading-indicator'>
              <RefreshCw size={16} className='spin' />
              <span>טוען מורים...</span>
            </div>
          ) : teachersError ? (
            <div className='sd-error-state small'>
              <p>{teachersError}</p>
              <button onClick={onRetryLoadTeachers} className='sd-retry-btn'>
                נסה שוב
              </button>
            </div>
          ) : !hasTeachers ? (
            <div className='sd-empty-state'>
              <p>לא נמצאו מורים לתלמיד זה</p>
            </div>
          ) : shouldUseDirectTeacherIds ? (
            // Direct display of teacher IDs when we don't have full data yet
            <div className='sd-teachers-grid'>
              {placeholderTeachers.map((teacher, index) => {
                const assignments = getTeacherAssignments(teacher._id);
                return (
                  <div
                    key={`teacher-id-${index}-${teacher._id}`}
                    className='sd-teacher-card sd-teacher-modern-card clickable'
                    onClick={() => onTeacherClick(teacher._id)}
                  >
                    <div className='sd-teacher-main'>
                      <div className='sd-teacher-identity'>
                        <div
                          className='sd-teacher-avatar'
                          style={{ backgroundColor: '#6c757d' }}
                        >
                          {getTeacherInitials(teacher.personalInfo?.fullName || '')}
                        </div>
                        <div className='sd-teacher-info'>
                          <div className='sd-teacher-name'>
                            {teacher.personalInfo?.fullName ||
                              `מורה ${teacher._id.slice(-4)}`}
                          </div>
                          <div className='sd-teacher-instrument'>
                            <Music size={12} />
                            <span>כלי נגינה לא ידוע</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent navigation
                          onRetryLoadTeachers();
                        }}
                        className='sd-load-details-btn'
                        title="טען פרטי מורה"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                    
                    {/* Display teacher assignments for placeholder teachers too */}
                    {assignments.length > 0 && (
                      <div className='sd-teacher-lessons'>
                        <div className='sd-lessons-header'>
                          <Calendar size={12} />
                          <span>שיעורים ({assignments.length})</span>
                        </div>
                        <div className='sd-lessons-list'>
                          {assignments.map((assignment, assignmentIndex) => (
                            <div key={`assignment-${assignmentIndex}`} className='sd-lesson-item'>
                              <div className='sd-lesson-day'>{assignment.day}</div>
                              <div className='sd-lesson-time'>
                                <Clock size={10} />
                                <span>{formatLessonTime(assignment.time, assignment.duration)}</span>
                              </div>
                              <div className='sd-lesson-duration'>
                                {assignment.duration}ד'
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Standard display with full teacher data - now shows assignments
            <div className='sd-teachers-grid'>
              {teachersData.teachers.map((teacher, index) => {
                const assignments = getTeacherAssignments(teacher._id);
                return (
                  <div
                    key={`teacher-${index}-${teacher._id}`}
                    className='sd-teacher-card sd-teacher-modern-card clickable'
                    onClick={() => onTeacherClick(teacher._id)}
                  >
                    <div className='sd-teacher-main'>
                      <div className='sd-teacher-identity'>
                        <div
                          className='sd-teacher-avatar'
                          style={{ backgroundColor: '#4D55CC' }}
                        >
                          {getTeacherInitials(teacher.personalInfo?.fullName || '')}
                        </div>
                        <div className='sd-teacher-info'>
                          <div className='sd-teacher-name'>
                            {teacher.personalInfo?.fullName || 'מורה לא ידוע'}
                          </div>
                          <div className='sd-teacher-instrument'>
                            <Music size={12} />
                            <span>
                              {teacher.professionalInfo?.instrument ||
                                'כלי נגינה לא ידוע'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {assignments.length > 0 && (
                        <div className='sd-teacher-badge'>
                          <span>{assignments.length} שיעורים</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Display teacher assignments */}
                    {assignments.length > 0 && (
                      <div className='sd-teacher-lessons'>
                        <div className='sd-lessons-header'>
                          <Calendar size={12} />
                          <span>מערכת שיעורים</span>
                        </div>
                        <div className='sd-lessons-list'>
                          {assignments.map((assignment, assignmentIndex) => (
                            <div key={`assignment-${assignmentIndex}`} className='sd-lesson-item'>
                              <div className='sd-lesson-day'>{assignment.day}</div>
                              <div className='sd-lesson-time'>
                                <Clock size={10} />
                                <span>{formatLessonTime(assignment.time, assignment.duration)}</span>
                              </div>
                              <div className='sd-lesson-duration'>
                                {assignment.duration}ד'
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
