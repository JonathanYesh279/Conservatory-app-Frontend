// src/cmps/StudentForm/StudentForm.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Formik, Form, FormikHelpers } from 'formik';
import { Student } from '../../services/studentService';
import { PersonalInfoSection } from './PersonalInfoSection';
import { InstrumentSection } from './InstrumentSection';
import { TeacherAssignmentSection } from './TeacherAssignmentSection';
import { OrchestraAssignmentSection } from './OrchestraAssignmentSection';
import { studentValidationSchema } from '../../validations/studentValidation';
import { useStudentApiService } from '../../hooks/useStudentApiService';
import { useSchoolYearStore } from '../../store/schoolYearStore';

// Import from constants file
import {
  VALID_CLASSES,
  DAYS_OF_WEEK,
  StudentFormData,
} from '../../constants/formConstants';

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
  const { currentSchoolYear } = useSchoolYearStore();
  const [formError, setFormError] = useState<string | null>(null);
  const { saveStudentData, isSubmitting, error } = useStudentApiService({
    onClose,
    onStudentCreated,
  });
  
  // Create initial form state based on props
  const createInitialFormData = (): StudentFormData => {
    if (student?._id) {
      // Populate form for existing student
      return {
        _id: student._id,
        personalInfo: {
          fullName: student.personalInfo?.fullName || '',
          phone: student.personalInfo?.phone || '',
          age: student.personalInfo?.age,
          address: student.personalInfo?.address || '',
          parentName: student.personalInfo?.parentName || '',
          parentPhone: student.personalInfo?.parentPhone || '',
          parentEmail: student.personalInfo?.parentEmail || '',
          studentEmail: student.personalInfo?.studentEmail || '',
        },
        academicInfo: {
          instrumentProgress: student.academicInfo?.instrumentProgress || [],
          class: student.academicInfo?.class || VALID_CLASSES[0],
        },
        enrollments: {
          orchestraIds: student.enrollments?.orchestraIds || [],
          ensembleIds: student.enrollments?.ensembleIds || [],
          schoolYears: student.enrollments?.schoolYears || [],
        },
        teacherIds: student.teacherIds || [],
        teacherAssignments: [], // Will be populated from teacher data if available
        orchestraAssignments:
          student.enrollments?.orchestraIds?.map((id) => ({
            orchestraId: id,
          })) || [],
        isActive: student.isActive !== false,
      };
    } else {
      // Create new student with default values
      const newStudent: StudentFormData = {
        personalInfo: {
          fullName: '',
          phone: '',
          age: 0,
          address: '',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          studentEmail: '',
        },
        academicInfo: {
          instrumentProgress: [],
          class: 'א',
        },
        enrollments: {
          orchestraIds: [],
          ensembleIds: [],
          schoolYears: [],
        },
        teacherIds: [],
        teacherAssignments: [],
        orchestraAssignments: [],
        isActive: true,
      };

      // Add current school year
      if (currentSchoolYear) {
        newStudent.enrollments.schoolYears = [
          { schoolYearId: currentSchoolYear._id, isActive: true },
        ];
      }

      // Handle new teacher case
      if (newTeacherInfo) {
        newStudent.teacherAssignments = [
          {
            teacherId: newTeacherInfo._id || 'new-teacher',
            day: DAYS_OF_WEEK[0],
            time: '08:00',
            duration: 45,
          },
        ];
      }

      return newStudent;
    }
  };

  // Handle form submission
  const handleSubmit = async (
    values: StudentFormData,
    formikHelpers: FormikHelpers<StudentFormData>
  ) => {
    try {
      setFormError(null);
      
      // Prepare student data for submission
      const studentData: Partial<Student> = {
        _id: values._id,
        personalInfo: {
          ...values.personalInfo,
          parentName: values.personalInfo.parentName || 'לא צוין',
          parentPhone: values.personalInfo.parentPhone || '0500000000',
          parentEmail: values.personalInfo.parentEmail || 'parent@example.com',
          studentEmail: values.personalInfo.studentEmail || 'student@example.com',
        },
        academicInfo: {
          instrumentProgress: values.academicInfo.instrumentProgress,
          class: values.academicInfo.class,
        },
        isActive: values.isActive,
      };

      // Save student data
      await saveStudentData(studentData, values);
      
      // Reset form state
      formikHelpers.resetForm();
      
      // Close form is handled by the API service via onClose prop
    } catch (err) {
      console.error('Error during form submission:', err);
      setFormError(err instanceof Error ? err.message : 'שגיאה בשמירת תלמיד');
      formikHelpers.setSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    onClose();
  };

  // Hide the form if not open
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
        {formError && <div className='error-message'>{formError}</div>}

        <Formik
          initialValues={createInitialFormData()}
          validationSchema={studentValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, isSubmitting: formikSubmitting, errors, touched }) => (
            <Form>
              {/* Personal Information Section */}
              <PersonalInfoSection />

              {/* Instrument Section */}
              <InstrumentSection />

              {/* Teacher Assignment Section */}
              <TeacherAssignmentSection 
                newTeacherInfo={newTeacherInfo}
              />

              {/* Orchestra Assignment Section */}
              <OrchestraAssignmentSection />

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