// src/cmps/StudentPreview.tsx
import { Student } from '../services/studentService';
import { Edit, Trash2, Calendar, Award, Music } from 'lucide-react';
import { useEffect, useState } from 'react';
import { orchestraService } from '../services/orchestraService';
import { studentService } from '../services/studentService'; // Use studentService directly
<<<<<<< Updated upstream
import { AuthorizationContext, useAuthorization } from '../utils/authorization';
=======
>>>>>>> Stashed changes

interface StudentPreviewProps {
  student: Student;
  onView: (studentId: string) => void;
  onEdit: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
<<<<<<< Updated upstream
  authContext?: AuthorizationContext;
=======
>>>>>>> Stashed changes
}

export function StudentPreview({
  student,
  onView,
  onEdit,
  onRemove,
<<<<<<< Updated upstream
  authContext,
=======
>>>>>>> Stashed changes
}: StudentPreviewProps) {
  // Local state for the current student data
  const [currentStudent, setCurrentStudent] = useState<Student>(student);

  // State to store orchestra names after fetching them
  const [orchestraNames, setOrchestraNames] = useState<string[]>([]);

<<<<<<< Updated upstream
  // Initialize authorization
  const auth = authContext ? useAuthorization(authContext) : null;
=======
  // Track if we've already fetched updated data to prevent infinite loops
  const [hasRefreshed, setHasRefreshed] = useState(false);
>>>>>>> Stashed changes

  // Update the component when the original student prop changes
  useEffect(() => {
    setCurrentStudent(student);
<<<<<<< Updated upstream
  }, [student]);

  // Note: Removed direct API call to avoid overriding store's local changes
  // The student data should come from the store which applies local stage changes
=======
    setHasRefreshed(false); // Reset refresh flag when student prop changes
  }, [student]);

  // Fetch the latest student data once when component mounts
  useEffect(() => {
    // Only fetch once per student and only if we haven't already refreshed
    if (student?._id && !hasRefreshed) {
      const getLatestStudentData = async () => {
        try {
          const latestStudent = await studentService.getStudentById(
            student._id
          );
          setCurrentStudent(latestStudent);
          setHasRefreshed(true); // Mark as refreshed to prevent further calls
        } catch (error) {
          console.error('Error fetching latest student data:', error);
        }
      };

      getLatestStudentData();
    }
  }, [student?._id, hasRefreshed]);
>>>>>>> Stashed changes

  // Fetch orchestra names when component mounts or currentStudent changes
  useEffect(() => {
    if (
      !currentStudent?.enrollments?.orchestraIds ||
      currentStudent.enrollments.orchestraIds.length === 0
    ) {
      setOrchestraNames([]);
      return;
    }

    const fetchOrchestraNames = async () => {
      try {
        // Fetch orchestras by their IDs
        const orchestras = await orchestraService.getOrchestrasByIds(
          currentStudent.enrollments.orchestraIds
        );

        // Extract names
        const names = orchestras.map((orchestra) => orchestra.name);
        setOrchestraNames(names);
      } catch (error) {
        console.error('Error fetching orchestra data:', error);
        setOrchestraNames([]);
      }
    };

    fetchOrchestraNames();
  }, [currentStudent?.enrollments?.orchestraIds]);

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
    if (!name) return '';
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
      !currentStudent?.academicInfo?.instrumentProgress ||
      currentStudent.academicInfo.instrumentProgress.length === 0
    ) {
      return 'ללא כלי נגינה';
    }

    // Get top two instruments to display
    const instrumentsToShow =
      currentStudent.academicInfo.instrumentProgress.slice(0, 2);

    // Format first two instruments with dash separator
    return instrumentsToShow.map((i) => i.instrumentName).join(' - ');
  };

  // Get primary instrument with null safety
  const getPrimaryInstrument = () => {
    if (!currentStudent?.academicInfo?.instrumentProgress) {
      return null;
    }

    return (
      currentStudent.academicInfo.instrumentProgress.find((i) => i.isPrimary) ||
      (currentStudent.academicInfo.instrumentProgress.length > 0
        ? currentStudent.academicInfo.instrumentProgress[0]
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

  // If we don't have a currentStudent yet, use the original student
  const displayStudent = currentStudent || student;

  // Ensure we have a valid student before rendering
  if (!displayStudent || !displayStudent.personalInfo) {
    return null;
  }

<<<<<<< Updated upstream
  // Get permissions for this student
  const permissions = auth?.getStudentActionPermissions(displayStudent) || {
    canEdit: true,
    canDelete: true,
    showEditButton: true,
    showDeleteButton: true
  };

=======
>>>>>>> Stashed changes
  return (
    <div className='student-preview' onClick={() => onView(displayStudent._id)}>
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
                {getInitials(displayStudent.personalInfo.fullName)}
              </div>
            </div>

            <div className='student-info'>
              <h3 className='student-name'>
                {displayStudent.personalInfo.fullName}
              </h3>
              <div className='student-subject'>
                <Music size={12} />
                <span>{getInstrumentsDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Left side - badges */}
          <div className='badges-container'>
            {/* Instrument stage badges first */}
            {displayStudent.academicInfo?.instrumentProgress &&
              displayStudent.academicInfo.instrumentProgress.length > 0 && (
                <div className='instrument-badges'>
                  {displayStudent.academicInfo.instrumentProgress.map(
                    (instrument) => (
                      <div
                        key={instrument.instrumentName}
                        className='instrument-stage-badge'
                        style={{
                          backgroundColor: getStageColor(
                            instrument.currentStage
                          ),
                        }}
                      >
                        {instrument.instrumentName}: שלב{' '}
                        {instrument.currentStage}
                      </div>
                    )
                  )}
                </div>
              )}
            {/* Class badge */}
            <div
              className='grade-badge'
              style={{
                backgroundColor: '#348b49',
              }}
            >
              <span>כיתה {displayStudent.academicInfo.class}</span>
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
<<<<<<< Updated upstream
          {permissions.showEditButton && (
            <button
              className='action-btn edit'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(displayStudent._id);
              }}
              aria-label='ערוך תלמיד'
            >
              <Edit size={20} />
            </button>
          )}

          {permissions.showDeleteButton && onRemove && (
=======
          <button
            className='action-btn edit'
            onClick={(e) => {
              e.stopPropagation();
              onEdit(displayStudent._id);
            }}
            aria-label='ערוך תלמיד'
          >
            <Edit size={20} />
          </button>

          {onRemove && (
>>>>>>> Stashed changes
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(displayStudent._id);
              }}
              aria-label='מחק תלמיד'
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        <div className='date-info'>
          <Calendar size={14} />
          <span>
            {new Date(displayStudent.createdAt).toLocaleDateString('he-IL')}
          </span>
        </div>
      </div>
    </div>
  );
}
