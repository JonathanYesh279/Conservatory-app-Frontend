// src/cmps/TeacherForm.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Search,
  User,
  Calendar,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { Formik, Form, FormikHelpers } from 'formik';
import { Teacher } from '../services/teacherService';
import { Student } from '../services/studentService';
import { useStudentSelectionForTeacher } from '../hooks/useStudentSelectionForTeacher';
import { useTeacherStore } from '../store/teacherStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { useToast } from './Toast';
import { Orchestra, orchestraService } from '../services/orchestraService';
import { DuplicateConfirmationModal } from './DuplicateConfirmationModal';
import { DuplicateDetectionInfo } from '../utils/errorHandler';
import { FormField } from './FormComponents/FormField';
import { TeacherTimeBlockManager } from './TeacherForm/TeacherTimeBlockManager';
import { TimeBlock } from '../types/schedule';
import {
  teacherValidationSchema,
  initialTeacherFormValues,
  TeacherFormData,
  VALID_ROLES,
  VALID_INSTRUMENTS,
  DAYS_OF_WEEK,
  LESSON_DURATIONS,
} from '../validations/teacherValidation';

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Partial<Teacher>;
  onSave?: () => void;
  onAddNewStudent?: (teacherInfo: {
    fullName: string;
    instrument: string;
  }) => void;
  newlyCreatedStudent?: Student | null;
}

// Modal views enum
enum ModalView {
  TEACHER_FORM = 'teacher_form',
}

// Schedule item interface for local state management
interface ScheduleItem {
  studentId: string;
  day: string;
  time: string;
  duration: number;
  isActive: boolean;
}

