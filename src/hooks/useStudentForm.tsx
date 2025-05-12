// src/hooks/useStudentForm.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { Student, InstrumentProgress } from '../services/studentService';
import { useFormValidation } from './useFormValidation';
import { useInstrumentSection } from './useInstrumentSection';
import { useTeacherSection } from './useTeacherSection';
import { useOrchestraSection } from './useOrchestraSection';
import { useStudentApiService } from './useStudentApiService';

// Export constants for use in other components
export const VALID_CLASSES = [
  'א',
  'ב',
  'ג',
  'ד',
  'ה',
  'ו',
  'ז',
  'ח',
  'ט',
  'י',
  'יא',
  'יב',
  'אחר',
];
export const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8];
export const VALID_INSTRUMENTS = [
  'חצוצרה',
  'חליל צד',
  'קלרינט',
  'קרן יער',
  'בריטון',
  'טרומבון',
  'סקסופון',
  'אבוב',
];
export const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה'];
export const EXTENDED_TEST_STATUSES = [
  'לא נבחן',
  'עבר/ה',
  'לא עבר/ה',
  'עבר/ה בהצלחה',
  'עבר/ה בהצטיינות',
];
export const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
export const LESSON_DURATIONS = [30, 45, 60];

// Teacher assignment interface
export interface TeacherAssignment {
  teacherId: string;
  day: string;
  time: string;
  duration: number;
}

// Orchestra assignment interface
export interface OrchestraAssignment {
  orchestraId: string;
}

// Define comprehensive type for student form data with new structure
export interface StudentFormData {
  _id?: string;
  personalInfo: {
    fullName: string;
    phone?: string;
    age?: number;
    address?: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    studentEmail?: string;
  };
  academicInfo: {
    instrumentProgress: InstrumentProgress[];
    class: string;
  };
  enrollments: {
    orchestraIds: string[];
    ensembleIds: string[];
    schoolYears: Array<{
      schoolYearId: string;
      isActive: boolean;
    }>;
  };
  teacherIds: string[];
  teacherAssignments: TeacherAssignment[];
  orchestraAssignments: OrchestraAssignment[];
  isActive: boolean;
}

// Props for the hook
interface UseStudentFormProps {
  student?: Partial<Student>;
  onClose: () => void;
  onStudentCreated?: (student: Student) => void;
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
  isOpen: boolean; // New prop to track form open state
}

