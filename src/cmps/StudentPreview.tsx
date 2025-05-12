// src/cmps/StudentPreview.tsx
import { Student } from '../services/studentService';
import { Edit, Trash2, Calendar, Award, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { orchestraService } from '../services/orchestraService';

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
  // State to store orchestra names after fetching them
  const [orchestraNames, setOrchestraNames] = useState<string[]>([]);

  // Fetch orchestra names when component mounts
  useEffect(() => {
    const fetchOrchestraNames = async () => {
      if (
        student.enrollments?.orchestraIds &&
        student.enrollments.orchestraIds.length > 0
      ) {
        try {
          // Fetch orchestras by their IDs
          const orchestras = await orchestraService.getOrchestrasByIds(
            student.enrollments.orchestraIds
          );

          // Extract names
          const names = orchestras.map((orchestra) => orchestra.name);
          setOrchestraNames(names);
        } catch (error) {
          console.error('Error fetching orchestra data:', error);
          setOrchestraNames([]);
        }
      }
    };

    fetchOrchestraNames();
  }, [student.enrollments?.orchestraIds]);

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
      case 'עבר/ה בהצטיינות':
      case 'עבר/ה בהצטיינות יתרה':
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

  // Get formatted orchestras text
  const getOrchestrasDisplay = (): string => {
    if (orchestraNames.length === 0) {
      return 'ללא תזמורת';
    }

    // Get orchestra names and join with "||" separator
    return orchestraNames.join(' || ');
  };

  // Get formatted instruments text for display in header
  const getInstrumentsDisplay = (): string => {
    if (
      !student.academicInfo.instrumentProgress ||
      student.academicInfo.instrumentProgress.length === 0
    ) {
      return 'ללא כלי נגינה';
    }

    // Get top two instruments to display
    const instrumentsToShow = student.academicInfo.instrumentProgress.slice(
      0,
      2
    );

    // Format first two instruments with dash separator
    return instrumentsToShow.map((i) => i.instrumentName).join(' - ');
  };

  // Get primary instrument
  const getPrimaryInstrument = () => {
    return (
      student.academicInfo.instrumentProgress?.find((i) => i.isPrimary) ||
      (student.academicInfo.instrumentProgress?.length > 0
        ? student.academicInfo.instrumentProgress[0]
        : null)
    );
  };

  const primaryInstrument = getPrimaryInstrument();
  const currentStage = primaryInstrument?.currentStage || 1;

  // Get test status text and color for primary instrument
  const technicalTestStatus =
    primaryInstrument?.tests?.technicalTest?.status || 'לא נבחן';
  const stageTestStatus =
    primaryInstrument?.tests?.stageTest?.status || 'לא נבחן';

  return (
    <div className='student-preview' onClick={() => onView(student._id)}>
      <div className='preview-header'>
        {/* Main header row with badges left, student info right */}
        <div className='header-row'>

                    {/* Right side - avatar and student info */}
          <div className='student-details'>
            <div className='avatar-section'>
              <div
                className='avatar'
                style={{
                  backgroundColor: getStageColor(currentStage),
                }}
              >
                {getInitials(student.personalInfo.fullName)}
              </div>
            </div>

            <div className='student-info'>
              <h3 className='student-name'>{student.personalInfo.fullName}</h3>
              <div className='student-subject'>
                <span>{getInstrumentsDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Left side - badges */}
          <div className='badges-container'>
            {/* Instrument stage badges first */}
            {student.academicInfo.instrumentProgress &&
              student.academicInfo.instrumentProgress.length > 0 && (
                <div className='instrument-badges'>
                  {student.academicInfo.instrumentProgress.map((instrument) => (
                    <div
                      key={instrument.instrumentName}
                      className='instrument-stage-badge'
                      style={{
                        backgroundColor: getStageColor(instrument.currentStage),
                      }}
                    >
                      {instrument.instrumentName}: שלב {instrument.currentStage}
                    </div>
                  ))}
                </div>
              )}
            {/* Class badge */}
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
      </div>

      <div className='preview-content'>
        <div className='info-row'>
          <div className='info-item'>
            <Award size={16} />
            <span>{getOrchestrasDisplay()}</span>
          </div>
        </div>

        {primaryInstrument && (
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
        )}
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
