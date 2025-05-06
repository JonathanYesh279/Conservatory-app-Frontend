// src/hooks/useStudentForm.ts
import { useState, useEffect, useCallback } from 'react'
import { useSchoolYearStore } from '../store/schoolYearStore'
import { Student } from '../services/studentService'
import { useFormValidation } from './useFormValidation'
import { useInstrumentSection } from './useInstrumentSection'
import { useTeacherSection } from './useTeacherSection'
import { useOrchestraSection } from './useOrchestraSection'
import { useStudentApiService } from './useStudentApiService'

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
]
export const VALID_STAGES = [1, 2, 3, 4, 5, 6, 7, 8]
export const VALID_INSTRUMENTS = [
  'חצוצרה',
  'חליל צד',
  'קלרינט',
  'קרן יער',
  'בריטון',
  'טרומבון',
  'סקסופון',
  'אבוב',
]
export const TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה']
export const EXTENDED_TEST_STATUSES = ['לא נבחן', 'עבר/ה', 'לא עבר/ה', 'עבר/ה בהצלחה', 'עבר/ה בהצטיינות']
export const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
export const LESSON_DURATIONS = [30, 45, 60]

// Teacher assignment interface - using correct field names that match the backend
export interface TeacherAssignment {
  teacherId: string
  day: string
  time: string
  duration: number
}

// Orchestra assignment interface
export interface OrchestraAssignment {
  orchestraId: string
}

// Instrument assignment interface
export interface InstrumentAssignment {
  id: string
  name: string
  isPrimary: boolean
}

// Define comprehensive type for student form data
export interface StudentFormData {
  _id?: string
  personalInfo: {
    fullName: string
    phone?: string
    age?: number
    address?: string
    parentName?: string
    parentPhone?: string
    parentEmail?: string
    studentEmail?: string
  }
  academicInfo: {
    instruments: InstrumentAssignment[]
    currentStage: number
    class: string
    tests?: {
      stageTest?: {
        status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה' | 'עבר/ה בהצלחה' | 'עבר/ה בהצטיינות'
        lastTestDate?: string
        nextTestDate?: string
        notes?: string
      }
      technicalTest?: {
        status: 'לא נבחן' | 'עבר/ה' | 'לא עבר/ה'
        lastTestDate?: string
        nextTestDate?: string
        notes?: string
      }
    }
  }
  enrollments: {
    orchestraIds: string[]
    ensembleIds: string[]
    schoolYears: Array<{
      schoolYearId: string
      isActive: boolean
    }>
  }
  teacherIds: string[]
  teacherAssignments: TeacherAssignment[]
  orchestraAssignments: OrchestraAssignment[]
  isActive: boolean
}

// Props for the hook
interface UseStudentFormProps {
  student?: Partial<Student>
  onClose: () => void
  onStudentCreated?: (student: Student) => void
  newTeacherInfo?: {
    _id?: string
    fullName: string
    instrument?: string
  } | null
}

