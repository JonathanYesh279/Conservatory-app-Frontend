import { useAcademicInfoSection } from '../../hooks/useAcademicInfoSection';
import { StudentFormData } from '../../hooks/useStudentForm';

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
    handleAcademicInfoChange,
    handleTestChange,
  } = useAcademicInfoSection({
    formData,
    updateAcademicInfo,
    updateTestInfo,
    errors,
  });

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
            onChange={(e) => handleTestChange('stageTest', 'status', e)}
          >
            {testStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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
