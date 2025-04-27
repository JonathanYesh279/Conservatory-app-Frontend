// src/hooks/useTeacherForm.ts
import { useState, useEffect, useCallback } from 'react';
import { Teacher } from '../services/teacherService';
import { useTeacherStore } from '../store/teacherStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { Orchestra, orchestraService } from '../services/orchestraService';

// Define schedule item interface
export interface ScheduleItem {
  studentId: string;
  day: string;
  time: string;
  duration: number;
  isActive: boolean;
}

// Define type for form data structure
export interface TeacherFormData {
  _id?: string;
  personalInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
  roles: string[];
  professionalInfo: {
    instrument: string;
    isActive: boolean;
  };
  teaching: {
    studentIds: string[];
    schedule: ScheduleItem[];
  };
  conducting: {
    orchestraIds: string[];
  };
  ensemblesIds: string[];
  schoolYears: Array<{
    schoolYearId: string;
    isActive: boolean;
  }>;
  credentials: {
    email: string;
    password: string;
  };
  isActive: boolean;
}

// Constants for validation and form selection
export const VALID_RULES = [
  'מורה',
  'מנצח',
  'מדריך הרכב',
  'מנהל',
  'מורה תאוריה',
];
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

// Constants for student scheduling
export const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
export const LESSON_DURATIONS = [30, 45, 60];

interface UseTeacherFormProps {
  initialTeacher: Partial<Teacher> | null;
  onClose: () => void;
  onSave?: () => void;
}

