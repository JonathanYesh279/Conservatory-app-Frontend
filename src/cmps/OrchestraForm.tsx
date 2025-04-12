// src/cmps/OrchestraForm.tsx
import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, User, Search, X as XIcon } from 'lucide-react';
import { Orchestra } from '../services/orchestraService';
import { useOrchestraStore } from '../store/orchestraStore';
import { useTeacherStore } from '../store/teacherStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { useStudentStore } from '../store/studentStore';
import { Teacher } from '../services/teacherService';
import { Student } from '../services/studentService';

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
  const { students, loadStudents, saveStudent } = useStudentStore();

  const [conductors, setConductors] = useState<Teacher[]>([]);
  const [isLoadingConductors, setIsLoadingConductors] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Student search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Student[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

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

    // Load students
    loadStudents({ isActive: true });
  }, [isOpen, loadTeachers, loadStudents]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      // Load selected members
      const loadMembers = async () => {
        if (orchestra.memberIds && orchestra.memberIds.length > 0) {
          setIsLoadingStudents(true);
          try {
            // We'll use the existing students in the store and filter by IDs
            const members = students.filter((student) =>
              orchestra.memberIds.includes(student._id)
            );
            setSelectedMembers(members);
          } catch (err) {
            console.error('Failed to load orchestra members:', err);
          } finally {
            setIsLoadingStudents(false);
          }
        }
      };

      loadMembers();
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
      setSelectedMembers([]);
    }

    setErrors({});
    clearError?.();
  }, [orchestra, isOpen, clearError, currentSchoolYear, students]);

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

  // Handle student search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 0) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  };

  // Get filtered students based on search
  const getFilteredStudents = () => {
    if (!searchQuery) return [];

    return students
      .filter(
        (student) =>
          // Filter by name match
          student.personalInfo.fullName.includes(searchQuery) &&
          // Filter out already selected students
          !selectedMembers.some((member) => member._id === student._id)
      )
      .slice(0, 10); // Limit to 10 results for performance
  };

  // Add a student to the orchestra
  const handleAddMember = async (student: Student) => {
    // Add student to selected members
    setSelectedMembers([...selectedMembers, student]);

    // Add student ID to form data
    setFormData({
      ...formData,
      memberIds: [...formData.memberIds, student._id],
    });

    // Reset search
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Remove a student from the orchestra
  const handleRemoveMember = (studentId: string) => {
    // Remove from selected members
    setSelectedMembers(
      selectedMembers.filter((member) => member._id !== studentId)
    );

    // Remove from form data
    setFormData({
      ...formData,
      memberIds: formData.memberIds.filter((id) => id !== studentId),
    });
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
      const savedOrchestra = await saveOrchestra(formData);

      // Update each student with the orchestra ID
      const currentOrchestraId = orchestra?._id || savedOrchestra._id;

      // Students to add orchestra to
      const studentsToUpdate = selectedMembers
        .map((student) => {
          // Check if student already has this orchestra
          if (!student.enrollments.orchestraIds.includes(currentOrchestraId)) {
            // Only send the minimal data needed for the update
            return {
              _id: student._id, // This is needed to identify the student but will be removed before sending to backend
              enrollments: {
                ...student.enrollments,
                orchestraIds: [
                  ...student.enrollments.orchestraIds,
                  currentOrchestraId,
                ],
              },
            };
          }
          return null; // No update needed
        })
        .filter(Boolean) as Partial<Student>[];

      // Students to remove orchestra from (if editing and members were removed)
      if (orchestra?._id) {
        const removedStudentIds = orchestra.memberIds.filter(
          (id) => !formData.memberIds.includes(id)
        );

        if (removedStudentIds.length > 0) {
          const studentsToRemoveFrom = students.filter((student) =>
            removedStudentIds.includes(student._id)
          );

          for (const student of studentsToRemoveFrom) {
            await saveStudent({
              _id: student._id, // This is needed to identify the student but will be removed before sending to backend
              enrollments: {
                ...student.enrollments,
                orchestraIds: student.enrollments.orchestraIds.filter(
                  (id) => id !== orchestra._id
                ),
              },
            });
          }
        }
      }

      // Save updated students
      try {
        await Promise.all(
          studentsToUpdate.map((student) =>
            student._id ? saveStudent(student) : null
          )
        );
      } catch (err) {
        console.error('Error updating students:', err);
        // Continue with form submission even if student updates fail
      }

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

  const filteredStudents = getFilteredStudents();

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

            {/* Members */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label>תלמידים (חברי התזמורת)</label>

                {/* Student search input */}
                <div ref={searchRef} className='search-container'>
                  <div className='search-input-wrapper'>
                    <Search className='search-icon' size={16} />
                    <input
                      type='text'
                      value={searchQuery}
                      onChange={handleSearchChange}
                      placeholder='חפש תלמידים להוספה...'
                      className='search-input'
                      onClick={() => setIsSearchOpen(searchQuery.length > 0)}
                    />
                  </div>

                  {/* Search results dropdown */}
                  {isSearchOpen && filteredStudents.length > 0 && (
                    <div className='search-results-dropdown'>
                      {filteredStudents.map((student) => (
                        <div
                          key={student._id}
                          className='search-result-item'
                          onClick={() => handleAddMember(student)}
                        >
                          <User size={16} className='student-icon' />
                          <span>{student.personalInfo.fullName}</span>
                          <span className='student-instrument'>
                            {student.academicInfo.instrument}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected members list */}
                <div className='selected-members-list'>
                  {isLoadingStudents ? (
                    <div className='loading-text'>טוען תלמידים...</div>
                  ) : selectedMembers.length > 0 ? (
                    selectedMembers.map((member) => (
                      <div key={member._id} className='member-badge'>
                        <span>{member.personalInfo.fullName}</span>
                        <button
                          type='button'
                          className='remove-btn'
                          onClick={() => handleRemoveMember(member._id)}
                          aria-label={`הסר את ${member.personalInfo.fullName}`}
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className='no-members-message'>
                      לא נבחרו תלמידים. השתמש בחיפוש כדי להוסיף תלמידים לתזמורת.
                    </div>
                  )}
                </div>
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
