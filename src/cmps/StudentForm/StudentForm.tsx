// src/cmps/StudentForm/StudentForm.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { Formik, Form, FormikHelpers } from 'formik';
import { Student } from '../../services/studentService';
import { PersonalInfoSection } from './PersonalInfoSection';
import { InstrumentSection } from './InstrumentSection';
// import { TeacherAssignmentSection } from './TeacherAssignmentSection';
import { StudentLessonScheduler } from './StudentLessonScheduler';
import { OrchestraAssignmentSection } from './OrchestraAssignmentSection';
import { TheoryLessonAssignmentSection } from './TheoryLessonAssignmentSection';
import { studentValidationSchema } from '../../validations/studentValidation';
import { useStudentApiService } from '../../hooks/useStudentApiService';
import { useSchoolYearStore } from '../../store/schoolYearStore';
import { LessonDuration } from '../../types/schedule';

// Import from constants file
import {
  VALID_CLASSES,
  // DAYS_OF_WEEK,
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

  // Accessibility hook
  const { modalProps, titleProps, descriptionProps } = useModalAccessibility({
    isOpen,
    onClose,
    modalId: 'student-form',
    restoreFocusOnClose: true
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
          theoryLessonIds: student.enrollments?.theoryLessonIds || [],
        },
        teacherIds: student.teacherIds || [],
        teacherAssignments: (student.teacherAssignments || []).map(assignment => ({
          ...assignment,
          day: assignment.day as any, // Type assertion for Hebrew day names
          duration: assignment.duration as LessonDuration,
        })), // Load existing teacher assignments
        orchestraAssignments:
          student.enrollments?.orchestraIds?.map((id) => ({
            orchestraId: id,
          })) || [],
        theoryLessonAssignments:
          student.enrollments?.theoryLessonIds?.map((id) => ({
            theoryLessonId: id,
          })) || [],
        isActive: student.isActive !== false,
      };
    } else {
      // Create new student with default values
      const newStudent: StudentFormData = {
        personalInfo: {
          fullName: '',
          phone: '',
          age: undefined,
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
          theoryLessonIds: [],
        },
        teacherIds: [],
        teacherAssignments: [],
        orchestraAssignments: [],
        theoryLessonAssignments: [],
        isActive: true,
      };

      // Add current school year
      if (currentSchoolYear) {
        newStudent.enrollments.schoolYears = [
          { schoolYearId: currentSchoolYear._id, isActive: true },
        ];
      }

      // Note: newTeacherInfo is available in the teacher assignment component
      // but we don't auto-assign - let the user manually choose

      return newStudent;
    }
  };

  // Handle form submission
  const handleSubmit = async (
    values: StudentFormData,
    formikHelpers: FormikHelpers<StudentFormData>
  ) => {
    console.log('🚀 StudentForm.handleSubmit called');
    
    try {
      setFormError(null);
      
      // Prepare student data for submission
      const studentData: Partial<Student> = {
        _id: values._id,
        personalInfo: {
          ...values.personalInfo,
          age: typeof values.personalInfo.age === 'string' ? 
            parseInt(values.personalInfo.age) || undefined : 
            values.personalInfo.age,
          parentName: values.personalInfo.parentName || 'לא צוין',
          parentPhone: values.personalInfo.parentPhone || '0500000000',
          parentEmail: values.personalInfo.parentEmail || 'parent@example.com',
          studentEmail: values.personalInfo.studentEmail || 'student@example.com',
        },
        academicInfo: {
          instrumentProgress: values.academicInfo.instrumentProgress || [],
          class: values.academicInfo.class,
        },
        isActive: values.isActive,
      };

      console.log('📝 Submitting student with', values.teacherAssignments?.length || 0, 'teacher assignments');

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
      <div className='form-modal' {...modalProps}>
        <button
          className='btn-icon close-btn'
          onClick={handleCancel}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2 {...titleProps}>{student?._id ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}</h2>
        
        {/* Hidden description for screen readers */}
        <div {...descriptionProps} className="sr-only">
          {student?._id ? 'טופס עריכת פרטי תלמיד קיים במערכת' : 'טופס הוספת תלמיד חדש למערכת'}
        </div>

        {error && (
          <div className='error-message'>{error.message || String(error)}</div>
        )}
        {formError && <div className='error-message'>{formError}</div>}

        <Formik
          initialValues={createInitialFormData()}
          validationSchema={studentValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
          validateOnMount={true}
          validateOnChange={true}
        >
          {({ isSubmitting: formikSubmitting, errors, touched, isValid, values }) => {
            
            return (
            <Form>
              {/* Personal Information Section */}
              <PersonalInfoSection />

              {/* Instrument Section */}
              <InstrumentSection />

              {/* Student Lesson Scheduler - New Enhanced Component */}
              <StudentLessonScheduler
                newTeacherInfo={newTeacherInfo}
              />

              {/* Orchestra Assignment Section */}
              <OrchestraAssignmentSection />
              
              {/* Theory Lesson Assignment Section */}
              <TheoryLessonAssignmentSection />


              {/* Form Actions */}
              <div className='form-actions'>
                <button
                  type='submit'
                  className='btn primary'
                  disabled={isSubmitting || formikSubmitting}
                  onClick={(e) => {
                    if (!isValid) {
                      // Log only essential validation errors for debugging
                      if (errors.academicInfo) {
                        console.log('📚 Academic info validation errors:', errors.academicInfo);
                      }
                      if (errors.personalInfo) {
                        console.log('👤 Personal info validation errors:', errors.personalInfo);
                      }
                      if (errors.teacherAssignments) {
                        console.log('👨‍🏫 Teacher assignment validation errors:', errors.teacherAssignments);
                      }
                      
                      // Show user-friendly error messages
                      alert('יש שגיאות בטופס. אנא בדוק את השדות המסומנים באדום ותקן אותם לפני השליחה.');
                    }
                  }}
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
            );
          }}
        </Formik>
      </div>
    </div>
  );
}