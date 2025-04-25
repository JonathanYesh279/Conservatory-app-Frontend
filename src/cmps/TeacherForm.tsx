// src/cmps/TeacherForm.tsx
import { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Search, Plus } from 'lucide-react'
import { Teacher } from '../services/teacherService'
import { useTeacherStore } from '../store/teacherStore'
import { useSchoolYearStore } from '../store/schoolYearStore'
import { Orchestra, orchestraService } from '../services/orchestraService'
import { Student, studentService } from '../services/studentService'
import { useSearchbar } from '../hooks/useSearchbar'
import { useNavigate } from 'react-router-dom'

// Define type for form data structure
interface TeacherFormData {
  _id?: string
  personalInfo: {
    fullName: string
    phone: string
    email: string
    address: string
  }
  roles: string[]
  professionalInfo: {
    instrument: string
    isActive: boolean
  }
  teaching: {
    studentIds: string[]
    schedule: Array<{
      studentId: string
      day: string
      time: string
      duration: number
      isActive: boolean
    }>
  }
  conducting: {
    orchestraIds: string[]
  }
  ensemblesIds: string[]
  schoolYears: Array<{
    schoolYearId: string
    isActive: boolean
  }>
  credentials: {
    email: string
    password: string
  }
  isActive: boolean
}

// Constants for validation and form selection
const VALID_RULES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מורה תאוריה']
const VALID_INSTRUMENTS = [
  'חצוצרה',
  'חליל צד',
  'קלרינט',
  'קרן יער',
  'בריטון',
  'טרומבון',
  'סקסופון',
  'אבוב',
]

// Constants for student scheduling
const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי']
const LESSON_DURATIONS = [30, 45, 60]

interface TeacherFormProps {
  isOpen: boolean
  onClose: () => void
  teacher?: Partial<Teacher>
  onSave?: () => void
  onAddNewStudent?: (teacherInfo: { fullName: string, instrument: string }) => void
  newlyCreatedStudent?: Student | null
}

