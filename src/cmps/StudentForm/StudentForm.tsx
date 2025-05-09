// src/cmps/StudentForm/StudentForm.tsx
import { X } from 'lucide-react';
import { Student } from '../../services/studentService';
import { useStudentForm } from '../../hooks/useStudentForm';
import { PersonalInfoSection } from './PersonalInfoSection';
import { InstrumentSection } from './InstrumentSection';
import { TeacherAssignmentSection } from './TeacherAssignmentSection';
import { OrchestraAssignmentSection } from './OrchestraAssignmentSection';

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
    handleSubmit,
    handleCancel, // Use the new cancel handler
    resetForm,
  } = useStudentForm({
    student,
    onClose,
    onStudentCreated,
    newTeacherInfo,
    isOpen, // Pass the isOpen prop to track form state
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

        {error && <div className='error-message'>{error}</div>}
        {errors.form && <div className='error-message'>{errors.form}</div>}

        <form onSubmit={handleSubmit}>
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
            isSubmitting={isSubmitting}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'שומר...' : student?._id ? 'עדכון' : 'הוספה'}
            </button>

            <button
              type='button'
              className='btn secondary'
              onClick={handleCancel}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