export const useTeacherForm = ({
  initialTeacher,
  onClose,
  onSave,
}: UseTeacherFormProps) => {
  const { saveTeacher, isLoading, error, clearError } = useTeacherStore();
  const { currentSchoolYear } = useSchoolYearStore();

  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [loadingOrchestras, setLoadingOrchestras] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
  });

  // Schedule management - keep it separate from formData for better control
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if this is a new teacher or existing teacher
  const isNewTeacher = !initialTeacher?._id;

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

  // Load orchestras
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

  // Update formData.teaching.schedule whenever scheduleItems changes
  useEffect(() => {
    if (scheduleItems.length > 0) {
      console.log(
        'Updating formData schedule from scheduleItems:',
        scheduleItems
      );
      setFormData((prev) => ({
        ...prev,
        teaching: {
          ...prev.teaching,
          schedule: [...scheduleItems],
        },
      }));
    }
  }, [scheduleItems]);

  // If editing an existing teacher, populate form data
  useEffect(() => {
    if (initialTeacher?._id) {
      // Initialize schedule items from teacher data
      if (
        initialTeacher.teaching?.schedule &&
        Array.isArray(initialTeacher.teaching.schedule)
      ) {
        // Make sure each schedule item has all required fields with valid defaults
        const validScheduleItems = initialTeacher.teaching.schedule
          .filter((item) => item && item.studentId) // Filter out invalid items
          .map((item) => ({
            studentId: item.studentId,
            day: item.day || DAYS_OF_WEEK[0],
            time: item.time || '08:00',
            duration: item.duration || 45,
            isActive: item.isActive !== false,
          }));

        console.log('Setting initial schedule items:', validScheduleItems);
        setScheduleItems(validScheduleItems);
      }

      setFormData({
        _id: initialTeacher._id,
        personalInfo: {
          fullName: initialTeacher.personalInfo?.fullName || '',
          phone: initialTeacher.personalInfo?.phone || '',
          email: initialTeacher.personalInfo?.email || '',
          address: initialTeacher.personalInfo?.address || '',
        },
        roles: initialTeacher.roles || ['מורה'],
        professionalInfo: {
          instrument:
            initialTeacher.professionalInfo?.instrument || VALID_INSTRUMENTS[0],
          isActive: initialTeacher.professionalInfo?.isActive !== false,
        },
        teaching: {
          studentIds: initialTeacher.teaching?.studentIds || [],
          schedule: initialTeacher.teaching?.schedule || [],
        },
        conducting: {
          orchestraIds: initialTeacher.conducting?.orchestraIds || [],
        },
        ensemblesIds: initialTeacher.ensemblesIds || [],
        schoolYears: initialTeacher.schoolYears || [],
        credentials: {
          email: initialTeacher.personalInfo?.email || '',
          password: '', // Don't include password for updates
        },
        isActive: initialTeacher.isActive !== false,
      });
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
          ? [{ schoolYearId: currentSchoolYear._id, isActive: true }]
          : [],
        credentials: {
          email: '',
          password: '',
        },
        isActive: true,
      });

      // Reset scheduleItems
      setScheduleItems([]);
    }

    setErrors({});
    clearError?.();
  }, [initialTeacher, clearError, currentSchoolYear]);

  // Handle input changes
  const handlePersonalInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prevData) => {
        const updatedPersonalInfo = { ...prevData.personalInfo, [name]: value };

        // Keep email synchronized with credentials email (for new teachers only)
        const updatedCredentials = {
          ...prevData.credentials,
          email: name === 'email' ? value : prevData.credentials.email,
        };

        return {
          ...prevData,
          personalInfo: updatedPersonalInfo,
          credentials: updatedCredentials,
        };
      });

      // Clear error for this field if it exists
      setErrors((prevErrors) => {
        if (prevErrors[`personalInfo.${name}`]) {
          const newErrors = { ...prevErrors };
          delete newErrors[`personalInfo.${name}`];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  const handleProfessionalInfoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      setFormData((prevData) => ({
        ...prevData,
        professionalInfo: {
          ...prevData.professionalInfo,
          [name]: value,
        },
      }));

      setErrors((prevErrors) => {
        if (prevErrors[`professionalInfo.${name}`]) {
          const newErrors = { ...prevErrors };
          delete newErrors[`professionalInfo.${name}`];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  // Enhanced handleRolesChange function with better logging
  const handleRolesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value, checked } = e.target;

      setFormData((prevData) => {
        let updatedRoles = [...prevData.roles];

        if (checked) {
          // Add the role if it's not already there
          if (!updatedRoles.includes(value)) {
            updatedRoles.push(value);
          }
        } else {
          // Remove the role
          updatedRoles = updatedRoles.filter((role) => role !== value);

          // Make sure there's at least one role
          if (updatedRoles.length === 0) {
            updatedRoles = ['מורה'];
          }
        }

        // Update the form data with the new roles array
        return {
          ...prevData,
          roles: updatedRoles,
        };
      });

      // Clear any role-related errors
      setErrors((prevErrors) => {
        if (prevErrors['roles']) {
          const newErrors = { ...prevErrors };
          delete newErrors['roles'];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  const handleCredentialsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      setFormData((prevData) => ({
        ...prevData,
        credentials: {
          ...prevData.credentials,
          [name]: value,
        },
      }));

      setErrors((prevErrors) => {
        if (prevErrors[`credentials.${name}`]) {
          const newErrors = { ...prevErrors };
          delete newErrors[`credentials.${name}`];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  // Handle orchestra selection (for conductors)
  const handleOrchestraChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );

      setFormData((prevData) => ({
        ...prevData,
        conducting: {
          ...prevData.conducting,
          orchestraIds: selectedOptions,
        },
      }));

      setErrors((prevErrors) => {
        if (prevErrors['conducting.orchestraIds']) {
          const newErrors = { ...prevErrors };
          delete newErrors['conducting.orchestraIds'];
          return newErrors;
        }
        return prevErrors;
      });
    },
    []
  );

  // Handle updating schedule for a student - FIXED
  const handleScheduleChange = useCallback(
    (
      studentId: string,
      field: 'day' | 'time' | 'duration',
      value: string | number
    ) => {
      console.log(
        `Updating schedule for student ${studentId}, ${field} = ${value}`
      );

      // Update scheduleItems
      setScheduleItems((prevScheduleItems) => {
        // Check if a schedule item already exists for this student
        const existingItemIndex = prevScheduleItems.findIndex(
          (item) => item.studentId === studentId
        );

        // If no schedule item exists for this student, create a new one
        if (existingItemIndex === -1) {
          const newItem: ScheduleItem = {
            studentId,
            day: field === 'day' ? (value as string) : DAYS_OF_WEEK[0],
            time: field === 'time' ? (value as string) : '08:00',
            duration: field === 'duration' ? (value as number) : 45,
            isActive: true,
          };

          console.log(
            `Created new schedule item for student ${studentId}:`,
            newItem
          );
          return [...prevScheduleItems, newItem];
        }

        // Otherwise update the existing item
        const updatedItems = [...prevScheduleItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          [field]: value,
        };

        console.log(`Updated schedule item:`, updatedItems[existingItemIndex]);
        return updatedItems;
      });
    },
    []
  );

  // Add a schedule item for a student - FIXED
  const addScheduleItem = useCallback(
    (studentId: string) => {
      // Check if schedule item already exists for this student
      const existingItem = scheduleItems.find(
        (item) => item.studentId === studentId
      );

      if (existingItem) {
        console.log(
          `Schedule item already exists for student ${studentId}:`,
          existingItem
        );
        return; // Don't add duplicate schedule items
      }

      const newScheduleItem: ScheduleItem = {
        studentId,
        day: DAYS_OF_WEEK[0],
        time: '08:00',
        duration: 45,
        isActive: true,
      };

      console.log(
        `Creating new schedule item for student ${studentId}:`,
        newScheduleItem
      );

      setScheduleItems((prev) => [...prev, newScheduleItem]);
    },
    [scheduleItems]
  );

  // Remove schedule item for a student - FIXED
  const removeScheduleItem = useCallback((studentId: string) => {
    console.log(`Removing schedule item for student ${studentId}`);
    setScheduleItems((prev) =>
      prev.filter((item) => item.studentId !== studentId)
    );
  }, []);

  // Update form data with student IDs
  const updateStudentIds = useCallback((studentIds: string[]) => {
    console.log(`Updating student IDs:`, studentIds);
    setFormData((prevData) => ({
      ...prevData,
      teaching: {
        ...prevData.teaching,
        studentIds,
      },
    }));
  }, []);

  // Validate form based on whether it's a new teacher or update
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.personalInfo?.fullName) {
      newErrors['personalInfo.fullName'] = 'שם מלא הוא שדה חובה';
    }

    if (!formData.personalInfo?.phone) {
      newErrors['personalInfo.phone'] = 'טלפון הוא שדה חובה';
    } else if (!/^05\d{8}$/.test(formData.personalInfo.phone)) {
      newErrors['personalInfo.phone'] =
        'מספר טלפון לא תקין (צריך להתחיל ב-05 ולכלול 10 ספרות)';
    }

    if (!formData.personalInfo?.email) {
      newErrors['personalInfo.email'] = 'דוא"ל הוא שדה חובה';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)
    ) {
      newErrors['personalInfo.email'] = 'כתובת דוא"ל לא תקינה';
    }

    if (!formData.personalInfo?.address) {
      newErrors['personalInfo.address'] = 'כתובת היא שדה חובה';
    }

    // Check if teacher role is selected
    const isTeacher = formData.roles.includes('מורה');

    // Validate teacher specific fields
    if (isTeacher && !formData.professionalInfo?.instrument) {
      newErrors['professionalInfo.instrument'] = 'כלי נגינה הוא שדה חובה למורה';
    }

    // Validate role selection
    if (formData.roles.length === 0) {
      newErrors['roles'] = 'יש לבחור לפחות תפקיד אחד';
    }

    // Only validate credentials for new teachers
    if (isNewTeacher) {
      // For new teachers, password is required
      if (!formData.credentials.password) {
        newErrors['credentials.password'] = 'סיסמה היא שדה חובה';
      }

      // Email in credentials must match email in personal info
      if (formData.personalInfo.email !== formData.credentials.email) {
        newErrors['credentials.email'] =
          'דוא"ל בהרשאות חייב להתאים לדוא"ל בפרטים אישיים';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isNewTeacher]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      console.log('Submit triggered');

      if (!validateForm()) {
        console.log('Validation failed');
        return false;
      }

      setIsSubmitting(true);

      try {
        const teacherId = formData._id;

        // Ensure all schedule items have valid values before submission
        const validScheduleItems = scheduleItems.map((item) => ({
          studentId: item.studentId,
          day: item.day || DAYS_OF_WEEK[0],
          time: item.time || '08:00',
          duration: item.duration || 45,
          isActive: item.isActive !== false,
        }));

        // Make sure form data contains the latest schedule
        const formDataWithSchedule = {
          ...formData,
          teaching: {
            ...formData.teaching,
            schedule: validScheduleItems,
          },
        };

        console.log('Submitting with schedule:', validScheduleItems);

        // Create a data object for submission
        let dataToSend: any;

        if (teacherId) {
          // For updates: explicitly include only what we want to update
          dataToSend = {
            personalInfo: formDataWithSchedule.personalInfo,
            roles: formDataWithSchedule.roles,
            professionalInfo: formDataWithSchedule.professionalInfo,
            isActive: formDataWithSchedule.isActive,
          };

          // Only include teaching data if there are students
          if (
            formDataWithSchedule.teaching &&
            formDataWithSchedule.teaching.studentIds.length > 0
          ) {
            dataToSend.teaching = {
              studentIds: formDataWithSchedule.teaching.studentIds,
            };

            // Always include the schedule
            if (validScheduleItems.length > 0) {
              dataToSend.teaching.schedule = validScheduleItems;
            }
          }

          // Include conducting data if there are orchestras
          if (
            formDataWithSchedule.conducting &&
            formDataWithSchedule.conducting.orchestraIds.length > 0
          ) {
            dataToSend.conducting = {
              orchestraIds: formDataWithSchedule.conducting.orchestraIds,
            };
          }

          if (
            formDataWithSchedule.ensemblesIds &&
            formDataWithSchedule.ensemblesIds.length > 0
          ) {
            dataToSend.ensemblesIds = formDataWithSchedule.ensemblesIds;
          }

          console.log('Final update data to be sent:', dataToSend);
        } else {
          // For new teachers: include all data including credentials
          const { _id, ...dataWithoutId } = formDataWithSchedule;
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

        let savedTeacher;

        // Save or update teacher
        if (teacherId) {
          savedTeacher = await saveTeacher(dataToSend, teacherId);
        } else {
          savedTeacher = await saveTeacher(dataToSend);
        }

        // Call optional onSave callback
        if (onSave) {
          onSave();
        }

        // Close the form after successful save
        onClose();
        return true;
      } catch (err) {
        console.error('Error saving teacher:', err);
        // More detailed error display
        const errorMessage =
          err instanceof Error ? err.message : 'שגיאה לא ידועה בשמירת המורה';
        console.error('Error message:', errorMessage);
        setErrors((prev) => ({
          ...prev,
          form: errorMessage,
        }));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      scheduleItems,
      validateForm,
      saveTeacher,
      onSave,
      onClose,
      currentSchoolYear,
    ]
  );

  // Return all the necessary state and functions
  return {
    formData,
    scheduleItems,
    errors,
    isLoading,
    isSubmitting,
    orchestras,
    loadingOrchestras,
    error,
    showPassword,
    isMobile,
    isNewTeacher,

    // Functions
    setFormData,
    setScheduleItems,
    setShowPassword,
    handlePersonalInfoChange,
    handleProfessionalInfoChange,
    handleRolesChange,
    handleCredentialsChange,
    handleOrchestraChange,
    handleScheduleChange,
    addScheduleItem,
    removeScheduleItem,
    updateStudentIds,
    validateForm,
    handleSubmit,
  };
};
