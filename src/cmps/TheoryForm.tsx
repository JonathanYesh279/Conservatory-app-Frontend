// src/cmps/TheoryForm.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Calendar, Clock, MapPin, Repeat, BookOpen, User, Search, X as XIcon } from 'lucide-react';
import { useModalAccessibility } from '../hooks/useModalAccessibility';
import { Formik, Form, Field } from 'formik';
import { FormField } from './FormComponents/FormField';
import { TheoryLesson, THEORY_CATEGORIES, THEORY_LOCATIONS, BulkTheoryLessonData } from '../services/theoryService';
import { Teacher } from '../services/teacherService';
import { Student } from '../services/studentService';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { useStudentStore } from '../store/studentStore';
// Removed Toast import - error handling is now done by parent component
import { 
  TheoryLessonValidationSchema, 
  TheoryBulkValidationSchema,
  getInitialTheoryLessonValues,
  getInitialBulkTheoryLessonValues,
  TheoryFormValues,
  BulkTheoryFormValues
} from '../validations/theoryValidation';
import { DAY_OF_WEEK_OPTIONS, getDayName } from '../validations/constants';

interface TheoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (theoryLesson: Partial<TheoryLesson>) => Promise<Partial<TheoryLesson>>;
  onBulkSubmit: (data: BulkTheoryLessonData) => Promise<any>;
  theoryLesson?: Partial<TheoryLesson>;
  theoryTeachers: Teacher[];
  isLoading?: boolean;
}

