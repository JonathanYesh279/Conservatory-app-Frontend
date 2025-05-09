// src/components/StudentDetails/sections/TeachersSection.tsx
import { User, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { TeacherData } from '../../../hooks/useStudentDetailsState';

interface TeachersSectionProps {
  teachersData: TeacherData[];
  teachersLoading: boolean;
  teachersError: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onTeacherClick: (teacherId: string) => void;
  onRetryLoadTeachers: () => void;
}

export function TeachersSection({
  teachersData,
  teachersLoading,
  teachersError,
  isOpen,
  onToggle,
  onTeacherClick,
  onRetryLoadTeachers,
}: TeachersSectionProps) {
  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <User size={16} />
        <span>מורים ({teachersData.length})</span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {teachersLoading ? (
            <div className='sd-loading-section'>
              <RefreshCw size={16} className='sd-loading-icon' />
              <span>טוען פרטי מורים...</span>
            </div>
          ) : teachersError ? (
            <div className='sd-error-section'>
              <span>{teachersError}</span>
              <button
                className='sd-retry-button'
                onClick={onRetryLoadTeachers}
                aria-label='נסה לטעון מחדש'
              >
                <RefreshCw size={14} />
                <span>נסה שוב</span>
              </button>
            </div>
          ) : teachersData.length > 0 ? (
            <div className='sd-students-grid'>
              {teachersData.map((teacher) => (
                <div
                  key={teacher.id}
                  className='sd-student-card clickable'
                  onClick={() => onTeacherClick(teacher.id)}
                >
                  <div className='sd-student-avatar'>
                    {teacher.name.substring(0, 2)}
                  </div>
                  <div className='sd-student-info'>
                    <div className='sd-student-name'>{teacher.name}</div>
                    {teacher.instrument && (
                      <div className='sd-student-instrument'>
                        {teacher.instrument}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='sd-no-teacher-warning'>לא הוקצה מורה לתלמיד</div>
          )}
        </div>
      )}
    </div>
  );
}