export function TeacherForm({
  isOpen,
  onClose,
  teacher,
  onSave,
  onAddNewStudent,
  newlyCreatedStudent
}: TeacherFormProps) {
  const { saveTeacher, isLoading, error, clearError } = useTeacherStore()
  const { currentSchoolYear } = useSchoolYearStore()
  const [orchestras, setOrchestras] = useState<Orchestra[]>([])
  const [loadingOrchestras, setLoadingOrchestras] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()

  // Student management state
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [showStudentSearch, setShowStudentSearch] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

  // Define which fields to search in students
  const studentSearchFields = (student: Student) => [
    student.personalInfo.fullName,
    student.academicInfo.instrument,
    student.academicInfo.class,
  ]

  // Use the search hook for students
  const {
    filteredEntities: filteredStudents,
    handleSearch: handleStudentSearch,
  } = useSearchbar(students, studentSearchFields)

  // Form state with proper typing
  const [formData, setFormData] = useState<TeacherFormData>({
    personalInfo: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
    },
    roles: ['מורה'],
    professionalInfo: {
      instrument: VALID_INSTRUMENTS[0],
      isActive: true,
    },
    teaching: {
      studentIds: [],
      schedule: [],
    },
    conducting: {
      orchestraIds: [],
    },
    ensemblesIds: [],
    schoolYears: [],
    credentials: {
      email: '',
      password: '',
    },
    isActive: true,
  })

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  
  // Determine if this is a new teacher or existing teacher
  const isNewTeacher = !teacher?._id

  // Effect to handle newly created student
  useEffect(() => {
    if (newlyCreatedStudent) {
      // Add the newly created student to the selected students
      handleAddStudent(newlyCreatedStudent)
    }
  }, [newlyCreatedStudent])

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Load orchestras
  useEffect(() => {
    const fetchOrchestras = async () => {
      setLoadingOrchestras(true)
      try {
        const data = await orchestraService.getOrchestras({ isActive: true })
        setOrchestras(data)
      } catch (err) {
        console.error('Failed to load orchestras:', err)
      } finally {
        setLoadingOrchestras(false)
      }
    }

    fetchOrchestras()
  }, [])

  // Load students for selection
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true)
      try {
        const allStudents = await studentService.getStudents({
          isActive: true,
        })
        setStudents(allStudents)
      } catch (err) {
        console.error('Failed to load students:', err)
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [])

  // Check if teacher is conductor or teacher
  const isConductor = formData.roles.includes('מנצח')
  const isTeacher = formData.roles.includes('מורה')

  // If editing an existing teacher, populate form data
  useEffect(() => {
    if (teacher?._id) {
      // Map students from IDs to actual student objects
      const mapStudentIdsToStudents = async () => {
        if (
          teacher.teaching?.studentIds &&
          teacher.teaching.studentIds.length > 0
        ) {
          setLoadingStudents(true)
          try {
            const studentData = await studentService.getStudentsByIds(
              teacher.teaching.studentIds
            )
            setSelectedStudents(studentData)
          } catch (err) {
            console.error("Failed to load teacher's students:", err)
          } finally {
            setLoadingStudents(false)
          }
        }
      }

      // Load the teacher's students
      mapStudentIdsToStudents()

      // Log initial roles to make debugging easier
      console.log('Initial teacher roles:', teacher.roles)

      setFormData({
        _id: teacher._id,
        personalInfo: {
          fullName: teacher.personalInfo?.fullName || '',
          phone: teacher.personalInfo?.phone || '',
          email: teacher.personalInfo?.email || '',
          address: teacher.personalInfo?.address || '',
        },
        roles: teacher.roles || ['מורה'],
        professionalInfo: {
          instrument:
            teacher.professionalInfo?.instrument || VALID_INSTRUMENTS[0],
          isActive: teacher.professionalInfo?.isActive !== false,
        },
        teaching: {
          studentIds: teacher.teaching?.studentIds || [],
          schedule: teacher.teaching?.schedule || [],
        },
        conducting: {
          orchestraIds: teacher.conducting?.orchestraIds || [],
        },
        ensemblesIds: teacher.ensemblesIds || [],
        schoolYears: teacher.schoolYears || [],
        credentials: {
          email: teacher.personalInfo?.email || '',
          password: '', // Don't include password for updates
        },
        isActive: teacher.isActive !== false,
      })
    } else {
      // Reset form for new teacher with proper defaults
      setFormData({
        personalInfo: {
          fullName: '',
          phone: '',
          email: '',
          address: '',
        },
        roles: ['מורה'],
        professionalInfo: {
          instrument: VALID_INSTRUMENTS[0],
          isActive: true,
        },
        teaching: {
          studentIds: [],
          schedule: [],
        },
        conducting: {
          orchestraIds: [],
        },
        ensemblesIds: [],
        schoolYears: currentSchoolYear
          ? [
            {
              schoolYearId: currentSchoolYear._id,
              isActive: true,
            },
          ]
          : [],
        credentials: {
          email: '',
          password: '',
        },
        isActive: true,
      })

      // Reset selected students
      setSelectedStudents([])
    }

    setErrors({})
    clearError?.()
  }, [teacher, isOpen, clearError, currentSchoolYear])

  // Handle input changes
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    const updatedPersonalInfo = { ...formData.personalInfo, [name]: value }

    // Keep email synchronized with credentials email (for new teachers only)
    const updatedCredentials = {
      ...formData.credentials,
      email: name === 'email' ? value : formData.credentials.email,
    }

    setFormData({
      ...formData,
      personalInfo: updatedPersonalInfo,
      credentials: updatedCredentials,
    })

    // Clear error for this field if it exists
    if (errors[`personalInfo.${name}`]) {
      setErrors({
        ...errors,
        [`personalInfo.${name}`]: '',
      })
    }
  }

  const handleProfessionalInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      professionalInfo: {
        ...formData.professionalInfo,
        [name]: value,
      },
    })

    if (errors[`professionalInfo.${name}`]) {
      setErrors({
        ...errors,
        [`professionalInfo.${name}`]: '',
      })
    }
  }

  // Enhanced handleRolesChange function with better logging
  const handleRolesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target

    let updatedRoles = [...formData.roles]

    if (checked) {
      // Add the role if it's not already there
      if (!updatedRoles.includes(value)) {
        updatedRoles.push(value)
        console.log(`Added role ${value}, new roles:`, updatedRoles)
      }
    } else {
      // Remove the role
      updatedRoles = updatedRoles.filter((role) => role !== value)
      console.log(`Removed role ${value}, new roles:`, updatedRoles)

      // Make sure there's at least one role
      if (updatedRoles.length === 0) {
        updatedRoles = ['מורה']
        console.log('No roles left, defaulting to מורה')
      }
    }

    // Update the form data with the new roles array
    setFormData({
      ...formData,
      roles: updatedRoles,
    })

    // Clear any role-related errors
    if (errors['roles']) {
      setErrors({
        ...errors,
        roles: '',
      })
    }
  }

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      credentials: {
        ...formData.credentials,
        [name]: value,
      },
    })

    if (errors[`credentials.${name}`]) {
      setErrors({
        ...errors,
        [`credentials.${name}`]: '',
      })
    }
  }

  // Handle orchestra selection (for conductors)
  const handleOrchestraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    )

    setFormData({
      ...formData,
      conducting: {
        ...formData.conducting,
        orchestraIds: selectedOptions,
      },
    })

    if (errors['conducting.orchestraIds']) {
      setErrors({
        ...errors,
        'conducting.orchestraIds': '',
      })
    }
  }

  // Handle adding a student to the teacher
  const handleAddStudent = (student: Student) => {
    // Check if student is already selected
    if (selectedStudents.some((s) => s._id === student._id)) {
      return
    }

    // Add student to selected students
    setSelectedStudents([...selectedStudents, student])

    // Create initial schedule entry for this student
    const newScheduleItem = {
      studentId: student._id,
      day: DAYS_OF_WEEK[0],
      time: '08:00',
      duration: 45,
      isActive: true,
    }

    // Update form data
    setFormData({
      ...formData,
      teaching: {
        studentIds: [...formData.teaching.studentIds, student._id],
        schedule: [...formData.teaching.schedule, newScheduleItem],
      },
    })

    // Hide search after selection
    setShowStudentSearch(false)
  }

  // Handle removing a student from the teacher
  const handleRemoveStudent = (studentId: string) => {
    // Remove student from selected students
    setSelectedStudents(selectedStudents.filter((s) => s._id !== studentId))

    // Update form data
    setFormData({
      ...formData,
      teaching: {
        studentIds: formData.teaching.studentIds.filter(
          (id) => id !== studentId
        ),
        schedule: formData.teaching.schedule.filter(
          (item) => item.studentId !== studentId
        ),
      },
    })
  }

  // Handle updating schedule for a student
  const handleScheduleChange = (
    studentId: string,
    field: 'day' | 'time' | 'duration',
    value: string | number
  ) => {
    // Update the schedule item for this student
    const updatedSchedule = formData.teaching.schedule.map((item) => {
      if (item.studentId === studentId) {
        return { ...item, [field]: value }
      }
      return item
    })

    // Update form data
    setFormData({
      ...formData,
      teaching: {
        ...formData.teaching,
        schedule: updatedSchedule,
      },
    })
  }

  // Handle navigating to add a new student
  const handleAddNewStudent = () => {
    // Capture the current teacher information that's being entered
    const teacherInfo = {
      fullName: formData.personalInfo.fullName,
      instrument: formData.professionalInfo.instrument,
    }

    // Use the callback if provided, passing the in-progress teacher info
    if (onAddNewStudent) {
      onAddNewStudent(teacherInfo)
    } else {
      // Fallback to the old approach
      onClose()
      navigate('/students/new')
    }
  }

  // Validate form based on whether it's a new teacher or update
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    console.log('Running validation with formData:', formData)

    // Required fields validation
    if (!formData.personalInfo?.fullName) {
      newErrors['personalInfo.fullName'] = 'שם מלא הוא שדה חובה'
      console.error('Validation failed: Missing fullName')
    }

    if (!formData.personalInfo?.phone) {
      newErrors['personalInfo.phone'] = 'טלפון הוא שדה חובה'
      console.error('Validation failed: Missing phone')
    } else if (!/^05\d{8}$/.test(formData.personalInfo.phone)) {
      newErrors['personalInfo.phone'] =
        'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)'
      console.error(
        'Validation failed: Phone format invalid',
        formData.personalInfo.phone
      )
    }

    if (!formData.personalInfo?.email) {
      newErrors['personalInfo.email'] = 'דוא"ל הוא שדה חובה'
      console.error('Validation failed: Missing email')
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)
    ) {
      newErrors['personalInfo.email'] = 'כתובת דוא"ל לא תקינה'
      console.error('Validation failed: Email format invalid')
    }

    if (!formData.personalInfo?.address) {
      newErrors['personalInfo.address'] = 'כתובת היא שדה חובה'
      console.error('Validation failed: Missing address')
    }

    // Validate teacher specific fields
    if (isTeacher && !formData.professionalInfo?.instrument) {
      newErrors['professionalInfo.instrument'] = 'כלי נגינה הוא שדה חובה למורה'
      console.error('Validation failed: Teacher requires instrument')
    }

    // Validate role selection
    if (formData.roles.length === 0) {
      newErrors['roles'] = 'יש לבחור לפחות תפקיד אחד'
      console.error('Validation failed: No roles selected')
    }

    // Only validate credentials for new teachers
    if (isNewTeacher) {
      // For new teachers, password is required
      if (!formData.credentials.password) {
        newErrors['credentials.password'] = 'סיסמה היא שדה חובה'
        console.error('Validation failed: New teacher requires password')
      }

      // Email in credentials must match email in personal info
      if (formData.personalInfo.email !== formData.credentials.email) {
        newErrors['credentials.email'] =
          'דוא"ל בהרשאות חייב להתאים לדוא"ל בפרטים אישיים'
        console.error(
          'Validation failed: Email mismatch between credentials and personal info'
        )
      }
    }

    // Skip schedule validation for updates - this is an important change
    // For existing teachers, don't validate the schedule items
    if (!teacher?._id) {
      // Only validate schedule for new teachers
      formData.teaching.schedule.forEach((scheduleItem, index) => {
        if (!scheduleItem.day) {
          newErrors[`teaching.schedule[${index}].day`] = 'יש לבחור יום'
          console.error(
            `Validation failed: Missing day for schedule item ${index}`
          )
        }
        if (!scheduleItem.time) {
          newErrors[`teaching.schedule[${index}].time`] = 'יש לבחור שעה'
          console.error(
            `Validation failed: Missing time for schedule item ${index}`
          )
        }
      })
    }

    // Log all errors
    if (Object.keys(newErrors).length > 0) {
      console.error('Validation errors:', newErrors)
    } else {
      console.log('Validation passed successfully')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit triggered')

    if (!validateForm()) {
      console.log('Validation failed')
      return
    }

    try {
      const teacherId = formData._id

      // Important: Log roles before submission to verify they're being sent
      console.log('Submitting teacher with roles:', formData.roles)

      // Create a data object for submission
      let dataToSend: any

      if (teacherId) {
        // For updates: explicitly include only what we want to update
        dataToSend = {
          personalInfo: formData.personalInfo,
          roles: formData.roles,
          professionalInfo: formData.professionalInfo,
          isActive: formData.isActive
        }

        // Only include teaching data if there are students
        if (formData.teaching && formData.teaching.studentIds.length > 0) {
          dataToSend.teaching = {
            studentIds: formData.teaching.studentIds
          }
          
          // Only include valid schedule items
          const validSchedule = formData.teaching.schedule.filter(
            item => item.studentId && item.day && item.time && item.duration
          )
          
          if (validSchedule.length > 0) {
            dataToSend.teaching.schedule = validSchedule.map(item => ({
              studentId: item.studentId,
              day: item.day,
              time: item.time,
              duration: item.duration
            }))
          }
        }

        // Include conducting data if there are orchestras
        if (formData.conducting && formData.conducting.orchestraIds.length > 0) {
          dataToSend.conducting = {
            orchestraIds: formData.conducting.orchestraIds
          }
        }

        if (formData.ensemblesIds && formData.ensemblesIds.length > 0) {
          dataToSend.ensemblesIds = formData.ensemblesIds
        }

        console.log('Update mode: preparing specific data to update')
      } else {
        // For new teachers: include all data including credentials
        const { _id, ...dataWithoutId } = formData
        dataToSend = dataWithoutId
        console.log('Create mode: including all teacher data with credentials')
      }

      // Make sure the teacher has the current school year in enrollments
      if (
        currentSchoolYear &&
        !dataToSend.schoolYears?.some(
          (sy: any) => sy.schoolYearId === currentSchoolYear._id
        )
      ) {
        dataToSend.schoolYears = [
          ...(dataToSend.schoolYears || []),
          { schoolYearId: currentSchoolYear._id, isActive: true },
        ]
      }

      console.log('Final data to be sent:', dataToSend)

      let savedTeacher

      // Save or update teacher
      if (teacherId) {
        console.log('About to call saveTeacher for update with data:', dataToSend)
        try {
          savedTeacher = await saveTeacher(dataToSend, teacherId)
          console.log('Update successful, response:', savedTeacher)
        } catch (updateError) {
          console.error('Update failed with error:', updateError)
          throw updateError
        }
      } else {
        // For new teachers
        console.log('About to call saveTeacher for new teacher')
        try {
          savedTeacher = await saveTeacher(dataToSend)
          console.log('Create successful, new teacher:', savedTeacher)
        } catch (createError) {
          console.error('Create failed with error:', createError)
          throw createError
        }
      }

      console.log('Save successful, about to call onSave callback')
      // Call optional onSave callback
      if (onSave) {
        onSave()
        console.log('onSave callback completed')
      }

      console.log('About to call onClose')
      // Close the form after successful save
      onClose()
      console.log('onClose called')
    } catch (err) {
      console.error('Error saving teacher:', err)
      // More detailed error display
      const errorMessage =
        err instanceof Error ? err.message : 'שגיאה לא ידועה בשמירת המורה'
      console.error('Error message:', errorMessage)
      setErrors((prev) => ({
        ...prev,
        form: errorMessage,
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className='teacher-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>{teacher?._id ? 'עריכת מורה' : 'הוספת מורה חדש'}</h2>

        {error && <div className='error-message'>{error}</div>}
        {errors.form && <div className='error-message'>{errors.form}</div>}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className='form-section'>
            <h3>פרטים אישיים</h3>

            {/* Full Name */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='fullName'>שם מלא *</label>
                <input
                  type='text'
                  id='fullName'
                  name='fullName'
                  value={formData.personalInfo?.fullName || ''}
                  onChange={handlePersonalInfoChange}
                  className={
                    errors['personalInfo.fullName'] ? 'is-invalid' : ''
                  }
                  required
                />
                {errors['personalInfo.fullName'] && (
                  <div className='form-error'>
                    {errors['personalInfo.fullName']}
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='phone'>טלפון *</label>
                <input
                  type='tel'
                  id='phone'
                  name='phone'
                  value={formData.personalInfo?.phone || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.phone'] ? 'is-invalid' : ''}
                  placeholder='05XXXXXXXX'
                  required
                />
                {errors['personalInfo.phone'] && (
                  <div className='form-error'>
                    {errors['personalInfo.phone']}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='email'>דוא"ל *</label>
                <input
                  type='email'
                  id='email'
                  name='email'
                  value={formData.personalInfo?.email || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.email'] ? 'is-invalid' : ''}
                  required
                />
                {errors['personalInfo.email'] && (
                  <div className='form-error'>
                    {errors['personalInfo.email']}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='address'>כתובת *</label>
                <input
                  type='text'
                  id='address'
                  name='address'
                  value={formData.personalInfo?.address || ''}
                  onChange={handlePersonalInfoChange}
                  className={errors['personalInfo.address'] ? 'is-invalid' : ''}
                  required
                />
                {errors['personalInfo.address'] && (
                  <div className='form-error'>
                    {errors['personalInfo.address']}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className='form-section'>
            <h3>מידע מקצועי</h3>

            {/* Roles - Checkboxes */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label>תפקידים *</label>
                <div className='checkbox-group'>
                  {VALID_RULES.map((role) => (
                    <div key={role} className='checkbox-item'>
                      <input
                        type='checkbox'
                        id={`role-${role}`}
                        name='roles'
                        value={role}
                        checked={formData.roles.includes(role)}
                        onChange={handleRolesChange}
                      />
                      <label htmlFor={`role-${role}`}>{role}</label>
                    </div>
                  ))}
                </div>
                {errors['roles'] && (
                  <div className='form-error'>{errors['roles']}</div>
                )}
              </div>
            </div>

            {/* Conditional Fields based on Role */}
            {isTeacher && (
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='instrument'>כלי נגינה (למורה) *</label>
                  <select
                    id='instrument'
                    name='instrument'
                    value={formData.professionalInfo?.instrument || ''}
                    onChange={handleProfessionalInfoChange}
                    className={
                      errors['professionalInfo.instrument'] ? 'is-invalid' : ''
                    }
                    required={isTeacher}
                  >
                    <option value='' disabled>
                      בחר כלי נגינה
                    </option>
                    {VALID_INSTRUMENTS.map((instrument) => (
                      <option key={instrument} value={instrument}>
                        {instrument}
                      </option>
                    ))}
                  </select>
                  {errors['professionalInfo.instrument'] && (
                    <div className='form-error'>
                      {errors['professionalInfo.instrument']}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isConductor && (
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='orchestras'>תזמורות (למנצח)</label>
                  <select
                    id='orchestras'
                    name='orchestraIds'
                    multiple
                    value={formData.conducting.orchestraIds || []}
                    onChange={handleOrchestraChange}
                    className={
                      errors['conducting.orchestraIds'] ? 'is-invalid' : ''
                    }
                  >
                    {loadingOrchestras ? (
                      <option disabled>טוען תזמורות...</option>
                    ) : orchestras.length > 0 ? (
                      orchestras.map((orchestra) => (
                        <option key={orchestra._id} value={orchestra._id}>
                          {orchestra.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>אין תזמורות זמינות</option>
                    )}
                  </select>
                  <small className='select-hint'>
                    {isMobile
                      ? 'לחץ והחזק על מספר אפשרויות לבחירה מרובה'
                      : 'ניתן לבחור מספר תזמורות (לחיצה על CTRL + לחיצה על תזמורת)'}
                  </small>
                  {errors['conducting.orchestraIds'] && (
                    <div className='form-error'>
                      {errors['conducting.orchestraIds']}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Students Section - Only for teachers */}
          {isTeacher && (
            <div className='form-section'>
              <h3>תלמידים</h3>

              {/* Selected Students List */}
              {selectedStudents.length > 0 && (
                <div className='selected-students'>
                  <h4>תלמידים שהוקצו למורה</h4>

                  {selectedStudents.map((student) => (
                    <div key={student._id} className='student-schedule-item'>
                      <div className='student-info'>
                        <div className='student-name'>
                          {student.personalInfo.fullName}
                        </div>
                        <div className='student-details'>
                          <span>{student.academicInfo.instrument}</span>
                          <span>כיתה {student.academicInfo.class}</span>
                          <span>שלב {student.academicInfo.currentStage}</span>
                        </div>
                        <button
                          type='button'
                          className='remove-student-btn'
                          onClick={() => handleRemoveStudent(student._id)}
                          aria-label='הסר תלמיד'
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Schedule fields for this student */}
                      <div className='schedule-fields'>
                        <div className='form-group'>
                          <label htmlFor={`day-${student._id}`}>יום</label>
                          <select
                            id={`day-${student._id}`}
                            value={
                              formData.teaching.schedule.find(
                                (s) => s.studentId === student._id
                              )?.day || DAYS_OF_WEEK[0]
                            }
                            onChange={(e) =>
                              handleScheduleChange(
                                student._id,
                                'day',
                                e.target.value
                              )
                            }
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='form-group'>
                          <label htmlFor={`time-${student._id}`}>שעה</label>
                          <input
                            type='time'
                            id={`time-${student._id}`}
                            value={
                              formData.teaching.schedule.find(
                                (s) => s.studentId === student._id
                              )?.time || '08:00'
                            }
                            onChange={(e) =>
                              handleScheduleChange(
                                student._id,
                                'time',
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className='form-group'>
                          <label htmlFor={`duration-${student._id}`}>
                            משך (דקות)
                          </label>
                          <select
                            id={`duration-${student._id}`}
                            value={
                              formData.teaching.schedule.find(
                                (s) => s.studentId === student._id
                              )?.duration || 45
                            }
                            onChange={(e) =>
                              handleScheduleChange(
                                student._id,
                                'duration',
                                Number(e.target.value)
                              )
                            }
                          >
                            {LESSON_DURATIONS.map((duration) => (
                              <option key={duration} value={duration}>
                                {duration}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Student Search or Add Buttons */}
              <div className='student-actions'>
                {showStudentSearch ? (
                  <div className='student-search-container'>
                    <div className='search-header'>
                      <h4>חיפוש תלמידים</h4>
                      <button
                        type='button'
                        className='btn'
                        onClick={() => setShowStudentSearch(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className='search-box'>
                      <Search size={16} />
                      <input
                        type='text'
                        placeholder='חפש תלמיד לפי שם, כלי או כיתה...'
                        onChange={(e) => handleStudentSearch(e.target.value)}
                      />
                    </div>

                    <div className='search-results'>
                      {loadingStudents ? (
                        <div className='loading-message'>טוען תלמידים...</div>
                      ) : filteredStudents.length === 0 ? (
                        <div className='no-results'>לא נמצאו תלמידים</div>
                      ) : (
                        <div className='student-list'>
                          {filteredStudents
                            .filter(
                              (student) =>
                                !selectedStudents.some(
                                  (s) => s._id === student._id
                                )
                            )
                            .map((student) => (
                              <div
                                key={student._id}
                                className='student-search-item'
                                onClick={() => handleAddStudent(student)}
                              >
                                <div className='student-name'>
                                  {student.personalInfo.fullName}
                                </div>
                                <div className='student-details'>
                                  <span>{student.academicInfo.instrument}</span>
                                  <span>כיתה {student.academicInfo.class}</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className='student-action-buttons'>
                    <button
                      type='button'
                      className='btn primary'
                      onClick={() => setShowStudentSearch(true)}
                    >
                      <Search size={16} />
                      <span>חיפוש תלמידים קיימים</span>
                    </button>

                    <button
                      type='button'
                      className='btn primary'
                      onClick={handleAddNewStudent}
                    >
                      <Plus size={16} />
                      <span>הוספת תלמיד חדש</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Authentication - Only shown for new teachers */}
          {isNewTeacher && (
            <div className='form-section'>
              <h3>הרשאות</h3>

              {/* Email (this should be disabled and synced with the personal email) */}
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='cred-email'>דוא"ל (להתחברות) *</label>
                  <input
                    type='email'
                    id='cred-email'
                    name='email'
                    value={formData.credentials.email}
                    onChange={handleCredentialsChange}
                    className={errors['credentials.email'] ? 'is-invalid' : ''}
                    disabled // This should be synced with personal email
                  />
                  {errors['credentials.email'] && (
                    <div className='form-error'>
                      {errors['credentials.email']}
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='password'>סיסמה *</label>
                  <div className='password-input-container'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id='password'
                      name='password'
                      value={formData.credentials.password}
                      onChange={handleCredentialsChange}
                      className={
                        errors['credentials.password'] ? 'is-invalid' : ''
                      }
                      required
                    />
                    <button
                      type='button'
                      className='toggle-password-btn'
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors['credentials.password'] && (
                    <div className='form-error'>
                      {errors['credentials.password']}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className='form-actions'>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'שומר...' : teacher?._id ? 'עדכון' : 'הוספה'}
            </button>

            <button type='button' className='btn secondary' onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
  