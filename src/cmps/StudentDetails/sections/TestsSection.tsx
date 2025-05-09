// src/components/StudentDetails/sections/TestsSection.tsx
import { Award, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { Student } from '../../../services/studentService';
import { StatusDropdown } from '../StatusDropdown';
import { useStudentTests } from '../../../hooks/useStudentTests';

interface TestsSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}

export function TestsSection({
  student,
  isOpen,
  onToggle,
  formatDate,
}: TestsSectionProps) {
  if (!student || !student.academicInfo) {
    return null;
  }

  const {
    isUpdating,
    updateError,
    showStageTestOptions,
    showStageSuccessOptions,
    handleTestStatusChange,
    toggleStageTestOptions,
    toggleStageSuccessOptions,
  } = useStudentTests(student);

  // Define the basic test status options
  const basicStatusOptions = [
    { value: 'עבר/ה', label: 'עבר/ה' },
    { value: 'לא עבר/ה', label: 'לא עבר/ה' },
  ];

  // Define success level options
  const successLevelOptions = [
    { value: 'עבר/ה בהצלחה', label: 'בהצלחה' },
    { value: 'עבר/ה בהצטיינות', label: 'בהצטיינות' },
  ];

  const stageTestStatus =
    student.academicInfo.tests?.stageTest?.status || 'לא נבחן';
  const technicalTestStatus =
    student.academicInfo.tests?.technicalTest?.status || 'לא נבחן';

  // Helper function to check if status indicates the test was passed
  const isPassed = (status: string) => status.startsWith('עבר/ה');

  // Helper function to get the proper class name for test status
  const getStatusClassName = (status: string) => {
    if (status === 'לא נבחן') return '';
    return isPassed(status) ? 'passed' : 'failed';
  };

  // Display a simplified version of the status for the UI
  const getDisplayStatus = (status: string) => {
    if (status === 'עבר/ה בהצלחה') return 'עבר/ה בהצלחה';
    if (status === 'עבר/ה בהצטיינות') return 'עבר/ה בהצטיינות';
    return status;
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
          {updateError && <div className='sd-error-message'>{updateError}</div>}

          <div className='sd-tests-grid'>
            {/* Technical Test Card */}
            <div className='sd-test-card'>
              <div className='sd-test-header'>
                <h3>מבחן טכני</h3>
                <div className='sd-status-container'>
                  <span
                    className={`sd-test-status ${getStatusClassName(
                      technicalTestStatus
                    )}`}
                  >
                    {getDisplayStatus(technicalTestStatus)}
                  </span>

                  {/* Would implement dropdown for technical test if needed */}
                </div>
              </div>

              {student.academicInfo.tests?.technicalTest?.lastTestDate && (
                <div className='sd-test-date'>
                  <Calendar size={12} />
                  <span>
                    {formatDate(
                      student.academicInfo.tests.technicalTest.lastTestDate
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Stage Test Card */}
            <div className='sd-test-card'>
              <div className='sd-test-header'>
                <h3>מבחן שלב</h3>
                <div className='sd-status-container'>
                  <span
                    className={`sd-test-status ${getStatusClassName(
                      stageTestStatus
                    )} ${showStageTestOptions ? 'selecting' : ''}`}
                    onClick={toggleStageTestOptions}
                  >
                    {getDisplayStatus(stageTestStatus)}
                  </span>

                  {/* Dropdown for stage test status */}
                  <StatusDropdown
                    isOpen={showStageTestOptions}
                    onToggle={toggleStageTestOptions}
                    options={basicStatusOptions}
                    onSelect={(status) => {
                      if (status === 'עבר/ה') {
                        toggleStageSuccessOptions(); // Show success options
                      } else {
                        handleTestStatusChange('stageTest', status as any);
                      }
                    }}
                    selectedValue={
                      stageTestStatus === 'עבר/ה בהצלחה' ||
                      stageTestStatus === 'עבר/ה בהצטיינות'
                        ? 'עבר/ה'
                        : stageTestStatus
                    }
                    className='sd-dropdown'
                  />

                  {/* Success level dropdown */}
                  {showStageSuccessOptions && (
                    <div className='sd-success-options-container'>
                      <StatusDropdown
                        isOpen={showStageSuccessOptions}
                        onToggle={toggleStageSuccessOptions}
                        options={successLevelOptions}
                        onSelect={(status) =>
                          handleTestStatusChange('stageTest', status as any)
                        }
                        selectedValue={stageTestStatus}
                        className='sd-success-dropdown'
                      />
                    </div>
                  )}
                </div>
              </div>

              {student.academicInfo.tests?.stageTest?.lastTestDate && (
                <div className='sd-test-date'>
                  <Calendar size={12} />
                  <span>
                    {formatDate(
                      student.academicInfo.tests.stageTest.lastTestDate
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isUpdating && <div className='sd-updating-status'>מעדכן...</div>}
        </div>
      )}
    </div>
  );
}
