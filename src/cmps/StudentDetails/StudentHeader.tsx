// src/components/StudentDetails/StudentHeader.tsx
import { Music, ArrowLeft } from 'lucide-react';
import { Student } from '../../services/studentService';

interface StudentHeaderProps {
  student: Student;
  getInitials: (name: string) => string;
  getStageColor: (stage: number) => string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function StudentHeader({
  student,
  getInitials,
  getStageColor,
  onBack,
  showBackButton = true,
}: StudentHeaderProps) {
  return (
    <div className='card-header'>
      <div className='student-identity'>
        <div
          className='avatar'
          style={{
            backgroundColor: getStageColor(student.academicInfo.currentStage),
          }}
        >
          {getInitials(student.personalInfo.fullName)}
        </div>

        <div className='header-text'>
          <h1 className='student-name'>{student.personalInfo.fullName}</h1>
          <div className='instrument'>
            <Music size={14} />
            <span>{student.academicInfo.instrument}</span>
          </div>
        </div>
      </div>

      <div className='header-badges'>
        <div
          className='stage-badge'
          style={{
            backgroundColor: getStageColor(student.academicInfo.currentStage),
          }}
        >
          שלב {student.academicInfo.currentStage}
        </div>
        <div
          className='grade-badge'
          style={{
            backgroundColor: '#348b49',
          }}
        >
          כיתה {student.academicInfo.class}
        </div>
        {showBackButton && onBack && (
          <button className='back-button' onClick={onBack} aria-label='חזרה'>
            <ArrowLeft size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
