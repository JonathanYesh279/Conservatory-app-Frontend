import { useAcademicInfoSection } from '../../hooks/useAcademicInfoSection';
import { StudentFormData } from '../../hooks/useStudentForm';
import { useState, useEffect } from 'react';

interface AcademicInfoSectionProps {
  formData: StudentFormData;
  updateAcademicInfo: (field: string, value: any) => void;
  updateTestInfo: (
    testType: 'stageTest' | 'technicalTest',
    field: string,
    value: any
  ) => void;
  errors: Record<string, string>;
}

export function AcademicInfoSection({
  formData,
  updateAcademicInfo,
  updateTestInfo,
  errors,
}: AcademicInfoSectionProps) {
  const {
    academicInfo,
    validStages,
    validInstruments,
    testStatuses,
    extendedTestStatuses,
    handleAcademicInfoChange,
    handleTestChange,
  } = useAcademicInfoSection({
    formData,
    updateAcademicInfo,
    updateTestInfo,
    errors,
  });

  // State to track if test is passed
  const [isStageTestPassed, setIsStageTestPassed] = useState(false);

  // Effect to check if stageTest is in a "passed" state
  useEffect(() => {
    const stageTestStatus = academicInfo?.tests?.stageTest?.status;
    setIsStageTestPassed(
      stageTestStatus === 'עבר/ה' ||
        stageTestStatus === 'עבר/ה בהצלחה' ||
        stageTestStatus === 'עבר/ה בהצטיינות'
    );
  }, [academicInfo?.tests?.stageTest?.status]);

  // Handle stage test status change with special logic
  const handleStageTestStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;

    // First, update the test status
    handleTestChange('stageTest', 'status', e);

    // If test was just marked as passed, show a notification about stage auto-increment
    if (
      value === 'עבר/ה' &&
      academicInfo?.tests?.stageTest?.status !== 'עבר/ה' &&
      academicInfo?.tests?.stageTest?.status !== 'עבר/ה בהצלחה' &&
      academicInfo?.tests?.stageTest?.status !== 'עבר/ה בהצטיינות'
    ) {
      // If current stage is not at max, auto-increment it
      if (academicInfo.currentStage < 8) {
        updateAcademicInfo('currentStage', academicInfo.currentStage + 1);
      }
    }
  };

  return (
    <div className='form-section'>
      <h3>מידע אקדמי</h3>

      {/* Instrument and Stage in one row */}
      <div className='form-row two-columns'>
        <div className='form-group'>
          <label htmlFor='instrument'>כלי נגינה *</label>
          <select
            id='instrument'
            name='instrument'
            value={academicInfo?.instrument || ''}
            onChange={handleAcademicInfoChange}
            className={errors['academicInfo.instrument'] ? 'is-invalid' : ''}
            required
          >
            {validInstruments.map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
          </select>
          {errors['academicInfo.instrument'] && (
            <div className='form-error'>
              {errors['academicInfo.instrument']}
            </div>
          )}
        </div>

        <div className='form-group'>
          <label htmlFor='currentStage'>שלב נוכחי *</label>
          <select
            id='currentStage'
            name='currentStage'
            value={academicInfo?.currentStage || 1}
            onChange={handleAcademicInfoChange}
            className={errors['academicInfo.currentStage'] ? 'is-invalid' : ''}
            required
          >
            {validStages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
          {errors['academicInfo.currentStage'] && (
            <div className='form-error'>
              {errors['academicInfo.currentStage']}
            </div>
          )}
        </div>
      </div>

      {/* Tests Section */}
      <h4>מבחנים</h4>
      <div className='form-row two-columns'>
        <div className='form-group'>
          <label htmlFor='technicalTestStatus'>מבחן טכני</label>
          <select
            id='technicalTestStatus'
            name='status'
            value={academicInfo?.tests?.technicalTest?.status || 'לא נבחן'}
            onChange={(e) => handleTestChange('technicalTest', 'status', e)}
          >
            {testStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className='form-group'>
          <label htmlFor='stageTestStatus'>מבחן שלב</label>
          <select
            id='stageTestStatus'
            name='status'
            value={academicInfo?.tests?.stageTest?.status || 'לא נבחן'}
            onChange={handleStageTestStatusChange}
          >
            {/* Show basic options always */}
            <option value='לא נבחן'>לא נבחן</option>
            <option value='לא עבר/ה'>לא עבר/ה</option>
            <option value='עבר/ה'>עבר/ה</option>

            {/* Show extended options only when test is passed */}
            {isStageTestPassed && (
              <>
                <option value='עבר/ה בהצלחה'>עבר/ה בהצלחה</option>
                <option value='עבר/ה בהצטיינות'>עבר/ה בהצטיינות</option>
              </>
            )}
          </select>

          {/* Show second dropdown for additional options if 'עבר/ה' is selected */}
          {academicInfo?.tests?.stageTest?.status === 'עבר/ה' && (
            <div className='form-group mt-2'>
              <label htmlFor='stageTestPassType'>סוג הצלחה</label>
              <select
                id='stageTestPassType'
                className='pass-type-select'
                value=''
                onChange={(e) => {
                  if (e.target.value) {
                    updateTestInfo(
                      'stageTest',
                      'status',
                      `עבר/ה ${e.target.value}`
                    );
                  }
                }}
              >
                <option value=''>בחר סוג הצלחה</option>
                <option value='בהצלחה'>בהצלחה</option>
                <option value='בהצטיינות'>בהצטיינות</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Test Details - Show only if test status is not 'לא נבחן' */}
      {academicInfo?.tests?.technicalTest?.status !== 'לא נבחן' && (
        <div className='form-row full-width'>
          <div className='form-group'>
            <label htmlFor='technicalTestNotes'>הערות למבחן טכני</label>
            <input
              type='text'
              id='technicalTestNotes'
              name='notes'
              value={academicInfo?.tests?.technicalTest?.notes || ''}
              onChange={(e) => handleTestChange('technicalTest', 'notes', e)}
            />
          </div>
        </div>
      )}

      {academicInfo?.tests?.stageTest?.status !== 'לא נבחן' && (
        <div className='form-row full-width'>
          <div className='form-group'>
            <label htmlFor='stageTestNotes'>הערות למבחן שלב</label>
            <input
              type='text'
              id='stageTestNotes'
              name='notes'
              value={academicInfo?.tests?.stageTest?.notes || ''}
              onChange={(e) => handleTestChange('stageTest', 'notes', e)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