// The main hook
export function useStudentForm({
  student,
  onClose,
  onStudentCreated,
  newTeacherInfo,
  isOpen,
}: UseStudentFormProps) {
  const { currentSchoolYear } = useSchoolYearStore();

  // Initialize with empty form data
  const [formData, setFormData] = useState<StudentFormData>(
    createInitialFormData()
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if we should initialize from the student prop
  const [shouldInitFromStudent, setShouldInitFromStudent] = useState(true);

  // API service
  const { saveStudentData, isSubmitting, error } = useStudentApiService({
    onClose,
    onStudentCreated,
    newTeacherInfo,
  });

  // Create a generic update function for nested field updates
  const updateFormData = useCallback((setter: (prev: any) => any) => {
    // Important: Always mutate a copy of the previous state
    setFormData((prev) => {
      const updated = setter({ ...prev });
      return updated;
    });
  }, []);

  // Helper to clear error fields
  const clearError = useCallback(
    (field: string) => {
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  // Create initial form data
  function createInitialFormData(): StudentFormData {
    return {
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
        instrumentProgress: [], // Start with empty array - no default instrument
        class: VALID_CLASSES[0],
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
  }

  // IMPROVED: STRONG RESET MECHANISM
  const resetForm = useCallback(() => {
    // Create a completely fresh initial data
    const initialData = createInitialFormData();

    // Add current school year
    if (currentSchoolYear) {
      initialData.enrollments.schoolYears = [
        { schoolYearId: currentSchoolYear._id, isActive: true },
      ];
    }

    // Set the form data to the fresh initial state
    setFormData(initialData);

    // Clear all errors
    setErrors({});

    console.log('Form completely reset to initial state');
  }, [currentSchoolYear]);

  // Initialize or reset form data when component mounts or when the isOpen prop changes
  useEffect(() => {
    // If the form is closed, reset it completely
    if (!isOpen) {
      // This sets up the form to be freshly initialized when it opens again
      setShouldInitFromStudent(true);
      return;
    }

    // If the form is opening and we should initialize from student
    if (isOpen && shouldInitFromStudent) {
      if (student?._id) {
        // Populate form for existing student
        // IMPORTANT: Include _id in the form data when updating an existing student
        const newFormData = {
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

        setFormData(newFormData);
      } else {
        // Reset form for new student with proper defaults
        resetForm();

        // Handle new teacher case
        if (newTeacherInfo) {
          setFormData((prev) => ({
            ...prev,
            teacherAssignments: [
              {
                teacherId: newTeacherInfo._id || 'new-teacher',
                day: DAYS_OF_WEEK[0],
                time: '08:00',
                duration: 45,
              },
            ],
          }));
        }
      }

      // We've initialized, so don't do it again until the form is closed and reopened
      setShouldInitFromStudent(false);
    }
  }, [
    isOpen,
    student,
    newTeacherInfo,
    resetForm,
    shouldInitFromStudent,
    currentSchoolYear,
  ]);

  // Get instrument section hooks
  const {
    addInstrument,
    removeInstrument,
    setPrimaryInstrument,
    updateInstrumentProgress,
    updateInstrumentTest,
  } = useInstrumentSection({
    instrumentProgress: formData.academicInfo.instrumentProgress,
    updateFormData,
    clearError,
  });

  // Get teacher section functions
  const { addTeacherAssignment, removeTeacherAssignment } = useTeacherSection({
    updateFormData,
  });

  // Get orchestra section functions
  const { addOrchestraAssignment, removeOrchestraAssignment } =
    useOrchestraSection({
      updateFormData,
    });

  // Update personal info - FIX: simpler implementation to avoid potential issues
  const updatePersonalInfo = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value,
        },
      }));

      // Clear error if exists
      clearError(`personalInfo.${field}`);
    },
    [clearError]
  );

  // Update academic info - FIX: simpler implementation
  const updateAcademicInfo = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        academicInfo: {
          ...prev.academicInfo,
          [field]: value,
        },
      }));

      // Clear error if exists
      clearError(`academicInfo.${field}`);
    },
    [clearError]
  );

  // Get validation hook
  const { validateStudentForm } = useFormValidation();

  // Validate form and handle submission
  const validateForm = useCallback((): boolean => {
    const newErrors = validateStudentForm(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateStudentForm]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        // Prepare student data for submission
        // IMPORTANT: Always include the _id field when it exists for updates
        const studentData: Partial<Student> = {
          _id: formData._id, // Include the _id for existing students
          personalInfo: {
            ...formData.personalInfo,
            parentName: formData.personalInfo.parentName || 'לא צוין',
            parentPhone: formData.personalInfo.parentPhone || '0500000000',
            parentEmail:
              formData.personalInfo.parentEmail || 'parent@example.com',
            studentEmail:
              formData.personalInfo.studentEmail || 'student@example.com',
          },
          academicInfo: {
            instrumentProgress: formData.academicInfo.instrumentProgress,
            class: formData.academicInfo.class,
          },
          enrollments: {
            ...formData.enrollments,
            orchestraIds: formData.orchestraAssignments.map(
              (a) => a.orchestraId
            ),
          },
          teacherIds: formData.teacherIds.filter((id) => id !== 'new-teacher'),
          isActive: formData.isActive,
        };

        // Log the data being sent for debugging
        console.log('Submitting student data:', studentData);
        if (studentData._id) {
          console.log('UPDATING existing student with ID:', studentData._id);
        } else {
          console.log('Creating NEW student');
        }

        // Use API service to save student data
        await saveStudentData(studentData, formData);

        // After successful save, force reset
        resetForm();
      } catch (err) {
        console.error('Error during form submission:', err);
        setErrors((prev) => ({
          ...prev,
          form: err instanceof Error ? err.message : 'שגיאה בשמירת תלמיד',
        }));
      }
    },
    [formData, validateForm, saveStudentData, resetForm]
  );

  // Handler for cancel button
  const handleCancel = useCallback(() => {
    // Reset the form first
    resetForm();
    // Then close the form
    onClose();
  }, [resetForm, onClose]);

  return {
    formData,
    errors,
    isSubmitting,
    error,

    // Update functions
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

    // Form actions
    resetForm,
    handleCancel,
    validateForm,
    handleSubmit,
  };
}
