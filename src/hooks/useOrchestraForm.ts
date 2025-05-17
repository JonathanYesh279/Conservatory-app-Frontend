// src/hooks/useOrchestraForm.ts
import { useState, useEffect } from 'react';
import { Orchestra } from '../services/orchestraService';
import { Teacher } from '../services/teacherService';
import { useOrchestraStore } from '../store/orchestraStore';
import { useTeacherStore } from '../store/teacherStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { useStudentStore } from '../store/studentStore';

export interface OrchestraFormData {
  _id?: string;
  name: string;
  type: string;
  conductorId: string;
  memberIds: string[];
  rehearsalIds: string[];
  schoolYearId: string;
  location: string;
  isActive: boolean;
}

interface UseOrchestraFormProps {
  initialOrchestra: Orchestra | null;
  onClose: () => void;
  onSave?: () => void;
}

export const useOrchestraForm = ({
  initialOrchestra,
  onClose,
  onSave,
}: UseOrchestraFormProps) => {
  const { saveOrchestra, isLoading, error, clearError } = useOrchestraStore();
  const { currentSchoolYear } = useSchoolYearStore();
  const { loadTeachers, loadTeacherByRole } = useTeacherStore();
  const { students, saveStudent } = useStudentStore();

  // Form data state
  const [formData, setFormData] = useState<OrchestraFormData>({
    _id: undefined,
    name: '',
    type: 'תזמורת',
    conductorId: '',
    memberIds: [],
    rehearsalIds: [],
    schoolYearId: '',
    location: 'חדר 1',
    isActive: true,
  });

  // UI state
  const [conductors, setConductors] = useState<Teacher[]>([]);
  const [isLoadingConductors, setIsLoadingConductors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Add submission state to track when form is being submitted
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state
  const isOrchestra = formData.type === 'תזמורת';

  // Initialize form with orchestra data
  useEffect(() => {
    // Only run if not submitting (to avoid state changes during submission)
    if (isSubmitting) return;

    // Initialize form with initial orchestra or defaults
    if (initialOrchestra?._id) {
      setFormData({
        _id: initialOrchestra._id,
        name: initialOrchestra.name || '',
        type: initialOrchestra.type || 'תזמורת',
        conductorId: initialOrchestra.conductorId || '',
        memberIds: initialOrchestra.memberIds || [],
        rehearsalIds: initialOrchestra.rehearsalIds || [],
        schoolYearId:
          initialOrchestra.schoolYearId || currentSchoolYear?._id || '',
        location: initialOrchestra.location || 'חדר 1',
        isActive: initialOrchestra.isActive !== false,
      });
    } else {
      setFormData({
        _id: undefined,
        name: '',
        type: 'תזמורת',
        conductorId: '',
        memberIds: [],
        rehearsalIds: [],
        schoolYearId: currentSchoolYear?._id || '',
        location: 'חדר 1',
        isActive: true,
      });
    }

    // Reset error states
    setErrors({});
    clearError?.();
  }, [initialOrchestra, currentSchoolYear, clearError, isSubmitting]);

  // Load appropriate teachers (conductors or ensemble instructors) when type changes
  useEffect(() => {
    // Skip if submitting
    if (isSubmitting) return;

    const fetchAppropriateTeachers = async () => {
      setIsLoadingConductors(true);
      setConductors([]); // Clear previous conductors while loading

      try {
        const role = formData.type === 'תזמורת' ? 'מנצח' : 'מדריך הרכב';
        console.log(`Fetching teachers with role: ${role}`);

        // Use loadTeacherByRole if available
        if (typeof loadTeacherByRole === 'function') {
          const teachersWithRole = await loadTeacherByRole(role);

          if (Array.isArray(teachersWithRole)) {
            console.log(
              `Found ${teachersWithRole.length} teachers with role ${role}`
            );
            setConductors(teachersWithRole);
          } else {
            console.error(
              `Expected array of teachers, but got:`,
              teachersWithRole
            );
            setConductors([]);
          }
        }
        // Fallback to filtering teachers manually if loadTeacherByRole is not available
        else {
          const allTeachers = await loadTeachers({ role, isActive: true });

          if (Array.isArray(allTeachers)) {
            // Further ensure we only include teachers with the exact role
            const filteredTeachers = allTeachers.filter(
              (teacher) => teacher.roles && teacher.roles.includes(role)
            );

            console.log(
              `Filtered ${filteredTeachers.length} teachers with role ${role}`
            );
            setConductors(filteredTeachers);
          } else {
            console.error(`Expected array of teachers, but got:`, allTeachers);
            setConductors([]);
          }
        }
      } catch (err) {
        console.error(`Failed to load teachers for role:`, err);
        setConductors([]);
      } finally {
        setIsLoadingConductors(false);
      }
    };

    fetchAppropriateTeachers();
  }, [formData.type, loadTeacherByRole, loadTeachers, isSubmitting]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Skip if submitting
    if (isSubmitting) return;

    const { name, value, dataset } = e.target;

    // Special handling for type field
    if (name === 'type') {
      // Reset conductor when type changes
      const updatedData = {
        ...formData,
        type: value,
        conductorId: '', // Always reset conductorId when type changes
      };

      // Update the name if it contains the type
      if (formData.name) {
        const currentType = formData.type === 'תזמורת' ? 'תזמורת' : 'הרכב';
        const newType = value === 'תזמורת' ? 'תזמורת' : 'הרכב';

        if (formData.name.includes(currentType)) {
          updatedData.name = formData.name.replace(currentType, newType);
        }
      }

      setFormData(updatedData);
    } else if (name === 'memberIds') {
      // Handle setting memberIds directly (from studentSelection hook)
      setFormData((prev) => ({
        ...prev,
        memberIds: Array.isArray(value) ? value : prev.memberIds,
      }));
    } else {
      // Regular field update
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Check for validation errors passed through dataset
    if (dataset?.error) {
      setErrors((prev) => {
        if (dataset?.error) {
          const newErrors = { ...prev };
          newErrors[name] = dataset.error;
          return newErrors;
        }
        return prev;
      });
    } else if (errors[name]) {
      // Clear error for this field if it exists
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name) {
      newErrors.name = isOrchestra
        ? 'שם התזמורת הוא שדה חובה'
        : 'שם ההרכב הוא שדה חובה';
    }

    if (!formData.type) {
      newErrors.type = 'סוג הוא שדה חובה';
    }

    if (!formData.conductorId) {
      newErrors.conductorId = isOrchestra
        ? 'יש לבחור מנצח'
        : 'יש לבחור מדריך הרכב';
    }

    if (!formData.location) {
      newErrors.location = 'יש לבחור מקום';
    }

    if (!formData.schoolYearId) {
      newErrors.schoolYearId = 'שנת לימודים היא שדה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Skip if already submitting
    if (isSubmitting) return false;

    // Validate the form
    if (!validateForm()) {
      return false;
    }

    // Set submitting state to prevent validation flicker
    setIsSubmitting(true);

    try {
      console.log('Submitting orchestra form with data:', formData);

      // Save orchestra
      const savedOrchestra = await saveOrchestra(formData);
      console.log('Orchestra saved successfully:', savedOrchestra);

      // Update students with orchestra references
      await updateStudentReferences(savedOrchestra);

      // Call onSave callback
      if (onSave) {
        onSave();
      }

      // Close the form
      onClose();

      return true;
    } catch (err) {
      console.error('Error saving orchestra:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update student references to this orchestra
  const updateStudentReferences = async (savedOrchestra: Orchestra) => {
    const orchestraId = savedOrchestra._id;
    const oldMemberIds = initialOrchestra?.memberIds || [];
    const newMemberIds = formData.memberIds;

    try {
      // Students to add orchestra to
      const studentsToAdd = newMemberIds.filter(
        (id) => !oldMemberIds.includes(id)
      );

      // Students to remove orchestra from
      const studentsToRemove = oldMemberIds.filter(
        (id) => !newMemberIds.includes(id)
      );

      console.log('Updating student references:', {
        adding: studentsToAdd.length,
        removing: studentsToRemove.length,
      });

      // Process additions
      for (const studentId of studentsToAdd) {
        const student = students.find((s) => s._id === studentId);
        if (
          student &&
          !student.enrollments.orchestraIds.includes(orchestraId)
        ) {
          await saveStudent({
            _id: student._id,
            enrollments: {
              ...student.enrollments,
              orchestraIds: [...student.enrollments.orchestraIds, orchestraId],
            },
          });
        }
      }

      // Process removals
      for (const studentId of studentsToRemove) {
        const student = students.find((s) => s._id === studentId);
        if (student) {
          await saveStudent({
            _id: student._id,
            enrollments: {
              ...student.enrollments,
              orchestraIds: student.enrollments.orchestraIds.filter(
                (id) => id !== orchestraId
              ),
            },
          });
        }
      }
    } catch (err) {
      console.error('Error updating student references:', err);
    }
  };

  return {
    formData,
    conductors,
    errors,
    isLoading,
    isSubmitting,
    isLoadingConductors,
    error,
    isOrchestra,
    handleInputChange,
    handleSubmit,
    setFormData,
    validateForm,
  };
};
