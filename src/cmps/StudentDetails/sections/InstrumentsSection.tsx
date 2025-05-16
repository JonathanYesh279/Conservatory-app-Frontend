// src/cmps/StudentDetails/sections/InstrumentsSection.tsx
import { useState } from 'react';
import {
  Music,
  Star,
  ChevronUp,
  ChevronDown,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Student } from '../../../services/studentService';

interface InstrumentsSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
  getStageColor: (stage: number) => string;
  updateStudentTest: (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ) => Promise<Student | undefined>;
  isUpdatingTest?: boolean;
}

export function InstrumentsSection({
  student,
  isOpen,
  onToggle,
  getStageColor,
  updateStudentTest,
  isUpdatingTest = false,
}: InstrumentsSectionProps) {
  // State for test dropdowns
  const [activeDropdown, setActiveDropdown] = useState<{
    instrumentName: string;
    testType: 'stageTest' | 'technicalTest';
  } | null>(null);

  // Test status options - include all possible statuses
  const testStatusOptions = [
    { value: 'לא נבחן', label: 'לא נבחן' },
    { value: 'עבר/ה', label: 'עבר/ה' },
    { value: 'לא עבר/ה', label: 'לא עבר/ה' },
    { value: 'עבר/ה בהצטיינות', label: 'עבר/ה בהצטיינות' },
    { value: 'עבר/ה בהצטיינות יתרה', label: 'עבר/ה בהצטיינות יתרה' },
  ];

  if (
    !student ||
    !student.academicInfo ||
    !student.academicInfo.instrumentProgress
  ) {
    return null;
  }

  // Toggle dropdown for a specific test and instrument
  const toggleDropdown = (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest'
  ) => {
    if (isUpdatingTest) {
      // Don't allow toggling dropdown while update is in progress
      return;
    }

    if (
      activeDropdown &&
      activeDropdown.instrumentName === instrumentName &&
      activeDropdown.testType === testType
    ) {
      // Close if clicking on the same one
      setActiveDropdown(null);
    } else {
      // Open a new dropdown
      setActiveDropdown({ instrumentName, testType });
    }
  };

  // Handle test status selection
  const handleTestStatusSelect = async (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ) => {
    if (isUpdatingTest) {
      // Don't allow multiple simultaneous updates
      return;
    }

    // Close dropdown
    setActiveDropdown(null);

    try {
      // Update the test status
      await updateStudentTest(instrumentName, testType, status);
      console.log(`Updated ${testType} for ${instrumentName} to ${status}`);
    } catch (error) {
      console.error(
        `Failed to update ${testType} for ${instrumentName}:`,
        error
      );
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    if (status.includes('עבר/ה')) {
      if (status.includes('בהצטיינות יתרה')) {
        return 'var(--primary-color)'; // Special color for highest achievement
      }
      if (status.includes('בהצטיינות')) {
        return 'var(--success-emphasis)'; // Enhanced success color
      }
      return 'var(--success)'; // Regular success color
    }
    if (status === 'לא עבר/ה') {
      return 'var(--danger)'; // Danger color for failed
    }
    return 'var(--text-secondary)'; // Neutral for not tested
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
          {isUpdatingTest && (
            <div className='sd-updating-indicator'>
              <RefreshCw size={16} className='spin' />
              <span>מעדכן נתונים...</span>
            </div>
          )}

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
                    <div
                      className='sd-stage-badge'
                      style={{
                        backgroundColor: getStageColor(instrument.currentStage),
                      }}
                    >
                      שלב {instrument.currentStage}
                    </div>
                  </div>

                  {/* Test status display with dropdown functionality */}
                  <div className='sd-test-status-row'>
                    {/* Technical Test */}
                    <div className='sd-test-item'>
                      <span className='sd-test-label'>מבחן טכני:</span>
                      <div className='sd-test-value-container'>
                        <span
                          className={`sd-test-value sd-clickable ${
                            isUpdatingTest ? 'disabled' : ''
                          }`}
                          style={{
                            color: getStatusColor(
                              instrument.tests?.technicalTest?.status ||
                                'לא נבחן'
                            ),
                          }}
                          onClick={() =>
                            toggleDropdown(
                              instrument.instrumentName,
                              'technicalTest'
                            )
                          }
                        >
                          {instrument.tests?.technicalTest?.status || 'לא נבחן'}
                        </span>

                        {/* Dropdown menu for technical test */}
                        {!isUpdatingTest &&
                          activeDropdown &&
                          activeDropdown.instrumentName ===
                            instrument.instrumentName &&
                          activeDropdown.testType === 'technicalTest' && (
                            <div className='sd-test-dropdown'>
                              {testStatusOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`sd-dropdown-item ${
                                    (instrument.tests?.technicalTest?.status ||
                                      'לא נבחן') === option.value
                                      ? 'selected'
                                      : ''
                                  }`}
                                  onClick={() =>
                                    handleTestStatusSelect(
                                      instrument.instrumentName,
                                      'technicalTest',
                                      option.value
                                    )
                                  }
                                >
                                  {(instrument.tests?.technicalTest?.status ||
                                    'לא נבחן') === option.value && (
                                    <Check size={12} />
                                  )}
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Stage Test */}
                    <div className='sd-test-item'>
                      <span className='sd-test-label'>מבחן שלב:</span>
                      <div className='sd-test-value-container'>
                        <span
                          className={`sd-test-value sd-clickable ${
                            isUpdatingTest ? 'disabled' : ''
                          }`}
                          style={{
                            color: getStatusColor(
                              instrument.tests?.stageTest?.status || 'לא נבחן'
                            ),
                          }}
                          onClick={() =>
                            toggleDropdown(
                              instrument.instrumentName,
                              'stageTest'
                            )
                          }
                        >
                          {instrument.tests?.stageTest?.status || 'לא נבחן'}
                        </span>

                        {/* Dropdown menu for stage test */}
                        {!isUpdatingTest &&
                          activeDropdown &&
                          activeDropdown.instrumentName ===
                            instrument.instrumentName &&
                          activeDropdown.testType === 'stageTest' && (
                            <div className='sd-test-dropdown'>
                              {testStatusOptions.map((option) => (
                                <div
                                  key={option.value}
                                  className={`sd-dropdown-item ${
                                    (instrument.tests?.stageTest?.status ||
                                      'לא נבחן') === option.value
                                      ? 'selected'
                                      : ''
                                  }`}
                                  onClick={() =>
                                    handleTestStatusSelect(
                                      instrument.instrumentName,
                                      'stageTest',
                                      option.value
                                    )
                                  }
                                >
                                  {(instrument.tests?.stageTest?.status ||
                                    'לא נבחן') === option.value && (
                                    <Check size={12} />
                                  )}
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
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

                  {/* Show last test date if available */}
                  {(instrument.tests?.stageTest?.lastTestDate ||
                    instrument.tests?.technicalTest?.lastTestDate) && (
                    <div className='sd-test-dates'>
                      {instrument.tests?.stageTest?.lastTestDate && (
                        <div className='sd-test-date'>
                          <span className='sd-date-label'>מבחן שלב:</span>
                          <span className='sd-date-value'>
                            {new Date(
                              instrument.tests.stageTest.lastTestDate
                            ).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      )}
                      {instrument.tests?.technicalTest?.lastTestDate && (
                        <div className='sd-test-date'>
                          <span className='sd-date-label'>מבחן טכני:</span>
                          <span className='sd-date-value'>
                            {new Date(
                              instrument.tests.technicalTest.lastTestDate
                            ).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      )}
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
