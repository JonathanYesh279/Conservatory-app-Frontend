// src/cmps/OrchestraForm.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Orchestra } from '../services/orchestraService';
import { useOrchestraStore } from '../store/orchestraStore';
import { useTeacherStore } from '../store/teacherStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { Teacher } from '../services/teacherService';

// Constants for validation
const VALID_TYPES = ['הרכב', 'תזמורת'];
const VALID_NAMES = [
  'תזמורת מתחילים נשיפה',
  'תזמורת עתודה נשיפה',
  'תזמורת צעירה נשיפה',
  'תזמורת יצוגית נשיפה',
  'תזמורת סימפונית',
];

interface OrchestraFormData {
  _id?: string;
  name: string;
  type: string;
  conductorId: string;
  memberIds: string[];
  rehearsalIds: string[];
  schoolYearId: string;
  isActive: boolean;
}

interface OrchestraFormProps {
  isOpen: boolean;
  onClose: () => void;
  orchestra: Orchestra | null;
  onSave?: () => void;
}

export function OrchestraForm({
  isOpen,
  onClose,
  orchestra,
  onSave,
}: OrchestraFormProps) {
  const { saveOrchestra, isLoading, error, clearError } = useOrchestraStore();
  const { currentSchoolYear } = useSchoolYearStore();
  const { loadTeachers } = useTeacherStore();
  const [conductors, setConductors] = useState<Teacher[]>([]);
  const [isLoadingConductors, setIsLoadingConductors] = useState(false);

  // Form state
  const [formData, setFormData] = useState<OrchestraFormData>({
    name: '',
    type: VALID_TYPES[1], // Default to 'תזמורת'
    conductorId: '',
    memberIds: [],
    rehearsalIds: [],
    schoolYearId: '',
    isActive: true,
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load conductors when component mounts or when the form opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchConductors = async () => {
      setIsLoadingConductors(true);
      try {
        // Fetch teachers with the conductor role directly
        const conductorResponse = await loadTeachers({
          role: 'מנצח',
          isActive: true,
        });

        // The loadTeachers function should return the teachers
        if (Array.isArray(conductorResponse)) {
          setConductors(conductorResponse);
        } else {
          // Get conductors from the teacherStore state if the function doesn't return them
          const teacherStore = useTeacherStore.getState();
          const filteredConductors = teacherStore.teachers.filter((teacher) =>
            teacher.roles.includes('מנצח')
          );
          setConductors(filteredConductors);
        }
      } catch (err) {
        console.error('Failed to load conductors:', err);
      } finally {
        setIsLoadingConductors(false);
      }
    };

    fetchConductors();
  }, [isOpen, loadTeachers]); // Only depend on isOpen and loadTeachers, not on teachers

  // If editing an existing orchestra, populate form data
  useEffect(() => {
    if (orchestra?._id) {
      setFormData({
        _id: orchestra._id,
        name: orchestra.name || '',
        type: orchestra.type || VALID_TYPES[1],
        conductorId: orchestra.conductorId || '',
        memberIds: orchestra.memberIds || [],
        rehearsalIds: orchestra.rehearsalIds || [],
        schoolYearId:
          orchestra.schoolYearId ||
          (currentSchoolYear ? currentSchoolYear._id : ''),
        isActive: orchestra.isActive !== false,
      });
    } else {
      // Reset form for new orchestra
      setFormData({
        name: '',
        type: VALID_TYPES[1],
        conductorId: '',
        memberIds: [],
        rehearsalIds: [],
        schoolYearId: currentSchoolYear ? currentSchoolYear._id : '',
        isActive: true,
      });
    }

    setErrors({});
    clearError?.();
  }, [orchestra, isOpen, clearError, currentSchoolYear]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name) {
      newErrors['name'] = 'שם התזמורת הוא שדה חובה';
    }

    if (!formData.type) {
      newErrors['type'] = 'סוג התזמורת הוא שדה חובה';
    }

    if (!formData.conductorId) {
      newErrors['conductorId'] = 'יש לבחור מנצח';
    }

    if (!formData.schoolYearId) {
      newErrors['schoolYearId'] = 'שנת לימודים היא שדה חובה';
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
      // Save orchestra to store
      await saveOrchestra(formData);

      // Call optional onSave callback
      if (onSave) {
        onSave();
      }

      // Close the form after successful save
      onClose();
    } catch (err) {
      console.error('Error saving orchestra:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='orchestra-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>{orchestra?._id ? 'עריכת תזמורת' : 'הוספת תזמורת חדשה'}</h2>

        {error && <div className='error-message'>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Orchestra Information */}
          <div className='form-section'>
            <h3>פרטי תזמורת</h3>

            {/* Orchestra Name */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='name'>שם התזמורת *</label>
                <select
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className={errors['name'] ? 'is-invalid' : ''}
                  required
                >
                  <option value=''>בחר שם תזמורת</option>
                  {VALID_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors['name'] && (
                  <div className='form-error'>{errors['name']}</div>
                )}
              </div>
            </div>

            {/* Orchestra Type */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='type'>סוג *</label>
                <select
                  id='type'
                  name='type'
                  value={formData.type}
                  onChange={handleChange}
                  className={errors['type'] ? 'is-invalid' : ''}
                  required
                >
                  <option value=''>בחר סוג</option>
                  {VALID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors['type'] && (
                  <div className='form-error'>{errors['type']}</div>
                )}
              </div>
            </div>

            {/* Conductor */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='conductorId'>מנצח *</label>
                <select
                  id='conductorId'
                  name='conductorId'
                  value={formData.conductorId}
                  onChange={handleChange}
                  className={errors['conductorId'] ? 'is-invalid' : ''}
                  required
                  disabled={isLoadingConductors}
                >
                  <option value=''>בחר מנצח</option>
                  {conductors.map((conductor) => (
                    <option key={conductor._id} value={conductor._id}>
                      {conductor.personalInfo.fullName}
                    </option>
                  ))}
                </select>
                {isLoadingConductors && (
                  <div className='loading-text'>טוען מנצחים...</div>
                )}
                {errors['conductorId'] && (
                  <div className='form-error'>{errors['conductorId']}</div>
                )}
              </div>
            </div>

            {/* School Year (hidden, using current school year) */}
            <input
              type='hidden'
              name='schoolYearId'
              value={formData.schoolYearId}
            />
          </div>

          {/* Form Actions */}
          <div className='form-actions'>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'שומר...' : orchestra?._id ? 'עדכון' : 'הוספה'}
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
