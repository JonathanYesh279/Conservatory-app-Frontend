// src/cmps/StudentPreview.tsx
import { Student } from '../services/studentService';
import { Edit, Trash2, Music, BookOpen, Calendar, Award } from 'lucide-react';

interface StudentPreviewProps {
  student: Student;
  onEdit: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
}

export function StudentPreview({
  student,
  onEdit,
  onRemove,
}: StudentPreviewProps) {
  // Get stage color based on stage number
  const getStageColor = (stage: number): string => {
    const colors = [
      'var(--stage-1)',
      'var(--stage-2)',
      'var(--stage-3)',
      'var(--stage-4)',
      'var(--stage-5)',
      'var(--stage-6)',
      'var(--stage-7)',
      'var(--stage-8)',
    ];
    return colors[stage - 1] || colors[0];
  };

  // Get test status indicator color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'עבר/ה':
        return 'var(--success)';
      case 'לא עבר/ה':
        return 'var(--danger)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format orchestra count
  const getOrchestraText = (count: number): string => {
    if (count === 0) return 'אין תזמורות';
    if (count === 1) return 'תזמורת אחת';
    return `${count} תזמורות`;
  };

  const hasOrchestras =
    student.enrollments?.orchestraIds &&
    student.enrollments.orchestraIds.length > 0;
  const orchestraCount = hasOrchestras
    ? student.enrollments.orchestraIds.length
    : 0;

  // Get test status text and color
  const technicalTestStatus =
    student.academicInfo.tests?.technicalTest?.status || 'לא נבחן';
  const stageTestStatus =
    student.academicInfo.tests?.stageTest?.status || 'לא נבחן';

  return (
    <div className='student-preview' onClick={() => onEdit(student._id)}>
      <div className='preview-header'>
        <div className='avatar-section'>
          <div className='avatar'>
            {getInitials(student.personalInfo.fullName)}
          </div>
        </div>

        <div className='student-info'>
          <h3 className='student-name'>{student.personalInfo.fullName}</h3>
          <div className='student-subject'>
            <Music size={14} />
            <span>{student.academicInfo.instrument}</span>
          </div>
        </div>

        <div
          className='stage-badge'
          style={{
            backgroundColor: getStageColor(student.academicInfo.currentStage),
          }}
        >
          <span>שלב {student.academicInfo.currentStage}</span>
        </div>
      </div>

      <div className='preview-content'>
        <div className='info-row'>
          <div className='info-item'>
            <BookOpen size={16} />
            <span>כיתה {student.academicInfo.class}</span>
          </div>

          <div className='info-item'>
            <Award size={16} />
            <span>{getOrchestraText(orchestraCount)}</span>
          </div>
        </div>

        <div className='tests-section'>
          <div className='test-item'>
            <div className='test-label'>מבחן טכני:</div>
            <div
              className='test-status'
              style={{ color: getStatusColor(technicalTestStatus) }}
            >
              {technicalTestStatus}
            </div>
          </div>

          <div className='test-item'>
            <div className='test-label'>מבחן שלב:</div>
            <div
              className='test-status'
              style={{ color: getStatusColor(stageTestStatus) }}
            >
              {stageTestStatus}
            </div>
          </div>
        </div>
      </div>

      <div className='preview-footer'>
        <div className='action-buttons'>
          <button
            className='action-btn edit'
            onClick={(e) => {
              e.stopPropagation();
              onEdit(student._id);
            }}
            aria-label='ערוך תלמיד'
          >
            <Edit size={16} />
          </button>

          {onRemove && (
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(student._id);
              }}
              aria-label='מחק תלמיד'
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className='date-info'>
          <Calendar size={14} />
          <span>{new Date(student.createdAt).toLocaleDateString('he-IL')}</span>
        </div>
      </div>
    </div>
  );
}
