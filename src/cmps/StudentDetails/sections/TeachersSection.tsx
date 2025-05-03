// src/components/StudentDetails/sections/TeachersSection.tsx
import { User, RefreshCw } from 'lucide-react';
import { TeacherData } from '../../../hooks/useStudentDetailsState';

interface TeachersSectionProps {
  teachersData: TeacherData[];
  teachersLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onTeacherClick: (teacherId: string) => void;
}

export function TeachersSection({
  teachersData,
  teachersLoading,
  isOpen,
  onToggle,
  onTeacherClick,
}: TeachersSectionProps) {
  return (
    <div className='section'>
      <div
        className={`section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <User size={16} />
        <span>מורים ({teachersData.length || 0})</span>
      </div>

      {isOpen && (
        <div className='section-content'>
          {teachersLoading ? (
            <div className='loading-section'>
              <RefreshCw size={16} className='loading-icon' />
              <span>טוען פרטי מורים...</span>
            </div>
          ) : teachersData.length > 0 ? (
            <div className='teachers-list'>
              {teachersData.map((teacher) => (
                <div
                  key={teacher.id}
                  className='teacher-info clickable'
                  onClick={() => onTeacherClick(teacher.id)}
                >
                  <User size={14} />
                  <span>{teacher.name}</span>
                  {teacher.instrument && (
                    <span className='teacher-instrument'>
                      ({teacher.instrument})
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='no-teacher-warning'>לא הוקצה מורה לתלמיד</div>
          )}
        </div>
      )}
    </div>
  );
}
