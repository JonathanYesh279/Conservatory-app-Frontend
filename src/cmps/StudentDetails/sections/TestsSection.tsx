// src/components/StudentDetails/sections/TestsSection.tsx
import { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Student } from '../../../services/studentService';

interface TestsSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
  updateStudentTest: (
    instrumentName: string,
    testType: 'stageTest' | 'technicalTest',
    status: string
  ) => Promise<Student | undefined>;
  isUpdatingTest?: boolean;
  getStageColor: (stage: number) => string; // Add this prop to get consistent colors
}

export function TestsSection({
  student,
  isOpen,
  onToggle,
  formatDate,
  updateStudentTest,
  isUpdatingTest = false,
  getStageColor, // Use this prop for consistent stage colors
}: TestsSectionProps) {
  // State for test dropdowns
  const [activeDropdown, setActiveDropdown] = useState<{
    instrumentName: string;
    testType: 'stageTest' | 'technicalTest';
  } | null>(null);

  // State for undo functionality
  const [lastUpdate, setLastUpdate] = useState<{
    instrumentName: string;
    testType: 'stageTest' | 'technicalTest';
    oldStatus: string;
    newStatus: string;
    timestamp: number;
  } | null>(null);

  // State for showing the undo toast
  const [showUndoToast, setShowUndoToast] = useState(false);

  // Test status options - include all possible statuses
  const testStatusOptions = [
    { value: 'לא נבחן', label: 'לא נבחן' },
    { value: 'עבר/ה', label: 'עבר/ה' },
    { value: 'לא עבר/ה', label: 'לא עבר/ה' },
    { value: 'עבר/ה בהצטיינות', label: 'עבר/ה בהצטיינות' },
    { value: 'עבר/ה בהצטיינות יתרה', label: 'עבר/ה בהצטיינות יתרה' },
  ];

  // Auto-hide the undo toast after 5 seconds
  useEffect(() => {
    let timer: number;
    if (showUndoToast) {
      timer = window.setTimeout(() => {
        setShowUndoToast(false);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showUndoToast]);

  if (!student || !student.academicInfo) {
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
    newStatus: string
  ) => {
    if (isUpdatingTest) {
      // Don't allow multiple simultaneous updates
      return;
    }

    // Get the instrument
    const instrument = student.academicInfo.instrumentProgress.find(
      (i) => i.instrumentName === instrumentName
    );

    if (!instrument) return;

    // Get current test status
    const currentStatus = instrument.tests?.[testType]?.status || 'לא נבחן';

    // Don't update if the status hasn't changed
    if (currentStatus === newStatus) {
      setActiveDropdown(null);
      return;
    }

    // Close dropdown
    setActiveDropdown(null);

    try {
      // Save the last update for potential undo
      setLastUpdate({
        instrumentName,
        testType,
        oldStatus: currentStatus,
        newStatus,
        timestamp: Date.now(),
      });

      // Show the undo toast
      setShowUndoToast(true);

      // Update the test status
      await updateStudentTest(instrumentName, testType, newStatus);
      console.log(`Updated ${testType} for ${instrumentName} to ${newStatus}`);
    } catch (error) {
      console.error(
        `Failed to update ${testType} for ${instrumentName}:`,
        error
      );
    }
  };

  // Handle undoing the last update
  const handleUndo = async () => {
    if (!lastUpdate || isUpdatingTest) return;

    try {
      await updateStudentTest(
        lastUpdate.instrumentName,
        lastUpdate.testType,
        lastUpdate.oldStatus
      );
      console.log(
        `Undid update for ${lastUpdate.testType} for ${lastUpdate.instrumentName}, restored to ${lastUpdate.oldStatus}`
      );

      // Clear the last update after successful undo
      setLastUpdate(null);

      // Hide the undo toast
      setShowUndoToast(false);
    } catch (error) {
      console.error('Failed to undo test update:', error);
    }
  };

  // Helper function to get status color - Updated with more consistent colors
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
        <Award size={16} />
        <span>מבחנים</span>
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

          <div className='sd-tests-grid'>
            {student.academicInfo.instrumentProgress.map((instrument) => (
              <div
                key={instrument.instrumentName}
                className='sd-instrument-test-card'
              >
                <div className='sd-instrument-test-header'>
                  <h3>{instrument.instrumentName}</h3>
                  <div
                    className='sd-stage-badge'
                    style={{
                      backgroundColor: getStageColor(instrument.currentStage),
                    }}
                  >
                    שלב {instrument.currentStage}
                  </div>
                </div>

                <div className='sd-test-items'>
                  {/* Technical Test */}
                  <div className='sd-test-item'>
                    <div className='sd-test-item-content'>
                      <span className='sd-test-label'>מבחן טכני:</span>
                      <div className='sd-test-value-container'>
                        <span
                          className={`sd-test-value sd-clickable ${
                            isUpdatingTest ? 'disabled' : ''
                          } ${getStatusClassName(
                            instrument.tests?.technicalTest?.status || 'לא נבחן'
                          )}`}
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
                                    <Award size={12} />
                                  )}
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                    {instrument.tests?.technicalTest?.lastTestDate && (
                      <div className='sd-test-date'>
                        <Calendar size={12} />
                        <span>
                          {formatDate(
                            instrument.tests.technicalTest.lastTestDate
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stage Test */}
                  <div className='sd-test-item'>
                    <div className='sd-test-item-content'>
                      <span className='sd-test-label'>מבחן שלב:</span>
                      <div className='sd-test-value-container'>
                        <span
                          className={`sd-test-value sd-clickable ${
                            isUpdatingTest ? 'disabled' : ''
                          } ${getStatusClassName(
                            instrument.tests?.stageTest?.status || 'לא נבחן'
                          )}`}
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
                                    <Award size={12} />
                                  )}
                                  {option.label}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                    {instrument.tests?.stageTest?.lastTestDate && (
                      <div className='sd-test-date'>
                        <Calendar size={12} />
                        <span>
                          {formatDate(instrument.tests.stageTest.lastTestDate)}
                        </span>
                      </div>
                    )}
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
        </div>
      )}

      {/* Undo Toast - Made smaller and positioned at bottom left */}
      {showUndoToast && lastUpdate && (
        <div className='sd-undo-toast'>
          <span>{lastUpdate.newStatus}</span>
          <button className='sd-undo-btn' onClick={handleUndo}>
            <RotateCcw size={14} />
            <span>ביטול</span>
          </button>
        </div>
      )}
    </div>
  );
}