// Main form component
export function TeacherForm({
  isOpen,
  onClose,
  teacher,
  onSave,
  onAddNewStudent,
  newlyCreatedStudent,
}: TeacherFormProps) {
  // Debug log to see what teacher data is coming into the form
  console.log('TeacherForm received teacher:', teacher || 'none (new teacher)');

  // Accessibility hook
  const { modalProps, titleProps, descriptionProps } = useModalAccessibility({
    isOpen,
    onClose,
    modalId: 'teacher-form',
    restoreFocusOnClose: true
  });

  // Modal state management
  const [currentView, setCurrentView] = useState<ModalView>(
    ModalView.TEACHER_FORM
  );

  // Form-wide state
  const [showPassword, setShowPassword] = useState(false);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [loadingOrchestras, setLoadingOrchestras] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateDetectionInfo | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [forceDuplicateCreation, setForceDuplicateCreation] = useState(false);

  // Store access
  const { saveTeacher, isLoading } = useTeacherStore();
  const { currentSchoolYear } = useSchoolYearStore();
  const { addToast, showError } = useToast();

  // Helper function to check if user has admin privileges
  const isAdmin = () => {
    // TODO: Implement proper admin check based on your auth system
    // For now, return false - replace with actual admin check
    return false;
  };

  // Helper function to reset duplicate state
  const resetDuplicateState = () => {
    setDuplicateInfo(null);
    setShowDuplicateModal(false);
    setPendingFormData(null);
    setForceDuplicateCreation(false);
  };

  // Helper function to handle duplicate confirmation
  const handleDuplicateConfirmation = async (forceCreate: boolean) => {
    if (!pendingFormData) return;

    setForceDuplicateCreation(forceCreate);
    setShowDuplicateModal(false);

    try {
      const dataToSend = {
        ...pendingFormData,
        forceCreate,
        adminOverride: forceCreate && isAdmin()
      };

      await processSaveTeacher(dataToSend);
    } catch (err) {
      console.error('Error in duplicate confirmation:', err);
      showError(err as Error);
    }
  };

  // Helper function to handle duplicate cancellation
  const handleDuplicateCancel = () => {
    resetDuplicateState();
  };

  // Determine if this is a new teacher or existing teacher
  const isNewTeacher = !teacher?._id;

  // Modal navigation handlers - simplified since we removed time block modal
  const handleTimeBlockCreated = (timeBlock: TimeBlock | TimeBlock[]) => {
    console.log('Time block created:', timeBlock);
    // Optionally refresh teacher data or show success message
  };

  // Close handler that resets to main view
  const handleModalClose = () => {
    setCurrentView(ModalView.TEACHER_FORM);
    onClose();
  };

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView(ModalView.TEACHER_FORM);
    }
  }, [isOpen]);

  // Initialize form values
  const getInitialFormValues = useCallback((): TeacherFormData => {
    if (teacher?._id) {
      // For existing teacher
      return {
        _id: teacher._id,
        personalInfo: {
          fullName: teacher.personalInfo?.fullName || '',
          phone: teacher.personalInfo?.phone || '',
          email: teacher.personalInfo?.email || '',
          address: teacher.personalInfo?.address || '',
        },
        roles: teacher.roles || ['מורה'],
        professionalInfo: {
          instrument: teacher.professionalInfo?.instrument || '',
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
      };
    } else {
      // For new teacher
      return {
        ...initialTeacherFormValues,
        credentials: {
          ...initialTeacherFormValues.credentials,
          email: '', // Will be synced with personal email
        },
        schoolYears: currentSchoolYear
          ? [{ schoolYearId: currentSchoolYear._id, isActive: true }]
          : [],
      };
    }
  }, [teacher, currentSchoolYear]);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Load orchestras for conductor role
  useEffect(() => {
    const fetchOrchestras = async () => {
      setLoadingOrchestras(true);
      try {
        const data = await orchestraService.getOrchestras({ isActive: true });
        setOrchestras(data);
      } catch (err) {
        console.error('Failed to load orchestras:', err);
      } finally {
        setLoadingOrchestras(false);
      }
    };

    fetchOrchestras();
  }, []);

  // Process the actual teacher save operation
  const processSaveTeacher = async (dataToSend: any) => {
    const teacherId = dataToSend._id;
    
    // Save or update teacher
    let savedTeacher;
    if (teacherId) {
      savedTeacher = await saveTeacher(dataToSend, teacherId);
    } else {
      savedTeacher = await saveTeacher(dataToSend);
    }

    // Show success toast
    const toastMessage = teacherId 
      ? `המורה ${dataToSend.personalInfo?.fullName || 'המורה'} עודכן בהצלחה` 
      : `המורה ${dataToSend.personalInfo?.fullName || 'המורה'} נוסף בהצלחה`;
    
    addToast({
      type: 'success',
      message: toastMessage,
    });

    // Reset duplicate state
    resetDuplicateState();

    // Call optional onSave callback
    if (onSave) {
      onSave();
    }

    // Close the form after successful save
    handleModalClose();

    return savedTeacher;
  };

  // Form submission handler
  const handleSubmit = async (
    values: TeacherFormData,
    { setSubmitting, setValues }: FormikHelpers<TeacherFormData>
  ) => {
    setApiError(null);
    resetDuplicateState();
    
    // Prepare data for submission - declare outside try block for error handling
    let dataToSend: any;
    
    try {
      // Ensure credentials email matches personal email
      if (
        isNewTeacher &&
        values.credentials.email !== values.personalInfo.email
      ) {
        values = {
          ...values,
          credentials: {
            ...values.credentials,
            email: values.personalInfo.email,
          },
        };
        // Update formik values to match
        setValues(values, false);
      }
      const teacherId = values._id;

      if (teacherId) {
        // For updates: explicitly include only what we want to update
        dataToSend = {
          personalInfo: values.personalInfo,
          roles: values.roles,
          professionalInfo: values.professionalInfo,
          isActive: values.isActive,
        };

        // Only include teaching data if there are students
        if (values.teaching && values.teaching.studentIds.length > 0) {
          dataToSend.teaching = {
            studentIds: values.teaching.studentIds,
          };

          // Always include the schedule
          if (values.teaching.schedule.length > 0) {
            dataToSend.teaching.schedule = values.teaching.schedule;
          }
        }

        // Include conducting data if there are orchestras
        if (values.conducting && values.conducting.orchestraIds.length > 0) {
          dataToSend.conducting = {
            orchestraIds: values.conducting.orchestraIds,
          };
        }

        if (values.ensemblesIds && values.ensemblesIds.length > 0) {
          dataToSend.ensemblesIds = values.ensemblesIds;
        }
      } else {
        // For new teachers: include all data including credentials
        const { _id, ...dataWithoutId } = values;
        dataToSend = dataWithoutId;
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
        ];
      }

      // Add force creation flag if it was set
      if (forceDuplicateCreation) {
        dataToSend.forceCreate = true;
        dataToSend.adminOverride = isAdmin();
      }

      await processSaveTeacher(dataToSend);
      
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      
      // Check if this is a duplicate detection error
      const errorResponse = err?.response?.data || err;
      
      if (errorResponse?.code === 'DUPLICATE_TEACHER_DETECTED' && errorResponse?.details) {
        // Handle duplicate detection
        const duplicateDetails = errorResponse.details;
        
        setDuplicateInfo({
          blocked: duplicateDetails.blocked || false,
          reason: duplicateDetails.reason || 'נמצאו כפילויות במערכת',
          duplicates: duplicateDetails.duplicates || [],
          warnings: duplicateDetails.warnings || duplicateDetails.potentialDuplicates || [],
          canOverride: duplicateDetails.canOverride || isAdmin(),
          adminOverride: duplicateDetails.adminOverride || false
        });
        
        // Store the prepared data for potential retry
        setPendingFormData(JSON.parse(JSON.stringify(dataToSend)));
        setShowDuplicateModal(true);
      } else {
        // Handle other errors normally
        showError(err as Error);
        setApiError(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Render different views based on current state
  const renderModalContent = () => {
    switch (currentView) {
      case ModalView.TEACHER_FORM:
      default:
        return (
          <div className='teacher-form-view'>
            <div className='teacher-modal-header'>
              <h2 {...titleProps}>{teacher?._id ? 'עריכת מורה' : 'הוספת מורה חדש'}</h2>
              <button
                className='btn-icon close-btn'
                onClick={handleModalClose}
                aria-label='סגור'
              >
                <X size={20} />
              </button>
            </div>

            {apiError && (
              <div className='api-error-banner'>
                <div className='error-content'>
                  <AlertCircle size={16} />
                  <span>{apiError}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setApiError(null)}
                  className="error-close-btn"
                  aria-label="סגור הודעת שגיאה"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <Formik
              initialValues={getInitialFormValues()}
              validationSchema={teacherValidationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
              validateOnMount={false}
            >
              {({ isSubmitting, values, setFieldValue, errors, touched }) => {
                // Check if teacher is conductor or teacher based on roles
                const isConductor = values.roles.includes('מנצח');
                const isTeacher =
                  values.roles.includes('מורה') ||
                  values.roles.includes('מורה תאוריה');

                // Handle student selection integration
                const {
                  selectedStudents,
                  loadingStudents,
                  showStudentSearch,
                  searchQuery,
                  setShowStudentSearch,
                  handleStudentSearch,
                  getFilteredStudents,
                  handleAddStudent,
                  handleRemoveStudent,
                } = useStudentSelectionForTeacher({
                  initialStudentIds: values.teaching.studentIds,
                  onStudentIdsChange: (studentIds) => {
                    setFieldValue('teaching.studentIds', studentIds);
                  },
                  onAddScheduleItem: (studentId) => {
                    // Add schedule item for this student
                    const newScheduleItem = {
                      studentId,
                      day: DAYS_OF_WEEK[0],
                      time: '08:00',
                      duration: 45,
                      isActive: true,
                    };

                    setFieldValue('teaching.schedule', [
                      ...values.teaching.schedule,
                      newScheduleItem,
                    ]);
                  },
                  onRemoveScheduleItem: (studentId) => {
                    // Remove schedule item for this student
                    const updatedSchedule = values.teaching.schedule.filter(
                      (item) => item.studentId !== studentId
                    );

                    setFieldValue('teaching.schedule', updatedSchedule);
                  },
                });

                // Effect to handle newly created student
                useEffect(() => {
                  if (newlyCreatedStudent) {
                    console.log(
                      'Adding newly created student:',
                      newlyCreatedStudent
                    );
                    handleAddStudent(newlyCreatedStudent);
                  }
                }, [newlyCreatedStudent]);

                // Handle navigating to add a new student
                const handleAddNewStudentClick = () => {
                  // Capture the current teacher information that's being entered
                  const teacherInfo = {
                    fullName: values.personalInfo.fullName,
                    instrument: values.professionalInfo.instrument,
                  };

                  console.log(
                    'Requesting to add new student with teacher info:',
                    teacherInfo
                  );

                  // Use the callback if provided, passing the in-progress teacher info
                  if (onAddNewStudent) {
                    onAddNewStudent(teacherInfo);
                  }
                };

                // Get filtered students for display
                const filteredStudents = getFilteredStudents();

                // Helper function to find schedule item for a student
                const getScheduleItemForStudent = (studentId: string) => {
                  return (
                    values.teaching.schedule.find(
                      (item) => item.studentId === studentId
                    ) || {
                      studentId,
                      day: DAYS_OF_WEEK[0],
                      time: '08:00',
                      duration: 45,
                      isActive: true,
                    }
                  );
                };

                // Handle schedule changes for a student
                const handleScheduleChange = (
                  studentId: string,
                  field: keyof Omit<ScheduleItem, 'studentId' | 'isActive'>,
                  value: string | number
                ) => {
                  const scheduleItems = [...values.teaching.schedule];
                  const itemIndex = scheduleItems.findIndex(
                    (item) => item.studentId === studentId
                  );

                  if (itemIndex >= 0) {
                    // Update existing item
                    scheduleItems[itemIndex] = {
                      ...scheduleItems[itemIndex],
                      [field]: value,
                    };
                  } else {
                    // Create new item
                    scheduleItems.push({
                      studentId,
                      day:
                        field === 'day' ? (value as string) : DAYS_OF_WEEK[0],
                      time: field === 'time' ? (value as string) : '08:00',
                      duration: field === 'duration' ? (value as number) : 45,
                      isActive: true,
                    });
                  }

                  setFieldValue('teaching.schedule', scheduleItems);
                };

                // Sync email between personal info and credentials
                useEffect(() => {
                  if (isNewTeacher) {
                    setFieldValue(
                      'credentials.email',
                      values.personalInfo.email,
                      false
                    );
                  }
                }, [values.personalInfo.email, isNewTeacher, setFieldValue]);

                // Make sure credentials email is validated against personal email
                const validateForm = () => {
                  if (
                    isNewTeacher &&
                    values.credentials.email !== values.personalInfo.email
                  ) {
                    // Force sync the emails before validation
                    setFieldValue(
                      'credentials.email',
                      values.personalInfo.email,
                      true
                    );
                    return false;
                  }
                  return true;
                };

                return (
                  <Form>
                    {/* Personal Information */}
                    <div className='form-section'>
                      <h3>פרטים אישיים</h3>

                      {/* Full Name */}
                      <div className='form-row full-width'>
                        <FormField
                          label='שם מלא'
                          name='personalInfo.fullName'
                          type='text'
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Phone and Email - keep as two columns on mobile */}
                      <div className='form-row narrow-fields'>
                        <FormField
                          label='טלפון'
                          name='personalInfo.phone'
                          type='tel'
                          placeholder='05XXXXXXXX'
                          required
                          disabled={isSubmitting}
                        />

                        <FormField
                          label='דוא"ל'
                          name='personalInfo.email'
                          type='email'
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Address */}
                      <div className='form-row full-width'>
                        <FormField
                          label='כתובת'
                          name='personalInfo.address'
                          type='text'
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className='form-section'>
                      <h3>מידע מקצועי</h3>

                      {/* Roles - Checkboxes */}
                      <div className='form-row full-width'>
                        <div className='form-group'>
                          <label
                            className={
                              errors.roles && touched.roles
                                ? 'required-field is-invalid'
                                : 'required-field'
                            }
                          >
                            תפקידים
                          </label>
                          <div className='checkbox-group'>
                            {VALID_ROLES.map((role) => (
                              <div key={role} className='checkbox-item'>
                                <input
                                  type='checkbox'
                                  id={`role-${role}`}
                                  name='roles'
                                  value={role}
                                  checked={values.roles.includes(role)}
                                  onChange={(e) => {
                                    const { value, checked } = e.target;
                                    let updatedRoles = [...values.roles];

                                    if (checked) {
                                      // Add the role if it's not already there
                                      if (!updatedRoles.includes(value)) {
                                        updatedRoles.push(value);
                                      }
                                    } else {
                                      // Remove the role
                                      updatedRoles = updatedRoles.filter(
                                        (r) => r !== value
                                      );

                                      // Make sure there's at least one role
                                      if (updatedRoles.length === 0) {
                                        updatedRoles = ['מורה'];
                                      }
                                    }

                                    setFieldValue('roles', updatedRoles);
                                  }}
                                  disabled={isSubmitting}
                                />
                                <label htmlFor={`role-${role}`}>{role}</label>
                              </div>
                            ))}
                          </div>
                          {errors.roles && touched.roles && (
                            <div className='form-error'>
                              {errors.roles as string}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Conditional Fields based on Role - side by side when possible */}
                      <div className='form-row narrow-fields'>
                        {isTeacher && (
                          <FormField
                            label='כלי נגינה (למורה)'
                            name='professionalInfo.instrument'
                            as='select'
                            required={isTeacher}
                            disabled={isSubmitting}
                          >
                            <option value='' disabled>
                              בחר כלי נגינה
                            </option>
                            {VALID_INSTRUMENTS.map((instrument) => (
                              <option key={instrument} value={instrument}>
                                {instrument}
                              </option>
                            ))}
                          </FormField>
                        )}

                        {isConductor && (
                          <div className='form-group'>
                            <label htmlFor='orchestras'>תזמורות (למנצח)</label>
                            <select
                              id='orchestras'
                              name='conducting.orchestraIds'
                              multiple
                              value={values.conducting.orchestraIds}
                              onChange={(e) => {
                                const selectedOptions = Array.from(
                                  e.target.selectedOptions
                                ).map((option) => option.value);
                                setFieldValue(
                                  'conducting.orchestraIds',
                                  selectedOptions
                                );
                              }}
                              className={
                                errors.conducting?.orchestraIds &&
                                touched.conducting?.orchestraIds
                                  ? 'is-invalid'
                                  : ''
                              }
                              disabled={isSubmitting || loadingOrchestras}
                            >
                              {loadingOrchestras ? (
                                <option disabled>טוען תזמורות...</option>
                              ) : orchestras.length > 0 ? (
                                orchestras.map((orchestra) => (
                                  <option
                                    key={orchestra._id}
                                    value={orchestra._id}
                                  >
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
                            {errors.conducting?.orchestraIds &&
                              touched.conducting?.orchestraIds && (
                                <div className='form-error'>
                                  {errors.conducting.orchestraIds as string}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Students Section - Only for teachers */}
                    {isTeacher && (
                      <div className='form-section'>
                        <h3>תלמידים</h3>

                        {/* Selected Students List */}
                        {selectedStudents.length > 0 && (
                          <div className='selected-members-list'>
                            <h4>תלמידים שהוקצו למורה</h4>
                            {selectedStudents.map((student) => (
                              <div
                                key={student._id}
                                className='student-schedule-item'
                              >
                                <div className='student-info'>
                                  <div className='student-name'>
                                    {student.personalInfo.fullName}
                                  </div>
                                  <div className='student-details'>
                                    <span>
                                      {student.academicInfo.instrument}
                                    </span>
                                    <span>
                                      כיתה {student.academicInfo.class}
                                    </span>
                                    <span>
                                      שלב {student.academicInfo.currentStage}
                                    </span>
                                  </div>
                                  <button
                                    type='button'
                                    className='remove-student-btn'
                                    onClick={() =>
                                      handleRemoveStudent(student._id)
                                    }
                                    aria-label='הסר תלמיד'
                                    disabled={isSubmitting}
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Student Search or Add Buttons */}
                        <div className='student-actions'>
                          {showStudentSearch ? (
                            <div className='search-container'>
                              <div className='search-header'>
                                <h4>חיפוש תלמידים</h4>
                                <button
                                  type='button'
                                  className='btn'
                                  onClick={() => setShowStudentSearch(false)}
                                  disabled={isSubmitting}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                              <div className='search-input-wrapper'>
                                <Search className='search-icon' size={16} />
                                <input
                                  type='text'
                                  className='search-input'
                                  placeholder='חפש תלמיד לפי שם, כלי או כיתה...'
                                  value={searchQuery}
                                  onChange={(e) =>
                                    handleStudentSearch(e.target.value)
                                  }
                                  disabled={isSubmitting}
                                />
                              </div>

                              {loadingStudents ? (
                                <div className='loading-message'>
                                  טוען תלמידים...
                                </div>
                              ) : filteredStudents.length === 0 ? (
                                <div className='no-results'>
                                  לא נמצאו תלמידים
                                </div>
                              ) : (
                                <div className='search-results-dropdown'>
                                  {filteredStudents.map((student) => (
                                    <div
                                      key={student._id}
                                      className='search-result-item'
                                      onClick={() =>
                                        !isSubmitting &&
                                        handleAddStudent(student)
                                      }
                                      style={{
                                        cursor: isSubmitting
                                          ? 'not-allowed'
                                          : 'pointer',
                                      }}
                                    >
                                      <User
                                        className='student-icon'
                                        size={16}
                                      />
                                      <span>
                                        {student.personalInfo.fullName}
                                      </span>
                                      <span className='student-instrument'>
                                        {student.academicInfo.instrument}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className='student-action-buttons'>
                              <button
                                type='button'
                                className='btn primary'
                                onClick={() => setShowStudentSearch(true)}
                                disabled={isSubmitting}
                              >
                                <span>חיפוש תלמידים קיימים</span>
                              </button>

                              <button
                                type='button'
                                className='btn primary'
                                onClick={handleAddNewStudentClick}
                                disabled={isSubmitting}
                              >
                                <span>הוספת תלמיד חדש</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Time Block Management Section - Only for existing teachers */}
                    {teacher?._id && isTeacher && (
                      <div className='form-section'>
                        <TeacherTimeBlockManager
                          teacherId={teacher._id}
                          teacherName={teacher.personalInfo?.fullName || 'מורה לא ידוע'}
                          onTimeBlockChange={(timeBlocks) => {
                            console.log('Time blocks updated:', timeBlocks);
                          }}
                        />
                      </div>
                    )}

                    {/* Authentication - Only shown for new teachers */}
                    {isNewTeacher && (
                      <div className='form-section'>
                        <h3>הרשאות</h3>

                        {/* Email (this should be disabled and synced with the personal email) */}
                        <div className='form-row full-width'>
                          <FormField
                            label='דוא"ל (להתחברות)'
                            name='credentials.email'
                            type='email'
                            required
                            disabled={true} // Always disabled - synced with personal email
                          />
                        </div>

                        {/* Password */}
                        <div className='form-row full-width'>
                          <div className='form-group'>
                            <label
                              htmlFor='password'
                              className={
                                errors.credentials?.password &&
                                touched.credentials?.password
                                  ? 'required-field is-invalid'
                                  : 'required-field'
                              }
                            >
                              סיסמה
                            </label>
                            <div className='password-input-container'>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                id='password'
                                name='credentials.password'
                                value={values.credentials.password}
                                onChange={(e) => {
                                  setFieldValue(
                                    'credentials.password',
                                    e.target.value
                                  );
                                }}
                                className={
                                  errors.credentials?.password &&
                                  touched.credentials?.password
                                    ? 'is-invalid'
                                    : ''
                                }
                                required
                                disabled={isSubmitting}
                              />
                              <button
                                type='button'
                                className='toggle-password-btn'
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={
                                  showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'
                                }
                                disabled={isSubmitting}
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            </div>
                            {errors.credentials?.password &&
                              touched.credentials?.password && (
                                <div className='form-error'>
                                  {errors.credentials.password}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Form Actions */}
                    <div className='form-actions'>
                      <button
                        type='submit'
                        className='btn primary'
                        onClick={() => validateForm()}
                        disabled={isLoading || isSubmitting}
                      >
                        {isLoading || isSubmitting
                          ? 'שומר...'
                          : teacher?._id
                          ? 'עדכון'
                          : 'הוספה'}
                      </button>

                      <button
                        type='button'
                        className='btn secondary'
                        onClick={handleModalClose}
                        disabled={isSubmitting}
                      >
                        ביטול
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        );
    }
  };

  return (
    <div className='teacher-form responsive-form'>
      <div className='overlay' onClick={handleModalClose}></div>
      <div className='form-modal' {...modalProps}>
        {/* Hidden description for screen readers */}
        <div {...descriptionProps} className="sr-only">
          {teacher?._id ? 'טופס עריכת פרטי מורה קיים במערכת' : 'טופס הוספת מורה חדש למערכת'}
        </div>
        {renderModalContent()}
      </div>
      
      {/* Duplicate Confirmation Modal */}
      {duplicateInfo && (
        <DuplicateConfirmationModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          duplicateInfo={duplicateInfo}
          onConfirm={handleDuplicateConfirmation}
          onCancel={handleDuplicateCancel}
          isAdmin={isAdmin()}
          isSubmitting={isLoading}
        />
      )}
    </div>
  );
}
