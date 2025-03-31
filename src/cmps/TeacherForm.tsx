import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Teacher } from '../services/teacherService';
import { useTeacherStore } from '../store/teacherStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { Orchestra, orchestraService } from '../services/orchestraService';

// Define type for form data structure
interface TeacherFormData {
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
    schedule: Array<{
      studentId: string;
      day: string;
      time: string;
      duration: number;
    }>;
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
const VALID_RULES = ['מורה', 'מנצח', 'מדריך הרכב', 'מנהל', 'מדריך תאוריה'];
const VALID_INSTRUMENTS = [
  'חצוצרה',
  'חליל צד',
  'קלרינט',
  'קרן יער',
  'בריטון',
  'טרומבון',
  'סקסופון',
];

interface TeacherFormProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Partial<Teacher>;
  onSave?: () => void;
}

export function TeacherForm({
  isOpen,
  onClose,
  teacher,
  onSave,
}: TeacherFormProps) {
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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

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

  // Check if teacher is conductor or teacher
  const isConductor = formData.roles.includes('מנצח');
  const isTeacher = formData.roles.includes('מורה');

  // If editing an existing teacher, populate form data
  useEffect(() => {
    if (teacher?._id) {
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
          password: teacher.credentials?.password || '********', // We don't actually get the password from the server
        },
        isActive: teacher.isActive !== false,
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
      });
    }

    setErrors({});
    clearError?.();
  }, [teacher, isOpen, clearError, currentSchoolYear]);

  // Handle input changes
  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const updatedPersonalInfo = { ...formData.personalInfo, [name]: value };

    // Keep email synchronized with credentials email
    const updatedCredentials = {
      ...formData.credentials,
      email: name === 'email' ? value : formData.credentials.email,
    };

    setFormData({
      ...formData,
      personalInfo: updatedPersonalInfo,
      credentials: updatedCredentials,
    });

    // Clear error for this field if it exists
    if (errors[`personalInfo.${name}`]) {
      setErrors({
        ...errors,
        [`personalInfo.${name}`]: '',
      });
    }
  };

  const handleProfessionalInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      professionalInfo: {
        ...formData.professionalInfo,
        [name]: value,
      },
    });

    if (errors[`professionalInfo.${name}`]) {
      setErrors({
        ...errors,
        [`professionalInfo.${name}`]: '',
      });
    }
  };

  const handleRolesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;

    let updatedRoles = [...formData.roles];

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

    setFormData({
      ...formData,
      roles: updatedRoles,
    });
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      credentials: {
        ...formData.credentials,
        [name]: value,
      },
    });

    if (errors[`credentials.${name}`]) {
      setErrors({
        ...errors,
        [`credentials.${name}`]: '',
      });
    }
  };

  // Handle orchestra selection (for conductors)
  const handleOrchestraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );

    setFormData({
      ...formData,
      conducting: {
        ...formData.conducting,
        orchestraIds: selectedOptions,
      },
    });

    if (errors['conducting.orchestraIds']) {
      setErrors({
        ...errors,
        'conducting.orchestraIds': '',
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
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

    // Validate teacher specific fields
    if (isTeacher && !formData.professionalInfo?.instrument) {
      newErrors['professionalInfo.instrument'] = 'כלי נגינה הוא שדה חובה למורה';
    }

    // Validate conductor specific fields
    if (
      isConductor &&
      (!formData.conducting?.orchestraIds ||
        formData.conducting.orchestraIds.length === 0)
    ) {
      newErrors['conducting.orchestraIds'] = 'יש לבחור לפחות תזמורת אחת למנצח';
    }

    if (formData.roles.length === 0) {
      newErrors['roles'] = 'יש לבחור לפחות תפקיד אחד';
    }

    // For new teachers, password is required
    if (!formData._id && !formData.credentials.password) {
      newErrors['credentials.password'] = 'סיסמה היא שדה חובה';
    }

    // Email in credentials must match email in personal info
    if (formData.personalInfo.email !== formData.credentials.email) {
      newErrors['credentials.email'] =
        'דוא"ל בהרשאות חייב להתאים לדוא"ל בפרטים אישיים';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const teacherId = formData._id;
      const { _id, ...dataWithoutId } = formData;

      // Handle password for existing teachers
      if (teacherId && dataWithoutId.credentials.password === '********') {
        // Remove password if it's the masked placeholder
        dataWithoutId.credentials = {
          email: dataWithoutId.credentials.email,
        };
      }

      // Make sure the teacher has the current school year in enrollments
      if (
        currentSchoolYear &&
        !dataWithoutId.schoolYears?.some(
          (sy) => sy.schoolYearId === currentSchoolYear._id
        )
      ) {
        dataWithoutId.schoolYears = [
          ...(dataWithoutId.schoolYears || []),
          { schoolYearId: currentSchoolYear._id, isActive: true },
        ];
      }

      // Save or update teacher
      if (teacherId) {
        await saveTeacher({
          _id: teacherId,
          ...dataWithoutId,
        });
      } else {
        await saveTeacher(dataWithoutId);
      }

      // Call optional onSave callback
      if (onSave) {
        onSave();
      }

      // Close the form after successful save
      onClose();
    } catch (err) {
      console.error('Error saving teacher:', err);
    }
  };

  if (!isOpen) return null;

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
                  <label htmlFor='orchestras'>תזמורות (למנצח) *</label>
                  <select
                    id='orchestras'
                    name='orchestraIds'
                    multiple
                    value={formData.conducting.orchestraIds || []}
                    onChange={handleOrchestraChange}
                    required={isConductor}
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

          {/* Authentication */}
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
                <label htmlFor='password'>
                  סיסמה *
                  {teacher?._id ? ' (השאר ריק לשמירת הסיסמה הקיימת)' : ''}
                </label>
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
                    required={!teacher?._id} // Required only for new teachers
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
  );
}
