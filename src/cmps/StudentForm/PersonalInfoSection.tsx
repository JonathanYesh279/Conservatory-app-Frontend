// src/cmps/StudentForm/PersonalInfoSection.tsx
import { useFormikContext } from 'formik';
import { FormField } from '../FormComponents/FormField';
import { VALID_CLASSES } from '../../constants/formConstants';
import { StudentFormData } from '../../constants/formConstants';

export function PersonalInfoSection() {
  useFormikContext<StudentFormData>();
  
  return (
    <div className='form-section personal-info-section'>
      <h3>פרטים אישיים</h3>

      {/* Full Name */}
      <div className='form-row full-width'>
        <FormField
          label="שם מלא"
          name="personalInfo.fullName"
          type="text"
          required
        />
      </div>

      {/* Phone and Grade - Together in one row */}
      <div className='form-row two-columns'>
        <FormField
          label="טלפון"
          name="personalInfo.phone"
          type="tel"
          placeholder="05XXXXXXXX"
          required
        />

        <FormField
          label="כיתה"
          name="academicInfo.class"
          as="select"
          required
<<<<<<< Updated upstream
          className="class-select"
=======
          style={{ flex: '0.8' }}
>>>>>>> Stashed changes
        >
          {VALID_CLASSES.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </FormField>
      </div>

      {/* Address, Age and Class - Together in one row */}
      <div className='form-row three-columns'>
        <FormField
          label="כתובת"
          name="personalInfo.address"
          type="text" 
          required
          style={{ flex: '2' }}
        />

        <FormField
          label="גיל"
          name="personalInfo.age"
          as="select"
          required
<<<<<<< Updated upstream
          className="age-select"
=======
          style={{ flex: '0.6' }}
>>>>>>> Stashed changes
        >
          <option value="">בחר גיל</option>
          {Array.from({ length: 97 }, (_, i) => i + 3).map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </FormField>
      </div>

      {/* Email stand alone full width */}
      <FormField
        label="אימייל תלמיד"
        name="personalInfo.studentEmail"
        type="email"
        required
      />

      <h4>פרטי הורה</h4>

      {/* Parent Name and Phone */}
      <div className='form-row two-columns'>
        <FormField
          label="שם הורה"
          name="personalInfo.parentName"
          type="text"
        />

        <FormField
          label="טלפון הורה"
          name="personalInfo.parentPhone"
          type="tel"
          placeholder="05XXXXXXXX"
        />
      </div>

      {/* Parent Email */}
      <div className='form-row full-width'>
        <FormField
          label="אימייל הורה"
          name="personalInfo.parentEmail"
          type="email"
        />
      </div>
    </div>
  );
}