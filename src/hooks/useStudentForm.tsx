// src/hooks/useStudentForm.ts
import { useState, useEffect, useCallback } from 'react'
import { useStudentStore } from '../store/studentStore'
import { useSchoolYearStore } from '../store/schoolYearStore'
import { Student, studentService } from '../services/studentService'
import { teacherService } from '../services/teacherService'

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
    instrument: string
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

// The main hook
export function useStudentForm({
  student,
  onClose,
  onStudentCreated,
  newTeacherInfo,
}: UseStudentFormProps) {
  const { saveStudent, isLoading, error, clearError, loadStudents } =
    useStudentStore()
  const { currentSchoolYear } = useSchoolYearStore()

  // Form data state
  const [formData, setFormData] = useState<StudentFormData>(
    createInitialFormData()
  )

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        instrument: VALID_INSTRUMENTS[0],
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
    }
  }

  // Initialize form data when component mounts or when student prop changes
  useEffect(() => {
    if (student?._id) {
      // Populate form for existing student
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
          instrument: student.academicInfo?.instrument || VALID_INSTRUMENTS[0],
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
      })
    } else {
      // Reset form for new student with proper defaults
      const initialData = createInitialFormData()

      // Add current school year
      if (currentSchoolYear) {
        initialData.enrollments.schoolYears = [
          { schoolYearId: currentSchoolYear._id, isActive: true },
        ]
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
        ]
      }

      setFormData(initialData)
    }

    setErrors({})
    clearError?.()
  }, [student, clearError, currentSchoolYear, newTeacherInfo])

  // Update personal info
  const updatePersonalInfo = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value,
        },
      }))

      // Clear error if exists
      if (errors[`personalInfo.${field}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[`personalInfo.${field}`]
          return newErrors
        })
      }
    },
    [errors]
  )

  // Update academic info
  const updateAcademicInfo = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        academicInfo: {
          ...prev.academicInfo,
          [field]: value,
        },
      }))

      // Clear error if exists
      if (errors[`academicInfo.${field}`]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[`academicInfo.${field}`]
          return newErrors
        })
      }
    },
    [errors]
  )

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
        }
        
        // Check if we need to auto-increment the stage
        if (
          testType === 'stageTest' && 
          field === 'status' && 
          (value === 'עבר/ה' || value === 'עבר/ה בהצלחה' || value === 'עבר/ה בהצטיינות') &&
          prev.academicInfo.tests?.stageTest?.status === 'לא נבחן' &&
          prev.academicInfo.currentStage < 8 // Don't increment beyond max
        ) {
          // Auto-increment the stage
          updatedFormData.academicInfo.currentStage = prev.academicInfo.currentStage + 1
        }
        
        return updatedFormData
      })
    },
    []
  )

  // Add teacher assignment - using correct field names
  const addTeacherAssignment = useCallback((assignment: TeacherAssignment) => {
    // Validate that all required fields are present
    if (
      !assignment.teacherId ||
      !assignment.day ||
      !assignment.time ||
      assignment.duration === undefined ||
      assignment.duration === null
    ) {
      console.error('Invalid teacher assignment data:', assignment)
      return // Don't add invalid assignments
    }

    setFormData((prev) => {
      // Add new assignment
      const updatedAssignments = [...prev.teacherAssignments, assignment]

      // Make sure teacherIds contains unique teacher IDs from all assignments
      const uniqueTeacherIds = Array.from(
        new Set(updatedAssignments.map((a) => a.teacherId))
      )

      return {
        ...prev,
        teacherAssignments: updatedAssignments,
        teacherIds: uniqueTeacherIds,
      }
    })
  }, [])

  // Remove teacher assignment - using correct field names
  const removeTeacherAssignment = useCallback(
    (teacherId: string, day: string, time: string) => {
      setFormData((prev) => {
        // Remove the specific assignment with matching teacherId, day and time
        const updatedAssignments = prev.teacherAssignments.filter(
          (a) =>
            !(a.teacherId === teacherId && a.day === day && a.time === time)
        )

        // Get unique teacher IDs from remaining assignments
        const remainingTeacherIds = Array.from(
          new Set(updatedAssignments.map((a) => a.teacherId))
        )

        return {
          ...prev,
          teacherAssignments: updatedAssignments,
          teacherIds: remainingTeacherIds,
        }
      })
    },
    []
  )

  // Add orchestra assignment
  const addOrchestraAssignment = useCallback((orchestraId: string) => {
    setFormData((prev) => {
      // Check if orchestra already exists
      const exists = prev.orchestraAssignments.some(
        (a) => a.orchestraId === orchestraId
      )

      if (exists) return prev // Already assigned

      return {
        ...prev,
        orchestraAssignments: [...prev.orchestraAssignments, { orchestraId }],
        enrollments: {
          ...prev.enrollments,
          orchestraIds: Array.from(
            new Set([...prev.enrollments.orchestraIds, orchestraId])
          ),
        },
      }
    })
  }, [])

  // Remove orchestra assignment
  const removeOrchestraAssignment = useCallback((orchestraId: string) => {
    setFormData((prev) => {
      const updatedAssignments = prev.orchestraAssignments.filter(
        (a) => a.orchestraId !== orchestraId
      )

      // Also remove from orchestraIds in enrollments
      const updatedOrchestraIds = prev.enrollments.orchestraIds.filter(
        (id) => id !== orchestraId
      )

      return {
        ...prev,
        orchestraAssignments: updatedAssignments,
        enrollments: {
          ...prev.enrollments,
          orchestraIds: updatedOrchestraIds,
        },
      }
    })
  }, [])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.personalInfo?.fullName) {
      newErrors['personalInfo.fullName'] = 'שם מלא הוא שדה חובה'
    }

    if (
      formData.personalInfo?.phone &&
      !/^05\d{8}$/.test(formData.personalInfo.phone)
    ) {
      newErrors['personalInfo.phone'] =
        'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)'
    }

    if (
      formData.personalInfo?.parentPhone &&
      !/^05\d{8}$/.test(formData.personalInfo.parentPhone)
    ) {
      newErrors['personalInfo.parentPhone'] =
        'מספר טלפון הורה לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)'
    }

    if (
      formData.personalInfo?.parentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.parentEmail)
    ) {
      newErrors['personalInfo.parentEmail'] = 'כתובת אימייל הורה לא תקינה'
    }

    if (
      formData.personalInfo?.studentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.studentEmail)
    ) {
      newErrors['personalInfo.studentEmail'] = 'כתובת אימייל תלמיד לא תקינה'
    }

    if (!formData.academicInfo?.instrument) {
      newErrors['academicInfo.instrument'] = 'כלי נגינה הוא שדה חובה'
    }

    if (!formData.academicInfo?.currentStage) {
      newErrors['academicInfo.currentStage'] = 'שלב נוכחי הוא שדה חובה'
    }

    if (!formData.academicInfo?.class) {
      newErrors['academicInfo.class'] = 'כיתה היא שדה חובה'
    }

    // Validate teacher assignments if any - using correct field names
    formData.teacherAssignments.forEach((assignment, index) => {
      if (!assignment.day) {
        newErrors[`teacherAssignment.${index}.day`] = 'יש לבחור יום לשיעור'
      }

      if (!assignment.time) {
        newErrors[`teacherAssignment.${index}.time`] = 'יש לבחור שעה לשיעור'
      }

      if (!assignment.duration) {
        newErrors[`teacherAssignment.${index}.duration`] = 'יש לבחור משך שיעור'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)

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
          academicInfo: formData.academicInfo,
          enrollments: {
            ...formData.enrollments, // Make sure orchestraIds is correctly populated from assignments
            orchestraIds: formData.orchestraAssignments.map(
              (a) => a.orchestraId
            ),
          },
          teacherIds: formData.teacherIds.filter((id) => id !== 'new-teacher'),
          isActive: formData.isActive,
        }

        // Handle new or existing student
        let savedStudent: Student

        if (formData._id) {
          // Update existing student
          savedStudent = await studentService.updateStudent(
            formData._id,
            studentData
          )
        } else {
          // Create new student
          savedStudent = await saveStudent(studentData)
        }

        console.log('Student saved successfully:', savedStudent)

        // Process teacher assignments after student is saved
        const teacherPromises = formData.teacherAssignments
          .filter((a) => a.teacherId !== 'new-teacher') // Filter out new teacher for now
          .map(async (assignment) => {
            try {
              const { teacherId, day, time, duration } = assignment

              // Ensure all required fields have valid values
              if (!teacherId || !day || !time || !duration) {
                console.warn(
                  `Skipping invalid schedule for teacher ${teacherId} and student ${savedStudent._id}: Missing required fields`
                )
                return
              }

              console.log(
                `Updating teacher ${teacherId} schedule with student ${savedStudent._id}`
              )

              // Update teacher schedule with student assignment
              // Using the correct field names that match the backend
              await studentService.updateTeacherSchedule(teacherId, {
                studentId: savedStudent._id,
                day,
                time,
                duration,
              })

              // Also update the teacher's studentIds array to include this student
              try {
                const teacher = await teacherService.getTeacherById(teacherId)

                // Only add if not already in the array
                if (!teacher.teaching?.studentIds?.includes(savedStudent._id)) {
                  // Add student to teacher's studentIds
                  const updatedTeacher = await teacherService.updateTeacher(
                    teacherId,
                    {
                      teaching: {
                        studentIds: [
                          ...(teacher.teaching?.studentIds || []),
                          savedStudent._id,
                        ],
                        schedule: teacher.teaching?.schedule || [],
                      },
                    }
                  )

                  console.log(
                    'Updated teacher with student reference:',
                    updatedTeacher
                  )
                }
              } catch (err) {
                console.error('Failed to update teacher studentIds:', err)
              }
            } catch (err) {
              console.error('Failed to update teacher schedule:', err)
            }
          })

        // Wait for all teacher assignments to complete
        await Promise.all(teacherPromises)

        // Refresh student list
        await loadStudents()

        // Special handling for new teacher case
        if (
          newTeacherInfo?._id &&
          formData.teacherAssignments.some(
            (a) =>
              a.teacherId === 'new-teacher' ||
              a.teacherId === newTeacherInfo._id
          )
        ) {
          // Get the new teacher assignment
          const newTeacherAssignment = formData.teacherAssignments.find(
            (a) =>
              a.teacherId === 'new-teacher' ||
              a.teacherId === newTeacherInfo._id
          )

          if (newTeacherAssignment) {
            try {
              // Update the schedule for the new teacher
              await studentService.updateTeacherSchedule(newTeacherInfo._id, {
                studentId: savedStudent._id,
                day: newTeacherAssignment.day,
                time: newTeacherAssignment.time,
                duration: newTeacherAssignment.duration,
              })

              // Update the teacher's studentIds array
              const teacher = await teacherService.getTeacherById(
                newTeacherInfo._id
              )
              await teacherService.updateTeacher(newTeacherInfo._id, {
                teaching: {
                  studentIds: [
                    ...(teacher.teaching?.studentIds || []),
                    savedStudent._id,
                  ],
                  schedule: teacher.teaching?.schedule || [],
                },
              })

              console.log('Updated new teacher with student reference')
            } catch (err) {
              console.error('Failed to update new teacher with student:', err)
            }
          }

          // Prepare student with additional data for teacher creation
          const studentWithTeacherData = {
            ...savedStudent,
            _newTeacherAssociation: true,
            _lessonDetails: newTeacherAssignment
              ? {
                  lessonDay: newTeacherAssignment.day,
                  lessonTime: newTeacherAssignment.time,
                  lessonDuration: newTeacherAssignment.duration,
                }
              : undefined,
          }

          // Call the callback with enhanced student data
          if (onStudentCreated) {
            onStudentCreated(studentWithTeacherData)
            return
          }
        }

        // Close form on successful save
        onClose()
      } catch (err) {
        console.error('Error saving student:', err)
        setErrors((prev) => ({
          ...prev,
          form: err instanceof Error ? err.message : 'שגיאה בשמירת תלמיד',
        }))
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      formData,
      validateForm,
      saveStudent,
      loadStudents,
      onStudentCreated,
      onClose,
      newTeacherInfo,
    ]
  )

  return {
    formData,
    errors,
    isLoading,
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
    setFormData,

    // Form submission
    validateForm,
    handleSubmit,
  }
}