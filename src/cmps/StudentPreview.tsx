// src/cmps/StudentPreview.tsx
import { Student } from '../services/studentService';
import { Edit, Trash2, Music, Calendar, Award, Eye } from 'lucide-react';

interface StudentPreviewProps {
  student: Student;
  onView: (studentId: string) => void;
  onEdit: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
}

export function StudentPreview({
  student,
  onView,
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
      case 'עבר/ה בהצלחה':
      case 'עבר/ה בהצטיינות':
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
    if (count === 0) return 'ללא תזמורת';
    if (count === 1) return 'תזמורת אחת';
    return `${count} תזמורות`;
  };

  // Get formatted instruments text
  const getInstrumentsText = (): string => {
    // Handle case where we have the new instruments array
    if (
      student.academicInfo.instruments &&
      student.academicInfo.instruments.length > 0
    ) {
      if (student.academicInfo.instruments.length === 1) {
        return student.academicInfo.instruments[0];
      }

      // Format multiple instruments nicely
      return student.academicInfo.instruments.join(', ');
    }

    // Fallback to the single instrument field for backward compatibility
    return student.academicInfo.instrument;
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
    <div
      className='student-preview'
      onClick={() => onView(student._id)}
      style={{ cursor: 'pointer' }}
    >
      <div className='preview-header'>
        <div className='header-right-container'>
          <div className='avatar-section'>
            <div
              className='avatar'
              style={{
                backgroundColor: getStageColor(
                  student.academicInfo.currentStage
                ),
              }}
            >
              {getInitials(student.personalInfo.fullName)}
            </div>
          </div>

          <div className='student-info'>
            <h3 className='student-name'>{student.personalInfo.fullName}</h3>
            <div className='student-subject'>
              <Music size={14} />
              <span>{getInstrumentsText()}</span>
            </div>
          </div>
        </div>

        <div className='badges-container'>
          <div
            className='stage-badge'
            style={{
              backgroundColor: getStageColor(student.academicInfo.currentStage),
            }}
          >
            <span>שלב {student.academicInfo.currentStage}</span>
          </div>

          <div
            className='grade-badge'
            style={{
              backgroundColor: '#348b49',
            }}
          >
            <span>כיתה {student.academicInfo.class}</span>
          </div>
        </div>
      </div>

      <div className='preview-content'>
        <div className='info-row'>
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
            className='action-btn view'
            onClick={(e) => {
              e.stopPropagation();
              onView(student._id);
            }}
            aria-label='הצג פרטי תלמיד'
          >
            <Eye size={16} />
          </button>

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