// Generate unique ID helper
function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// The main hook - now much smaller with logic delegated to specialized hooks
export function useStudentForm({
  student,
  onClose,
  onStudentCreated,
  newTeacherInfo,
}: UseStudentFormProps) {
  const { currentSchoolYear } = useSchoolYearStore();

  // Form data state
  const [formData, setFormData] = useState<StudentFormData>(
    createInitialFormData()
  );

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get validation hook
  const { validateStudentForm } = useFormValidation();

  // API service
  const { saveStudentData, isSubmitting, error } = useStudentApiService({
    onClose,
    onStudentCreated,
    newTeacherInfo,
  });

  // Create a generic update function for nested field updates
  const updateFormData = useCallback((setter: (prev: any) => any) => {
    setFormData(setter);
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

  // Get instrument section functions
  const {
    addInstrument,
    removeInstrument,
    setPrimaryInstrument,
    isPrimaryInstrument,
  } = useInstrumentSection({
    instruments: formData.academicInfo.instruments,
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
        instruments: [], // Initialize as empty array - no default instrument
        currentStage: 1,
        class: VALID_CLASSES[0],
        tests: {
          stageTest: {
            status: 'לא נבחן',
            lastTestDate: undefined,
            nextTestDate: undefined,
            notes: '',
          },
          technicalTest: {
            status: 'לא נבחן',
            lastTestDate: undefined,
            nextTestDate: undefined,
            notes: '',
          },
        },
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

  // Initialize form data when component mounts or when student prop changes
  useEffect(() => {
    if (student?._id) {
      // Populate form for existing student
      const instruments = student.academicInfo?.instruments
        ? student.academicInfo.instruments.map((name, idx) => ({
            id: generateId(),
            name,
            isPrimary: name === student.academicInfo?.instrument || idx === 0,
          }))
        : student.academicInfo?.instrument
        ? [
            {
              id: generateId(),
              name: student.academicInfo.instrument,
              isPrimary: true,
            },
          ]
        : [];

      setFormData({
        _id: student._id,
        personalInfo: {
          fullName: student.personalInfo?.fullName || '',
          phone: student.personalInfo?.phone,
          age: student.personalInfo?.age,
          address: student.personalInfo?.address,
          parentName: student.personalInfo?.parentName,
          parentPhone: student.personalInfo?.parentPhone,
          parentEmail: student.personalInfo?.parentEmail,
          studentEmail: student.personalInfo?.studentEmail,
        },
        academicInfo: {
          instruments: instruments.length
            ? instruments
            : [
                {
                  id: generateId(),
                  name: VALID_INSTRUMENTS[0],
                  isPrimary: true,
                },
              ],
          currentStage: student.academicInfo?.currentStage || 1,
          class: student.academicInfo?.class || VALID_CLASSES[0],
          tests: {
            stageTest: {
              status:
                student.academicInfo?.tests?.stageTest?.status || 'לא נבחן',
              lastTestDate:
                student.academicInfo?.tests?.stageTest?.lastTestDate,
              nextTestDate:
                student.academicInfo?.tests?.stageTest?.nextTestDate,
              notes: student.academicInfo?.tests?.stageTest?.notes || '',
            },
            technicalTest: {
              status:
                student.academicInfo?.tests?.technicalTest?.status || 'לא נבחן',
              lastTestDate:
                student.academicInfo?.tests?.technicalTest?.lastTestDate,
              nextTestDate:
                student.academicInfo?.tests?.technicalTest?.nextTestDate,
              notes: student.academicInfo?.tests?.technicalTest?.notes || '',
            },
          },
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
      });
    } else {
      // Reset form for new student with proper defaults
      const initialData = createInitialFormData();

      // Add current school year
      if (currentSchoolYear) {
        initialData.enrollments.schoolYears = [
          { schoolYearId: currentSchoolYear._id, isActive: true },
        ];
      }

      // Handle new teacher case
      if (newTeacherInfo) {
        initialData.teacherAssignments = [
          {
            teacherId: newTeacherInfo._id || 'new-teacher', // Use actual ID if available
            day: DAYS_OF_WEEK[0],
            time: '08:00',
            duration: 45,
          },
        ];
      }

      setFormData(initialData);
    }

    setErrors({});
  }, [student, currentSchoolYear, newTeacherInfo]);

  // Update personal info
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

  // Update academic info
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

  // Update test info with auto-increment logic
  const updateTestInfo = useCallback(
    (testType: 'stageTest' | 'technicalTest', field: string, value: any) => {
      setFormData((prev) => {
        // Create the updated form data
        const updatedFormData = {
          ...prev,
          academicInfo: {
            ...prev.academicInfo,
            tests: {
              ...prev.academicInfo.tests,
              [testType]: {
                ...prev.academicInfo.tests?.[testType],
                [field]: value,
              },
            },
          },
        };

        // Check if we need to auto-increment the stage
        if (
          testType === 'stageTest' &&
          field === 'status' &&
          (value === 'עבר/ה' ||
            value === 'עבר/ה בהצלחה' ||
            value === 'עבר/ה בהצטיינות') &&
          prev.academicInfo.tests?.stageTest?.status === 'לא נבחן' &&
          prev.academicInfo.currentStage < 8 // Don't increment beyond max
        ) {
          // Auto-increment the stage
          updatedFormData.academicInfo.currentStage =
            prev.academicInfo.currentStage + 1;
        }

        return updatedFormData;
      });
    },
    []
  );

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
        const studentData: Partial<Student> = {
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
            // Extract primary instrument for backward compatibility
            instrument:
              formData.academicInfo.instruments.find((i) => i.isPrimary)
                ?.name ||
              formData.academicInfo.instruments[0]?.name ||
              VALID_INSTRUMENTS[0],
            instruments: formData.academicInfo.instruments.map((i) => i.name), // Save all instruments as an array
            currentStage: formData.academicInfo.currentStage,
            class: formData.academicInfo.class,
            tests: formData.academicInfo.tests,
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

        // Use API service to save student data
        await saveStudentData(studentData, formData);
      } catch (err) {
        console.error('Error during form submission:', err);
        setErrors((prev) => ({
          ...prev,
          form: err instanceof Error ? err.message : 'שגיאה בשמירת תלמיד',
        }));
      }
    },
    [formData, validateForm, saveStudentData]
  );

  return {
    formData,
    errors,
    isSubmitting,
    error,

    // Update functions
    updatePersonalInfo,
    updateAcademicInfo,
    updateTestInfo,
    addTeacherAssignment,
    removeTeacherAssignment,
    addOrchestraAssignment,
    removeOrchestraAssignment,
    addInstrument,
    removeInstrument,
    setPrimaryInstrument,
    isPrimaryInstrument,
    setFormData,

    // Form submission
    validateForm,
    handleSubmit,
  };
}