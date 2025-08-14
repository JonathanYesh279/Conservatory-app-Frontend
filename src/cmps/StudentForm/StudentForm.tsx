// src/cmps/StudentForm/StudentForm.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
<<<<<<< Updated upstream
import { ModalPortal } from '../ModalPortal';
=======
>>>>>>> Stashed changes
import { Formik, Form, FormikHelpers } from 'formik';
import { Student } from '../../services/studentService';
import { PersonalInfoSection } from './PersonalInfoSection';
import { InstrumentSection } from './InstrumentSection';
// import { TeacherAssignmentSection } from './TeacherAssignmentSection';
import { StudentLessonScheduler } from './StudentLessonScheduler';
import { OrchestraAssignmentSection } from './OrchestraAssignmentSection';
import { TheoryLessonAssignmentSection } from './TheoryLessonAssignmentSection';
<<<<<<< Updated upstream
import { createStudentValidationSchema } from '../../validations/studentValidation';
import { useStudentApiService } from '../../hooks/useStudentApiService';
import { useSchoolYearStore } from '../../store/schoolYearStore';
import { LessonDuration } from '../../types/schedule';
import { useAuth } from '../../hooks/useAuth';
import { useAuthorization, createAuthorizationContext } from '../../utils/authorization';
import { sanitizeError } from '../../utils/errorHandler';
=======
import { studentValidationSchema } from '../../validations/studentValidation';
import { useStudentApiService } from '../../hooks/useStudentApiService';
import { useSchoolYearStore } from '../../store/schoolYearStore';
import { LessonDuration } from '../../types/schedule';
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
  const { user, isAuthenticated } = useAuth();
=======
>>>>>>> Stashed changes
  const { saveStudentData, isSubmitting, error } = useStudentApiService({
    onClose,
    onStudentCreated,
  });

<<<<<<< Updated upstream
  // Initialize authorization
  const authContext = createAuthorizationContext(user, isAuthenticated);
  const auth = useAuthorization(authContext);
  
  // Check if user is admin and if this is an update operation
  const isAdminUser = auth.isAdmin();
  const isUpdateOperation = !!student?._id;

=======
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    console.log('🚀 StudentForm.handleSubmit called');
=======
    console.log('🚀 StudentForm.handleSubmit called!', values);
    console.log('🚀 Form is submitting, isSubmitting:', isSubmitting);
    console.log('🚀 Formik setSubmitting available:', typeof formikHelpers.setSubmitting);
>>>>>>> Stashed changes
    
    try {
      setFormError(null);
      
<<<<<<< Updated upstream
      // Check authorization before proceeding
      if (student?._id) {
        // Editing existing student
        auth.validateAction('update', student as Student, 'student');
      } else {
        // Adding new student
        auth.validateAction('add', undefined, 'student');
      }
      
=======
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
      console.log('📝 Submitting student with', values.teacherAssignments?.length || 0, 'teacher assignments');
=======
      console.log('📝 Student data prepared for submission:', studentData);
      console.log('📋 Teacher assignments count:', values.teacherAssignments?.length || 0);
>>>>>>> Stashed changes

      // Save student data
      await saveStudentData(studentData, values);
      
      // Reset form state
      formikHelpers.resetForm();
      
      // Close form is handled by the API service via onClose prop
    } catch (err) {
      console.error('Error during form submission:', err);
<<<<<<< Updated upstream
      
      // Use sanitized error handling
      const sanitizedError = sanitizeError(err);
      setFormError(sanitizedError.userMessage);
=======
      setFormError(err instanceof Error ? err.message : 'שגיאה בשמירת תלמיד');
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    <ModalPortal isOpen={isOpen} onClose={handleCancel} className="student-form responsive-form">
      <div className='form-modal' {...modalProps}>
        {/* Form Header with Close Button */}
        <div className='form-header'>
          <button
            className='btn-icon close-btn'
            onClick={handleCancel}
            aria-label='סגור'
            type='button'
          >
            <X size={20} />
          </button>
          <h2 {...titleProps}>{student?._id ? 'עריכת תלמיד' : 'הוספת תלמיד חדש'}</h2>
        </div>
=======
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
>>>>>>> Stashed changes
        
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
<<<<<<< Updated upstream
          validationSchema={createStudentValidationSchema(isAdminUser, isUpdateOperation)}
=======
          validationSchema={studentValidationSchema}
>>>>>>> Stashed changes
          onSubmit={handleSubmit}
          enableReinitialize
          validateOnMount={true}
          validateOnChange={true}
        >
          {({ isSubmitting: formikSubmitting, errors, touched, isValid, values }) => {
<<<<<<< Updated upstream
=======
            console.log('🔍 Formik state:', { 
              isSubmitting: formikSubmitting, 
              isValid, 
              errors: Object.keys(errors).length > 0 ? errors : 'No errors',
              touched: Object.keys(touched).length > 0 ? touched : 'No touched fields',
              hasInstruments: values.academicInfo?.instrumentProgress?.length > 0,
              hasStudentEmail: !!values.personalInfo?.studentEmail,
              instrumentCount: values.academicInfo?.instrumentProgress?.length || 0
            });
>>>>>>> Stashed changes
            
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
<<<<<<< Updated upstream
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
=======
                    console.log('🎯 Submit button clicked!', {
                      type: e.currentTarget.type,
                      disabled: e.currentTarget.disabled,
                      isSubmitting,
                      formikSubmitting,
                      isValid,
                      errors: Object.keys(errors)
                    });
                    if (!isValid) {
                      console.log('❌ Form is not valid, errors:', errors);
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    </ModalPortal>
=======
    </div>
>>>>>>> Stashed changes
  );
}