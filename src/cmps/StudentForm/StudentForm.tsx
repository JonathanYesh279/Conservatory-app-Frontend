// src/cmps/StudentForm/StudentForm.tsx
import { X } from 'lucide-react';
import { Formik, Form } from 'formik';
import { Student } from '../../services/studentService';
import { useStudentForm } from '../../hooks/useStudentForm';
import { PersonalInfoSection } from './PersonalInfoSection';
import { InstrumentSection } from './InstrumentSection';
import { TeacherAssignmentSection } from './TeacherAssignmentSection';
import { OrchestraAssignmentSection } from './OrchestraAssignmentSection';
import { studentValidationSchema } from '../../validations/studentValidation';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Partial<Student>;
  onStudentCreated?: (student: Student) => void;
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

export function StudentForm({
  isOpen,
  onClose,
  student,
  onStudentCreated,
  newTeacherInfo,
}: StudentFormProps) {
  // Get all necessary functions from the hook
  const {
    formData,
    errors,
    isSubmitting,
    error,
    updatePersonalInfo,
    updateAcademicInfo,
    addTeacherAssignment,
    removeTeacherAssignment,
    addOrchestraAssignment,
    removeOrchestraAssignment,
    addInstrument,
    removeInstrument,
    setPrimaryInstrument,
    updateInstrumentProgress,
    updateInstrumentTest,
    handleSubmit, // Keep the original handleSubmit function
    handleCancel,
  } = useStudentForm({
    student,
    onClose,
    onStudentCreated,
    newTeacherInfo,
    isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className='student-form'>
      <div className='overlay' onClick={handleCancel}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={handleCancel}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>{student?._id ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}</h2>

        {error && (
          <div className='error-message'>{error.message || String(error)}</div>
        )}
        {errors.form && <div className='error-message'>{errors.form}</div>}

        <Formik
          initialValues={formData}
          validationSchema={studentValidationSchema}
          onSubmit={handleSubmit} // Use the existing handleSubmit function
          enableReinitialize
        >
          {({ isSubmitting: formikSubmitting }) => (
            <Form>
              {/* Personal Information Section */}
              <PersonalInfoSection
                formData={formData}
                updatePersonalInfo={updatePersonalInfo}
                updateAcademicInfo={updateAcademicInfo}
                errors={errors}
              />

              {/* Instrument Section */}
              <InstrumentSection
                instruments={formData.academicInfo.instrumentProgress}
                addInstrument={addInstrument}
                removeInstrument={removeInstrument}
                setPrimaryInstrument={setPrimaryInstrument}
                updateInstrumentProgress={updateInstrumentProgress}
                updateInstrumentTest={updateInstrumentTest}
                errors={errors}
                isFormOpen={isOpen}
                isSubmitting={isSubmitting || formikSubmitting}
              />

              {/* Teacher Assignment Section */}
              <TeacherAssignmentSection
                formData={formData}
                newTeacherInfo={newTeacherInfo}
                addTeacherAssignment={addTeacherAssignment}
                removeTeacherAssignment={removeTeacherAssignment}
                errors={errors}
              />

              {/* Orchestra Assignment Section */}
              <OrchestraAssignmentSection
                formData={formData}
                addOrchestraAssignment={addOrchestraAssignment}
                removeOrchestraAssignment={removeOrchestraAssignment}
                errors={errors}
              />

              {/* Form Actions */}
              <div className='form-actions'>
                <button
                  type='submit'
                  className='btn primary'
                  disabled={isSubmitting || formikSubmitting}
                >
                  {isSubmitting || formikSubmitting
                    ? 'שומר...'
                    : student?._id
                    ? 'עדכון'
                    : 'הוספה'}
                </button>

                <button
                  type='button'
                  className='btn secondary'
                  onClick={handleCancel}
                  disabled={isSubmitting || formikSubmitting}
                >
                  ביטול
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
