// src/cmps/OrchestraForm.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, User, Search, X as XIcon } from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
<<<<<<< Updated upstream
import { ModalPortal } from './ModalPortal';
=======
>>>>>>> Stashed changes
import { Formik, Form, FormikHelpers } from 'formik';
import { Orchestra } from '../services/orchestraService';
import { Student } from '../services/studentService';
import { Teacher } from '../services/teacherService';
import { useOrchestraStore } from '../store/orchestraStore';
import { useTeacherStore } from '../store/teacherStore';
import { useStudentStore } from '../store/studentStore';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { FormField } from './FormComponents/FormField';
import {
  OrchestraFormData,
  initialOrchestraFormValues,
  createOrchestraValidationSchema,
} from '../validations/orchestraValidation';

import {
  VALID_TYPES,
  VALID_LOCATIONS
} from '../validations/constants';

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
  // Accessibility hook
  const { modalProps, titleProps, descriptionProps } = useModalAccessibility({
    isOpen,
    onClose,
    modalId: 'orchestra-form',
    restoreFocusOnClose: true
  });

  // State
  const [conductors, setConductors] = useState<Teacher[]>([]);
  const [isLoadingConductors, setIsLoadingConductors] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Store access
  const { orchestras, saveOrchestra, isLoading } = useOrchestraStore();
  const { currentSchoolYear } = useSchoolYearStore();
  const { students, saveStudent, loadStudents } = useStudentStore();
  const { loadTeacherByRole, loadTeachers } = useTeacherStore();

  // Get all existing orchestra names for validation
  const existingOrchestraNames = orchestras.map((o) => o.name);

  // Initialize form values
  const getInitialFormValues = useCallback((): OrchestraFormData => {
    if (orchestra?._id) {
      return {
        _id: orchestra._id,
        name: orchestra.name || '',
        type: orchestra.type || 'תזמורת',
        conductorId: orchestra.conductorId || '',
        memberIds: orchestra.memberIds || [],
        rehearsalIds: orchestra.rehearsalIds || [],
        schoolYearId: orchestra.schoolYearId || currentSchoolYear?._id || '',
        location: orchestra.location || 'חדר 1',
        isActive: orchestra.isActive !== false,
      };
    } else {
      return {
        ...initialOrchestraFormValues,
        schoolYearId: currentSchoolYear?._id || '',
      };
    }
  }, [orchestra, currentSchoolYear]);

  // Load students if needed
  useEffect(() => {
    if (students.length === 0) {
      loadStudents({ isActive: true });
    }
  }, [students.length, loadStudents]);

  // Initialize selected members
  useEffect(() => {
    if (students.length > 0 && orchestra?.memberIds && orchestra.memberIds.length > 0) {
      setIsLoadingStudents(true);
      // Find matching students
      const members = students.filter((student) =>
        orchestra?.memberIds?.includes(student._id)
      );
      setSelectedMembers(members);
      setIsLoadingStudents(false);
    } else {
      setSelectedMembers([]);
    }
  }, [orchestra?.memberIds, students]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load appropriate teachers based on type
  const loadAppropriateTeachers = useCallback(async (type: string) => {
    setIsLoadingConductors(true);
    setConductors([]); // Clear previous conductors while loading

    try {
      const role = type === 'תזמורת' ? 'מנצח' : 'מדריך הרכב';
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
      // Fallback to filtering teachers manually
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
  }, [loadTeacherByRole, loadTeachers]);

  // Search handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      setIsSearchOpen(e.target.value.length > 0);
    },
    []
  );

  // Get filtered students
  const getFilteredStudents = useCallback(() => {
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
  }, [searchQuery, students, selectedMembers]);

  // Add/remove members
  const handleAddMember = useCallback(
    (student: Student, setFieldValue: (field: string, value: any) => void) => {
      // First create the updated members array
      const updatedMembers = [...selectedMembers, student];
      
      // Then update the state
      setSelectedMembers(updatedMembers);
      
      // Then update form values separately
      setFieldValue(
        'memberIds', 
        updatedMembers.map((member) => member._id)
      );

      setSearchQuery('');
      setIsSearchOpen(false);
    },
    [selectedMembers]
  );

  const handleRemoveMember = useCallback(
    (studentId: string, setFieldValue: (field: string, value: any) => void) => {
      setSelectedMembers((prev) => {
        const updatedMembers = prev.filter(
          (member) => member._id !== studentId
        );
        
        // Update form values
        setFieldValue(
          'memberIds', 
          updatedMembers.map((member) => member._id)
        );
        
        return updatedMembers;
      });
    },
    []
  );

  // Update student references to this orchestra
  const updateStudentReferences = async (
    orchestraId: string,
    oldMemberIds: string[],
    newMemberIds: string[]
  ) => {
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

  // Handle form submission
  const handleSubmit = async (
    values: OrchestraFormData,
    { setSubmitting }: FormikHelpers<OrchestraFormData>
  ) => {
    setApiError(null);
    
    try {
      console.log('Submitting orchestra form with data:', values);

      // Save orchestra
      const savedOrchestra = await saveOrchestra(values);
      console.log('Orchestra saved successfully:', savedOrchestra);

      // Update students with orchestra references
      await updateStudentReferences(
        savedOrchestra._id,
        orchestra?.memberIds || [],
        values.memberIds
      );

      // Call onSave callback
      if (onSave) {
        onSave();
      }

      // Close the form
      onClose();
    } catch (err) {
      console.error('Error saving orchestra:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'שגיאה לא ידועה בשמירת התזמורת/הרכב';
      setApiError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
<<<<<<< Updated upstream
    <ModalPortal isOpen={isOpen} onClose={onClose} className="orchestra-form responsive-form">
      <div className='form-modal' {...modalProps}>
=======
    <div className='orchestra-form responsive-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal' {...modalProps}>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

>>>>>>> Stashed changes
        {/* Hidden description for screen readers */}
        <div {...descriptionProps} className="sr-only">
          {orchestra?._id ? 'טופס עריכת פרטי הרכב קיים במערכת' : 'טופס הוספת הרכב חדש למערכת'}
        </div>

        <Formik
          initialValues={getInitialFormValues()}
          validationSchema={createOrchestraValidationSchema(
            existingOrchestraNames,
            orchestra?.name
          )}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => {
            const isOrchestra = values.type === 'תזמורת';
            
            // Load appropriate teachers when type changes
            useEffect(() => {
              loadAppropriateTeachers(values.type);
            }, [values.type]);

            const filteredStudents = getFilteredStudents();

            return (
              <Form>
<<<<<<< Updated upstream
                {/* Form Header with Close Button */}
                <div className='form-header'>
                  <button
                    className='btn-icon close-btn'
                    onClick={onClose}
                    aria-label='סגור'
                    type='button'
                  >
                    <X size={20} />
                  </button>
                  <h2 {...titleProps}>
                    {orchestra?._id
                      ? isOrchestra
                        ? 'עריכת תזמורת'
                        : 'עריכת הרכב'
                      : isOrchestra
                      ? 'הוספת תזמורת חדשה'
                      : 'הוספת הרכב חדש'}
                  </h2>
                </div>
=======
                <h2 {...titleProps}>
                  {orchestra?._id
                    ? isOrchestra
                      ? 'עריכת תזמורת'
                      : 'עריכת הרכב'
                    : isOrchestra
                    ? 'הוספת תזמורת חדשה'
                    : 'הוספת הרכב חדש'}
                </h2>
>>>>>>> Stashed changes

                {apiError && <div className='error-message'>{apiError}</div>}

                {/* Orchestra/Ensemble Information */}
                <div className='form-section'>
                  <h3>{isOrchestra ? 'פרטי תזמורת' : 'פרטי הרכב'}</h3>

                  {/* Type and Name - side by side with responsive columns */}
                  <div className="form-row narrow-fields">
                    {/* Type Selection */}
                    <FormField
                      label="סוג"
                      name="type"
                      as="select"
                      required
                      disabled={isSubmitting}
                    >
                      <option value=''>בחר סוג</option>
                      {VALID_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </FormField>

                    {/* Name field */}
                    <FormField
                      label={isOrchestra ? 'שם התזמורת' : 'שם ההרכב'}
                      name="name"
                      type="text"
                      required
                      placeholder={
                        isOrchestra ? 'הכנס שם תזמורת...' : 'הכנס שם הרכב...'
                      }
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Location and Conductor - side by side */}
                  <div className="form-row narrow-fields">
                    {/* Location */}
                    <FormField
                      label="מקום"
                      name="location"
                      as="select"
                      required
                      disabled={isSubmitting}
                    >
                      <option value=''>בחר מקום</option>
                      {VALID_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </FormField>

                    {/* Conductor/Instructor - changes based on type */}
                    <div className='form-group'>
                      <label 
                        htmlFor='conductorId'
                        className={errors.conductorId && touched.conductorId ? 'required-field is-invalid' : 'required-field'}
                      >
                        {isOrchestra ? 'מנצח' : 'מדריך הרכב'}
                      </label>
                      <select
                        id='conductorId'
                        name='conductorId'
                        value={values.conductorId}
                        onChange={(e) => {
                          setFieldValue('conductorId', e.target.value);
                        }}
                        className={errors.conductorId && touched.conductorId ? 'is-invalid' : ''}
                        required
                        disabled={isLoadingConductors || isSubmitting}
                      >
                        <option value=''>
                          {isOrchestra ? 'בחר מנצח' : 'בחר מדריך הרכב'}
                        </option>
                        {conductors.map((conductor) => (
                          <option key={conductor._id} value={conductor._id}>
                            {conductor.personalInfo.fullName}
                          </option>
                        ))}
                      </select>
                      {isLoadingConductors && (
                        <div className='loading-text'>
                          {isOrchestra ? 'טוען מנצחים...' : 'טוען מדריכים...'}
                        </div>
                      )}
                      {errors.conductorId && touched.conductorId && (
                        <div className='form-error'>{errors.conductorId}</div>
                      )}
                    </div>
                  </div>

                  {/* Members Section */}
                  <div className="form-row full-width">
                    <div className='form-group'>
                      <label>
                        {isOrchestra
                          ? 'תלמידים (חברי התזמורת)'
                          : 'תלמידים (חברי ההרכב)'}
                      </label>

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
                            onClick={() => searchQuery.length > 0}
                            disabled={isSubmitting}
                          />
                        </div>

                        {/* Search results dropdown */}
                        {isSearchOpen &&
                          filteredStudents.length > 0 &&
                          !isSubmitting && (
                            <div className='search-results-dropdown'>
                              {filteredStudents.map((student) => (
                                <div
                                  key={student._id}
                                  className='search-result-item'
                                  onClick={() => handleAddMember(student, setFieldValue)}
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
                              <div className='member-info'>
                                <div className='member-avatar'>
                                  {member.personalInfo.fullName.charAt(0)}
                                </div>
                                <div className='member-details'>
                                  <div className='member-name'>{member.personalInfo.fullName}</div>
                                  {member.academicInfo?.instrumentProgress?.[0]?.instrumentName && (
                                    <div className='member-instrument'>
                                      {member.academicInfo.instrumentProgress[0].instrumentName}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type='button'
                                className='remove-btn'
                                onClick={() => handleRemoveMember(member._id, setFieldValue)}
                                aria-label={`הסר את ${member.personalInfo.fullName}`}
                                disabled={isSubmitting}
                              >
                                <XIcon size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className='no-members-message'>
                            לא נבחרו תלמידים. השתמש בחיפוש כדי להוסיף תלמידים{' '}
                            {isOrchestra ? 'לתזמורת' : 'להרכב'}.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hidden school year field */}
                  <input
                    type='hidden'
                    name='schoolYearId'
                    value={values.schoolYearId}
                  />
                </div>

                {/* Form Actions */}
                <div className='form-actions'>
                  <button
                    type='submit'
                    className='btn primary'
                    disabled={isLoading || isSubmitting}
                  >
                    {isSubmitting
                      ? 'שומר...'
                      : isLoading
                      ? 'טוען...'
                      : orchestra?._id
                      ? 'עדכון'
                      : 'הוספה'}
                  </button>

                  <button
                    type='button'
                    className='btn secondary'
                    onClick={onClose}
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
<<<<<<< Updated upstream
    </ModalPortal>
=======
    </div>
>>>>>>> Stashed changes
  );
}