// src/cmps/StudentDetails/sections/TeachersSection.tsx
import {
  ChevronDown,
  ChevronUp,
  User,
  RefreshCw,
  Music,
  Clock,
  Calendar,
} from 'lucide-react';
import { Teacher } from '../../../services/teacherService';
import { TeacherAssignment } from '../../../services/studentService';
import { useState, useEffect, useRef } from 'react';

interface TeachersSectionProps {
  teachersData: {
    teachers: Teacher[];
    assignments: TeacherAssignment[];
  };
  teachersLoading: boolean;
  teachersError: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onTeacherClick: (teacherId: string) => void;
  onRetryLoadTeachers: () => void;
  // Add direct access to student teacherIds
  studentTeacherIds?: string[];
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
}: TeachersSectionProps) {
  // Use a ref to track if placeholders have been created
  const placeholdersCreated = useRef(false);

  // Create a temporary placeholder for each teacher ID if not loaded yet
  const [placeholderTeachers, setPlaceholderTeachers] = useState<any[]>([]);

  // Check if we have assignments or at least teacher IDs
  const hasAssignments =
    (teachersData?.assignments && teachersData.assignments.length > 0) ||
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
            : teachersData.assignments
            ? `(${teachersData.assignments.length})`
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
          ) : !hasAssignments ? (
            <div className='sd-empty-state'>
              <p>לא נמצאו מורים לתלמיד זה</p>
            </div>
          ) : shouldUseDirectTeacherIds ? (
            // Direct display of teacher IDs when we don't have full data yet
            <div className='sd-teachers-grid'>
              {placeholderTeachers.map((teacher, index) => (
                <div
                  key={`teacher-id-${index}-${teacher._id}`}
                  className='sd-teacher-card sd-teacher-simple-card'
                  onClick={() => onTeacherClick(teacher._id)}
                >
                  <div className='sd-teacher-header'>
                    <div
                      className='sd-teacher-avatar'
                      style={{ backgroundColor: '#6c757d' }}
                    >
                      {getTeacherInitials(teacher.personalInfo?.fullName || '')}
                    </div>
                    <div className='sd-teacher-name'>
                      <span>
                        {teacher.personalInfo?.fullName ||
                          `מורה ${teacher._id.slice(-4)}`}
                      </span>
                      <div className='sd-teacher-instrument'>
                        <Music size={12} />
                        <span>כלי נגינה לא ידוע</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent navigation
                          onRetryLoadTeachers();
                        }}
                        className='sd-load-details-btn'
                      >
                        <RefreshCw size={12} />
                        טען פרטים
                      </button>
                    </div>
                  </div>
                  <div className='sd-teacher-schedule'>
                    <div className='sd-schedule-item'>
                      <span className='sd-day'>יום א׳</span>
                      <span className='sd-time'>--:--</span>
                      <span className='sd-duration'>לא ידוע</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Standard display with full teacher data
            <div className='sd-teachers-grid'>
              {teachersData.assignments.map((assignment, index) => {
                // Try to find the teacher details
                const matchingTeacher = teachersData.teachers.find(
                  (t) => t && t._id === assignment.teacherId
                );

                // Fallback values if teacher not found
                const teacherName =
                  matchingTeacher && matchingTeacher.personalInfo
                    ? matchingTeacher.personalInfo.fullName
                    : `מורה ${assignment.teacherId.slice(-4)}`;

                const teacherInitials =
                  matchingTeacher && matchingTeacher.personalInfo
                    ? getTeacherInitials(matchingTeacher.personalInfo.fullName)
                    : 'מ';

                const teacherInstrument =
                  matchingTeacher &&
                  matchingTeacher.professionalInfo &&
                  matchingTeacher.professionalInfo.instrument;

                return (
                  <div
                    key={`teacher-assignment-${index}`}
                    className='sd-teacher-card'
                    onClick={() =>
                      matchingTeacher && matchingTeacher._id
                        ? onTeacherClick(matchingTeacher._id)
                        : onTeacherClick(assignment.teacherId)
                    }
                  >
                    <div className='sd-teacher-header'>
                      <div className='sd-teacher-name'>
                        <span>{teacherName}</span>
                        <div className='sd-teacher-instrument'>
                          <span>
                           {teacherInstrument ? ` - ${teacherInstrument}` : ' - כלי נגינה לא ידוע'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='sd-teacher-schedule'>
                      <div className='sd-schedule-item'>
                        <span className='sd-day'>
                          {assignment.day || 'יום ?'}
                        </span>
                        <span className='sd-time'>
                          {assignment.time || '--:--'}
                        </span>
                        <span className='sd-duration'>
                          {`(${assignment.duration})` || '--'} דקות
                        </span>
                      </div>
                      {assignment.location && (
                        <div className='sd-teacher-footer'>
                          <span>מיקום: {assignment.location}</span>
                        </div>
                      )}
                    </div>
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
