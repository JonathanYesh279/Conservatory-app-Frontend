// src/cmps/StudentDetails/sections/TeachersSection.tsx
import { ChevronDown, ChevronUp, User, RefreshCw, Music } from 'lucide-react';
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
                </div>
              ))}
            </div>
          ) : (
            // Standard display with full teacher data - simplified without schedule
            <div className='sd-teachers-grid'>
              {teachersData.teachers.map((teacher, index) => (
                <div
                  key={`teacher-${index}-${teacher._id}`}
                  className='sd-teacher-card'
                  onClick={() => onTeacherClick(teacher._id)}
                >
                  <div className='sd-teacher-header'>
                    <div
                      className='sd-teacher-avatar'
                      style={{ backgroundColor: '#4D55CC' }}
                    >
                      {getTeacherInitials(teacher.personalInfo?.fullName || '')}
                    </div>
                    <div className='sd-teacher-name'>
                      <span>
                        {teacher.personalInfo?.fullName || 'מורה לא ידוע'}
                      </span>
                      <div className='sd-teacher-instrument'>
                        <Music size={12} />
                        <span>
                          {teacher.professionalInfo?.instrument ||
                            'כלי נגינה לא ידוע'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