export function TheoryForm({
  isOpen,
  onClose,
  onSubmit,
  onBulkSubmit,
  theoryLesson,
  theoryTeachers,
  isLoading = false,
}: TheoryFormProps) {
  // Accessibility hook
  const { modalProps, titleProps, descriptionProps } = useModalAccessibility({
    isOpen,
    onClose,
    modalId: 'theory-form',
    restoreFocusOnClose: true
  });

  // Store hooks
  const { currentSchoolYear, loadCurrentSchoolYear } = useSchoolYearStore();
  const { students, saveStudent, loadStudents } = useStudentStore();
  // Error handling is now done by parent component via onSubmit/onBulkSubmit
  
  // Form state
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
  const [excludedDate, setExcludedDate] = useState('');
  
  // Student selection state
  const [selectedMembers, setSelectedMembers] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // All callback functions must be defined before useEffect
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearchOpen(e.target.value.length > 0);
  }, []);

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

  const handleAddMember = useCallback(
    (student: Student, setFieldValue: (field: string, value: any) => void) => {
      // First create the updated members array
      const updatedMembers = [...selectedMembers, student];
      
      // Then update the state
      setSelectedMembers(updatedMembers);
      
      // Then update form values separately
      setFieldValue(
        'studentIds', 
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
          'studentIds', 
          updatedMembers.map((member) => member._id)
        );
        
        return updatedMembers;
      });
    },
    []
  );

  // Load school year and set form mode
  useEffect(() => {
    if (theoryLesson?._id) {
      setFormMode('single');
    }

    // Ensure school year is loaded
    const loadSchoolYear = async () => {
      try {
        console.log('Loading current school year...');
        const schoolYear = await loadCurrentSchoolYear();
        console.log('Loaded school year:', schoolYear);
      } catch (error) {
        console.error('Failed to load school year:', error);
        // Error will be handled by parent component
      }
    };

    loadSchoolYear();
  }, [theoryLesson, loadCurrentSchoolYear]);
  
  // Load students if needed
  useEffect(() => {
    if (students.length === 0) {
      loadStudents();
    }
  }, [students.length, loadStudents]);
  
  // Initialize selected members
  useEffect(() => {
    if (students.length > 0 && theoryLesson?.studentIds && theoryLesson.studentIds.length > 0) {
      setIsLoadingStudents(true);
      // Find matching students
      const members = students.filter((student) =>
        theoryLesson?.studentIds?.includes(student._id)
      );
      setSelectedMembers(members);
      setIsLoadingStudents(false);
    } else {
      setSelectedMembers([]);
    }
  }, [theoryLesson?.studentIds, students]);

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

  // If not open, don't render
  if (!isOpen) return null;

  // Set form mode
  const handleSetFormMode = (mode: 'single' | 'bulk') => {
    if (theoryLesson?._id) return; // Cannot switch to bulk when editing
    setFormMode(mode);
  };

  // Update student references to this theory lesson
  const updateStudentReferences = async (
    theoryLessonId: string,
    oldMemberIds: string[],
    newMemberIds: string[]
  ) => {
    try {
      // Students to add theory lesson to
      const studentsToAdd = newMemberIds.filter(
        (id) => !oldMemberIds.includes(id)
      );

      // Students to remove theory lesson from
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
          (!student.enrollments.theoryLessonIds || !student.enrollments.theoryLessonIds.includes(theoryLessonId))
        ) {
          await saveStudent({
            _id: student._id,
            enrollments: {
              ...student.enrollments,
              theoryLessonIds: [...(student.enrollments.theoryLessonIds || []), theoryLessonId],
            },
          });
        }
      }

      // Process removals
      for (const studentId of studentsToRemove) {
        const student = students.find((s) => s._id === studentId);
        if (student && student.enrollments.theoryLessonIds) {
          await saveStudent({
            _id: student._id,
            enrollments: {
              ...student.enrollments,
              theoryLessonIds: student.enrollments.theoryLessonIds.filter(
                (id) => id !== theoryLessonId
              ),
            },
          });
        }
      }
    } catch (err) {
      console.error('Error updating student references:', err);
    }
  };

  // Handle form submission for single theory lesson
  const handleSingleSubmit = async (values: TheoryFormValues) => {
    try {
      // Ensure school year ID is set
      const schoolYearId = values.schoolYearId || currentSchoolYear?._id;
      if (!schoolYearId) {
        throw new Error('שנת הלימודים לא נטענה. אנא רענן את הדף.');
      }

      // Update the school year ID in values
      const theoryLessonData = {
        ...values,
        schoolYearId
      };

      const savedTheoryLesson = await onSubmit(theoryLessonData);
      
      // Update student references if the theory lesson was saved successfully
      if (savedTheoryLesson?._id) {
        await updateStudentReferences(
          savedTheoryLesson._id,
          theoryLesson?.studentIds || [],
          values.studentIds
        );
      }
    } catch (error) {
      // Error handling is now done by the parent component via Toast
      throw error;
    }
  };

  // Handle form submission for bulk theory lessons
  const handleBulkSubmit = async (values: BulkTheoryFormValues) => {
    try {
      console.log('Bulk submit handler called with values:', values);
      // Ensure school year ID is set
      const schoolYearId = values.schoolYearId || currentSchoolYear?._id;
      if (!schoolYearId) {
        throw new Error('שנת הלימודים לא נטענה. אנא רענן את הדף.');
      }

      // Prepare data for bulk creation
      const bulkData = {
        ...values,
        dayOfWeek: Number(values.dayOfWeek),
        schoolYearId
      };
      
      console.log('Calling onBulkSubmit with data:', bulkData);
      await onBulkSubmit(bulkData);
      console.log('Bulk creation completed successfully');
    } catch (error) {
      console.error('Error in handleBulkSubmit:', error);
      // Error handling is now done by the parent component via Toast
      throw error;
    }
  };

  // Add excluded date in bulk mode
  const addExcludedDate = (
    date: string,
    values: BulkTheoryFormValues,
    setFieldValue: (field: string, value: any) => void
  ) => {
    if (!date) return;

    if (values.excludeDates && !values.excludeDates.includes(date)) {
      const updatedExcludeDates = [...(values.excludeDates || []), date];
      setFieldValue('excludeDates', updatedExcludeDates);
      setExcludedDate('');
    }
  };

  // Remove excluded date in bulk mode
  const removeExcludedDate = (
    dateToRemove: string,
    values: BulkTheoryFormValues,
    setFieldValue: (field: string, value: any) => void
  ) => {
    if (!values.excludeDates) return;
    
    const updatedExcludeDates = values.excludeDates.filter(
      (date) => date !== dateToRemove
    );
    setFieldValue('excludeDates', updatedExcludeDates);
  };

  return (
    <div className='theory-form-overlay'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal' {...modalProps} onClick={(e) => e.stopPropagation()}>
        <button className='close-button' onClick={onClose}>
          <X size={20} />
        </button>
        
        {/* Hidden description for screen readers */}
        <div {...descriptionProps} className="sr-only">
          {theoryLesson?._id ? 'טופס עריכת שיעור תאוריה קיים במערכת' : 'טופס הוספת שיעור תאוריה חדש למערכת'}
        </div>
        
        <h2 {...titleProps}>
          {theoryLesson?._id 
            ? 'עריכת שיעור תאוריה' 
            : 'הוספת שיעור תאוריה חדש'
          }
        </h2>

        {/* Error messages are now handled via Toast notifications */}

        {/* Mode Toggle */}
        {!theoryLesson?._id && (
          <div className='mode-toggle'>
            <button
              type='button'
              className={formMode === 'single' ? 'active' : ''}
              onClick={() => handleSetFormMode('single')}
            >
              שיעור בודד
            </button>
            <button
              type='button'
              className={formMode === 'bulk' ? 'active' : ''}
              onClick={() => handleSetFormMode('bulk')}
            >
              סדרת שיעורים
            </button>
          </div>
        )}

        {formMode === 'single' ? (
          // Single Theory Lesson Form
          <Formik
            initialValues={getInitialTheoryLessonValues(
              theoryLesson || null, 
              currentSchoolYear?._id || ''
            )}
            validationSchema={TheoryLessonValidationSchema}
            onSubmit={handleSingleSubmit}
            enableReinitialize
          >
            {({ setFieldValue, isSubmitting }) => (
              <Form className='theory-form'>
                {/* Theory Information */}
                <div className='form-section'>
                  <h3>פרטי שיעור תאוריה</h3>
                  
                  <div className='form-row'>
                    <FormField
                      label='קטגוריה'
                      name='category'
                      as='select'
                      required
                      labelIcon={<BookOpen size={16} />}
                    >
                      {THEORY_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </FormField>
                    
                    <FormField
                      label='מורה תאוריה'
                      name='teacherId'
                      as='select'
                      required
                      labelIcon={<User size={16} />}
                    >
                      <option value=''>בחר מדריך...</option>
                      {theoryTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.personalInfo.fullName}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  {/* Date and Time */}
                  <div className='form-row'>
                    <div className='form-group'>
                      <label htmlFor='date'>
                        <Calendar size={16} />
                        תאריך *
                      </label>
                      <Field
                        name='date'
                        type='date'
                        required
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const selectedDate = e.target.value;
                          if (selectedDate) {
                            // Calculate day of week (0 = Sunday, 1 = Monday, etc.)
                            const date = new Date(selectedDate);
                            const dayOfWeek = date.getDay();
                            // Update the dayOfWeek field automatically
                            setFieldValue('dayOfWeek', dayOfWeek);
                          }
                          // Also update the date field
                          setFieldValue('date', selectedDate);
                        }}
                      />
                    </div>
                    
                    <div className='form-group'>
                      <label htmlFor='dayOfWeek'>
                        <Repeat size={16} className='icon' />
                        יום בשבוע (מחושב אוטומטית)
                      </label>
                      <Field as='select' name='dayOfWeek' id='dayOfWeek' disabled>
                        {DAY_OF_WEEK_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>
                  
                  <div className='form-row'>
                    <FormField
                      label='שעת התחלה'
                      name='startTime'
                      type='time'
                      required
                      labelIcon={<Clock size={16} />}
                    />
                    
                    <FormField
                      label='שעת סיום'
                      name='endTime'
                      type='time'
                      required
                      labelIcon={<Clock size={16} />}
                    />
                  </div>

                  {/* Location */}
                  <div className='form-row full-width'>
                    <FormField
                      label='מיקום'
                      name='location'
                      as='select'
                      required
                      labelIcon={<MapPin size={16} />}
                    >
                      {THEORY_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  {/* Notes and additional info */}
                  <div className='form-row full-width'>
                    <FormField
                      label='הערות'
                      name='notes'
                      as='textarea'
                      rows={3}
                    />
                  </div>
                  
                  <div className='form-row full-width'>
                    <FormField
                      label='סילבוס'
                      name='syllabus'
                      as='textarea'
                      rows={3}
                    />
                  </div>
                  
                  <div className='form-row full-width'>
                    <FormField
                      label='שיעורי בית'
                      name='homework'
                      as='textarea'
                      rows={3}
                    />
                  </div>
                  
                  {/* Members Selection */}
                  <div className='form-row full-width'>
                    <div className='form-group'>
                      <label>תלמידים (משתתפי השיעור)</label>

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
                          getFilteredStudents().length > 0 &&
                          !isSubmitting && (
                            <div className='search-results-dropdown'>
                              {getFilteredStudents().map((student) => (
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
                          <ul className='members-items'>
                            {selectedMembers.map((member) => (
                              <li key={member._id} className='member-item'>
                                <div className='member-info'>
                                  <div className='member-avatar'>
                                    {member.personalInfo.fullName.charAt(0)}
                                  </div>
                                  <div className='member-details'>
                                    <div className='member-name'>
                                      {member.personalInfo.fullName}
                                    </div>
                                    <div className='member-instrument'>
                                      {member.academicInfo.instrument}
                                    </div>
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
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className='no-members-message'>
                            לא נבחרו תלמידים. השתמש בחיפוש כדי להוסיף תלמידים לשיעור.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hidden fields */}
                  <Field type='hidden' name='schoolYearId' value={currentSchoolYear?._id || ''} />
                  <Field type='hidden' name='studentIds' />
                </div>

                {/* Form actions */}
                <div className='form-actions'>
                  <button type='submit' className='primary' disabled={isLoading}>
                    {isLoading 
                      ? 'שומר...' 
                      : theoryLesson?._id 
                        ? 'עדכון' 
                        : 'הוספה'}
                  </button>
                  <button type='button' className='secondary' onClick={onClose}>
                    ביטול
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          // Bulk Theory Lesson Form
          <Formik
            initialValues={{
              ...getInitialBulkTheoryLessonValues(currentSchoolYear?._id || ''),
              excludeDates: [] // Ensure excludeDates is properly initialized
            }}
            validationSchema={TheoryBulkValidationSchema}
            onSubmit={async (values, actions) => {
              console.log('Formik onSubmit called with values:', values);
              try {
                // Validate required fields directly
                if (!values.category) {
                  throw new Error('Category is required');
                }
                if (!values.teacherId) {
                  throw new Error('Teacher is required');
                }
                if (!values.startDate || !values.endDate) {
                  throw new Error('Start and end dates are required');
                }
                if (values.dayOfWeek === undefined || values.dayOfWeek === null) {
                  throw new Error('Day of week is required');
                }
                if (!values.startTime || !values.endTime) {
                  throw new Error('Start and end times are required');
                }
                if (!values.location) {
                  throw new Error('Location is required');
                }
                
                // Process the form data
                await handleBulkSubmit(values);
                console.log('Bulk submit succeeded');
                
                // Clear form and close modal on success
                actions.resetForm();
                onClose();
              } catch (err) {
                console.error('Bulk submit failed:', err);
                // Error will be handled by parent component
              } finally {
                actions.setSubmitting(false);
              }
            }}
            enableReinitialize
          >
            {({ values, setFieldValue, handleSubmit, isSubmitting }) => (
              <Form 
                className='theory-form'
                onSubmit={(e) => {
                  console.log('Bulk form submit event triggered');
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                {/* Error messages are now handled via Toast notifications */}
                {/* Theory Information */}
                <div className='form-section'>
                  <h3>פרטי שיעור תאוריה</h3>
                  
                  <div className='form-row'>
                    <FormField
                      label='קטגוריה'
                      name='category'
                      as='select'
                      required
                      labelIcon={<BookOpen size={16} />}
                    >
                      {THEORY_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </FormField>
                    
                    <FormField
                      label='מורה תאוריה'
                      name='teacherId'
                      as='select'
                      required
                      labelIcon={<User size={16} />}
                    >
                      <option value=''>בחר מדריך...</option>
                      {theoryTeachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.personalInfo.fullName}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  {/* Date Range */}
                  <div className='form-row'>
                    <FormField
                      label='תאריך התחלה'
                      name='startDate'
                      type='date'
                      required
                      labelIcon={<Calendar size={16} />}
                    />
                    <FormField
                      label='תאריך סיום'
                      name='endDate'
                      type='date'
                      required
                      labelIcon={<Calendar size={16} />}
                    />
                  </div>

                  {/* Day of Week */}
                  <div className='form-row full-width'>
                    <FormField
                      label='יום בשבוע'
                      name='dayOfWeek'
                      as='select'
                      required
                      labelIcon={<Repeat size={16} />}
                    >
                      {DAY_OF_WEEK_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </FormField>
                    <div className='help-text' style={{ marginTop: '-15px', paddingRight: '16px' }}>
                      שיעורים ייווצרו בכל יום {getDayName(Number(values.dayOfWeek))}{' '}
                      בטווח התאריכים שנבחר
                    </div>
                  </div>

                  {/* Excluded Dates */}
                  <div className='form-row full-width'>
                    <div className='form-group'>
                      <label>
                        <Calendar size={16} className='icon' />
                        תאריכים לדילוג
                      </label>

                      <div className='exclude-dates-input'>
                        <input
                          type='date'
                          value={excludedDate}
                          onChange={(e) => setExcludedDate(e.target.value)}
                          min={values.startDate}
                          max={values.endDate}
                        />
                        <button
                          type='button'
                          onClick={() => addExcludedDate(excludedDate, values, setFieldValue)}
                          className='add-date'
                          disabled={!excludedDate}
                        >
                          הוסף
                        </button>
                      </div>

                      <div className='exclude-dates-list'>
                        {values.excludeDates && values.excludeDates.length > 0 ? (
                          values.excludeDates.map((date) => (
                            <div key={date} className='exclude-date-item'>
                              <span>{new Date(date).toLocaleDateString('he-IL')}</span>
                              <button
                                type='button'
                                className='remove-date'
                                onClick={() => removeExcludedDate(date, values, setFieldValue)}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className='no-dates'>אין תאריכים להוציא</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className='form-row'>
                    <FormField
                      label='שעת התחלה'
                      name='startTime'
                      type='time'
                      required
                      labelIcon={<Clock size={16} />}
                    />
                    
                    <FormField
                      label='שעת סיום'
                      name='endTime'
                      type='time'
                      required
                      labelIcon={<Clock size={16} />}
                    />
                  </div>

                  {/* Location */}
                  <div className='form-row full-width'>
                    <FormField
                      label='מיקום'
                      name='location'
                      as='select'
                      required
                      labelIcon={<MapPin size={16} />}
                    >
                      {THEORY_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  {/* Notes and Syllabus */}
                  <div className='form-row full-width'>
                    <FormField
                      label='הערות'
                      name='notes'
                      as='textarea'
                      rows={3}
                    />
                  </div>
                  
                  <div className='form-row full-width'>
                    <FormField
                      label='סילבוס'
                      name='syllabus'
                      as='textarea'
                      rows={3}
                    />
                  </div>
                  
                  {/* Members Selection */}
                  <div className='form-row full-width'>
                    <div className='form-group'>
                      <label>תלמידים (משתתפי השיעור)</label>

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
                          getFilteredStudents().length > 0 &&
                          !isSubmitting && (
                            <div className='search-results-dropdown'>
                              {getFilteredStudents().map((student) => (
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
                          <ul className='members-items'>
                            {selectedMembers.map((member) => (
                              <li key={member._id} className='member-item'>
                                <div className='member-info'>
                                  <div className='member-avatar'>
                                    {member.personalInfo.fullName.charAt(0)}
                                  </div>
                                  <div className='member-details'>
                                    <div className='member-name'>
                                      {member.personalInfo.fullName}
                                    </div>
                                    <div className='member-instrument'>
                                      {member.academicInfo.instrument}
                                    </div>
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
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className='no-members-message'>
                            לא נבחרו תלמידים. השתמש בחיפוש כדי להוסיף תלמידים לשיעור.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hidden school year field */}
                  <Field type='hidden' name='schoolYearId' value={currentSchoolYear?._id || ''} />
                  <Field type='hidden' name='studentIds' />
                </div>

                {/* Form actions */}
                <div className='form-actions'>
                  <button 
                    type='button' 
                    className='primary' 
                    disabled={isLoading}
                    onClick={async () => {
                      console.log('Submit button clicked for bulk form');
                      // Direct submission as a fallback method
                      if (!currentSchoolYear?._id) {
                        console.error('No school year ID available');
                        throw new Error('שנת הלימודים לא נטענה. אנא רענן את הדף.');
                        return;
                      }
                      
                      const formData = {
                        ...values,
                        dayOfWeek: Number(values.dayOfWeek),
                        schoolYearId: currentSchoolYear._id,
                        studentIds: selectedMembers.map(member => member._id)
                      };
                      console.log('Direct submission with data:', formData);
                      try {
                        const result = await onBulkSubmit(formData);
                        
                        // If lessons were created successfully and have IDs
                        if (result && Array.isArray(result) && result.length > 0) {
                          // Update student references for each created lesson
                          for (const lesson of result) {
                            if (lesson._id) {
                              await updateStudentReferences(
                                lesson._id,
                                [],  // No previous members for new lessons
                                formData.studentIds
                              );
                            }
                          }
                        }
                      } catch (err) {
                        console.error('Direct submission error:', err);
                        // Error will be handled by parent component
                        throw err;
                      }
                    }}
                  >
                    {isLoading ? 'יוצר...' : 'יצירת סדרת שיעורים'}
                  </button>
                  <button type='button' className='secondary' onClick={onClose}>
                    ביטול
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
}