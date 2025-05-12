// src/cmps/StudentForm/PersonalInfoSection.tsx
import React from 'react';
import { usePersonalInfoSection } from '../../hooks/usePersonalInfoSection';
import { StudentFormData, VALID_CLASSES } from '../../hooks/useStudentForm';

interface PersonalInfoSectionProps {
  formData: StudentFormData;
  updatePersonalInfo: (field: string, value: any) => void;
  updateAcademicInfo: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export function PersonalInfoSection({
  formData,
  updatePersonalInfo,
  updateAcademicInfo,
  errors,
}: PersonalInfoSectionProps) {
  const { personalInfo, handlePersonalInfoChange } = usePersonalInfoSection({
    formData,
    updatePersonalInfo,
    errors,
  });

  // Handle academic info changes (for class field)
  const handleAcademicInfoChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    updateAcademicInfo(name, value);
  };

  return (
    <div className='form-section personal-info-section'>
      <h3>פרטים אישיים</h3>

      {/* Full Name */}
      <div className='form-row full-width'>
        <div className='form-group'>
          <label htmlFor='fullName'>שם מלא *</label>
          <input
            type='text'
            id='fullName'
            name='fullName'
            value={personalInfo?.fullName || ''}
            onChange={handlePersonalInfoChange}
            className={errors['personalInfo.fullName'] ? 'is-invalid' : ''}
            required
          />
          {errors['personalInfo.fullName'] && (
            <div className='form-error'>{errors['personalInfo.fullName']}</div>
          )}
        </div>
      </div>

      {/* Phone and Grade - Together in one row */}
      <div className='form-row two-columns'>
        <div className='form-group'>
          <label htmlFor='phone'>טלפון</label>
          <input
            type='tel'
            id='phone'
            name='phone'
            value={personalInfo?.phone || ''}
            onChange={handlePersonalInfoChange}
            className={errors['personalInfo.phone'] ? 'is-invalid' : ''}
            placeholder='05XXXXXXXX'
          />
          {errors['personalInfo.phone'] && (
            <div className='form-error'>{errors['personalInfo.phone']}</div>
          )}
        </div>

        <div className='form-group' style={{ flex: '0.8' }}>
          <label htmlFor='class'>כיתה *</label>
          <select
            id='class'
            name='class'
            value={formData.academicInfo?.class || ''}
            onChange={handleAcademicInfoChange}
            className={errors['academicInfo.class'] ? 'is-invalid' : ''}
            required
            style={{ width: '100%' }}
          >
            {VALID_CLASSES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          {errors['academicInfo.class'] && (
            <div className='form-error'>{errors['academicInfo.class']}</div>
          )}
        </div>
      </div>

      {/* Address, Age and Class - Together in one row */}
      <div className='form-row three-columns'>
        <div className='form-group' style={{ flex: '2' }}>
          <label htmlFor='address'>כתובת</label>
          <input
            type='text'
            id='address'
            name='address'
            value={personalInfo?.address || ''}
            onChange={handlePersonalInfoChange}
          />
        </div>

        <div className='form-group' style={{ flex: '0.6' }}>
          <label htmlFor='age'>גיל</label>
          <input
            type='number'
            id='age'
            name='age'
            value={personalInfo?.age === undefined ? '' : personalInfo.age}
            onChange={handlePersonalInfoChange}
            min='6'
            max='99'
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Email stand alone full width */}
      <div className='form-group'>
        <label htmlFor='studentEmail'>אימייל תלמיד</label>
        <input
          type='email'
          id='studentEmail'
          name='studentEmail'
          value={personalInfo?.studentEmail || ''}
          onChange={handlePersonalInfoChange}
          className={errors['personalInfo.studentEmail'] ? 'is-invalid' : ''}
        />
        {errors['personalInfo.studentEmail'] && (
          <div className='form-error'>
            {errors['personalInfo.studentEmail']}
          </div>
        )}
      </div>

      <h4>פרטי הורה</h4>

      {/* Parent Name and Phone */}
      <div className='form-row two-columns'>
        <div className='form-group'>
          <label htmlFor='parentName'>שם הורה</label>
          <input
            type='text'
            id='parentName'
            name='parentName'
            value={personalInfo?.parentName || ''}
            onChange={handlePersonalInfoChange}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='parentPhone'>טלפון הורה</label>
          <input
            type='tel'
            id='parentPhone'
            name='parentPhone'
            value={personalInfo?.parentPhone || ''}
            onChange={handlePersonalInfoChange}
            className={errors['personalInfo.parentPhone'] ? 'is-invalid' : ''}
            placeholder='05XXXXXXXX'
          />
          {errors['personalInfo.parentPhone'] && (
            <div className='form-error'>
              {errors['personalInfo.parentPhone']}
            </div>
          )}
        </div>
      </div>

      {/* Parent Email */}
      <div className='form-row full-width'>
        <div className='form-group'>
          <label htmlFor='parentEmail'>אימייל הורה</label>
          <input
            type='email'
            id='parentEmail'
            name='parentEmail'
            value={personalInfo?.parentEmail || ''}
            onChange={handlePersonalInfoChange}
            className={errors['personalInfo.parentEmail'] ? 'is-invalid' : ''}
          />
          {errors['personalInfo.parentEmail'] && (
            <div className='form-error'>
              {errors['personalInfo.parentEmail']}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
