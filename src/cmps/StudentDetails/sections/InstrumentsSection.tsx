// src/components/StudentDetails/sections/InstrumentsSection.tsx
import { Music, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { Student } from '../../../services/studentService';
<<<<<<< Updated upstream
import { useState } from 'react';
=======
>>>>>>> Stashed changes

interface InstrumentsSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
  getStageColor: (stage: number) => string;
<<<<<<< Updated upstream
  updateStudentStage?: (
    instrumentName: string,
    newStage: number
  ) => Promise<Student | undefined>;
  isUpdatingStage?: boolean;
  canEditStage?: boolean;
=======
>>>>>>> Stashed changes
}

export function InstrumentsSection({
  student,
  isOpen,
  onToggle,
  getStageColor,
<<<<<<< Updated upstream
  updateStudentStage,
  isUpdatingStage = false,
  canEditStage = false,
}: InstrumentsSectionProps) {
  // State for stage dropdown
  const [activeStageDropdown, setActiveStageDropdown] = useState<string | null>(null);

  // Stage options (1-8)
  const stageOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  // Toggle stage dropdown
  const toggleStageDropdown = (instrumentName: string) => {
    if (isUpdatingStage || !canEditStage) {
      return;
    }

    if (activeStageDropdown === instrumentName) {
      setActiveStageDropdown(null);
    } else {
      setActiveStageDropdown(instrumentName);
    }
  };

  // Handle stage selection
  const handleStageSelect = async (instrumentName: string, newStage: number) => {
    if (isUpdatingStage || !updateStudentStage) {
      return;
    }

    // Get current stage
    const instrument = student.academicInfo.instrumentProgress.find(
      (i) => i.instrumentName === instrumentName
    );

    if (!instrument || instrument.currentStage === newStage) {
      setActiveStageDropdown(null);
      return;
    }

    // Close dropdown
    setActiveStageDropdown(null);

    try {
      await updateStudentStage(instrumentName, newStage);
      console.log(`Updated stage for ${instrumentName} to ${newStage}`);
    } catch (error) {
      console.error(`Failed to update stage for ${instrumentName}:`, error);
    }
  };

=======
}: InstrumentsSectionProps) {
>>>>>>> Stashed changes
  if (
    !student ||
    !student.academicInfo ||
    !student.academicInfo.instrumentProgress
  ) {
    return null;
  }

  // Helper function to get status color - updated to match TestSection
  const getStatusColor = (status: string): string => {
    if (status === 'עבר/ה בהצטיינות יתרה') {
      return 'var(--success-emphasis)'; // Darker green for highest achievement
    }
    if (status === 'עבר/ה בהצטיינות' || status === 'עבר/ה') {
      return 'var(--success)'; // Regular green for pass
    }
    if (status === 'לא עבר/ה') {
      return 'var(--danger)'; // Strong red for fail
    }
    return 'var(--text-muted)'; // Gray for not tested
  };

  // Helper function to get the status class
  const getStatusClassName = (status: string) => {
    if (status === 'לא נבחן') return 'not-tested';
    if (status === 'לא עבר/ה') return 'failed';
    if (status === 'עבר/ה בהצטיינות יתרה') return 'excellent-plus';
    if (status === 'עבר/ה בהצטיינות') return 'excellent';
    return 'passed';
  };

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Music size={16} />
        <span>כלי נגינה</span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {student.academicInfo.instrumentProgress.length > 0 ? (
            <div className='sd-compact-instruments-list'>
              {student.academicInfo.instrumentProgress.map((instrument) => (
                <div
                  key={instrument.instrumentName}
                  className='sd-compact-instrument-card'
                >
                  <div className='sd-instrument-header'>
                    <div className='sd-instrument-name-container'>
                      <Music size={14} className='sd-instrument-icon' />
                      <span className='sd-instrument-name'>
                        {instrument.instrumentName}
                      </span>
                      {instrument.isPrimary && (
                        <span className='sd-primary-badge'>
                          <Star size={10} /> ראשי
                        </span>
                      )}
                    </div>
<<<<<<< Updated upstream
                    <div className='sd-stage-badge-container'>
                      <div
                        className={`sd-stage-badge ${canEditStage ? 'sd-clickable' : ''} ${
                          isUpdatingStage ? 'disabled' : ''
                        }`}
                        style={{
                          backgroundColor: getStageColor(instrument.currentStage),
                        }}
                        onClick={() => toggleStageDropdown(instrument.instrumentName)}
                      >
                        שלב {instrument.currentStage}
                      </div>

                      {/* Stage dropdown */}
                      {!isUpdatingStage &&
                        canEditStage &&
                        activeStageDropdown === instrument.instrumentName && (
                          <div className='sd-stage-dropdown'>
                            {stageOptions.map((stage) => (
                              <div
                                key={stage}
                                className={`sd-dropdown-item ${
                                  instrument.currentStage === stage ? 'selected' : ''
                                }`}
                                onClick={() =>
                                  handleStageSelect(instrument.instrumentName, stage)
                                }
                              >
                                {instrument.currentStage === stage && <Star size={12} />}
                                שלב {stage}
                              </div>
                            ))}
                          </div>
                        )}
=======
                    <div
                      className='sd-stage-badge'
                      style={{
                        backgroundColor: getStageColor(instrument.currentStage),
                      }}
                    >
                      שלב {instrument.currentStage}
>>>>>>> Stashed changes
                    </div>
                  </div>

                  {/* Test status display - read-only with updated colors */}
                  <div className='sd-test-status-row'>
                    {/* Technical Test */}
                    <div className='sd-test-item'>
                      <span className='sd-test-label'>מבחן טכני:</span>
                      <span
                        className={`sd-test-value ${getStatusClassName(
                          instrument.tests?.technicalTest?.status || 'לא נבחן'
                        )}`}
                        style={{
                          color: getStatusColor(
                            instrument.tests?.technicalTest?.status || 'לא נבחן'
                          ),
                        }}
                      >
                        {instrument.tests?.technicalTest?.status || 'לא נבחן'}
                      </span>
                    </div>

                    {/* Stage Test */}
                    <div className='sd-test-item'>
                      <span className='sd-test-label'>מבחן שלב:</span>
                      <span
                        className={`sd-test-value ${getStatusClassName(
                          instrument.tests?.stageTest?.status || 'לא נבחן'
                        )}`}
                        style={{
                          color: getStatusColor(
                            instrument.tests?.stageTest?.status || 'לא נבחן'
                          ),
                        }}
                      >
                        {instrument.tests?.stageTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                  </div>

                  {/* Notes if available */}
                  {(instrument.tests?.stageTest?.notes ||
                    instrument.tests?.technicalTest?.notes) && (
                    <div className='sd-notes-row'>
                      <span className='sd-notes-text'>
                        {instrument.tests?.stageTest?.notes ||
                          instrument.tests?.technicalTest?.notes}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='sd-no-data'>אין כלי נגינה</div>
          )}
        </div>
      )}
    </div>
  );
}
