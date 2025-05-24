// src/cmps/TheoryForm.tsx
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Repeat, BookOpen, User } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import { FormField } from './FormComponents/FormField';
import { TheoryLesson, THEORY_CATEGORIES, THEORY_LOCATIONS, BulkTheoryLessonData } from '../services/theoryService';
import { Teacher } from '../services/teacherService';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { useTheoryStore } from '../store/theoryStore';
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
  onSubmit: (theoryLesson: Partial<TheoryLesson>) => Promise<void>;
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
  // Store hooks
  const { currentSchoolYear, loadCurrentSchoolYear } = useSchoolYearStore();
  
  // Form state
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [excludedDate, setExcludedDate] = useState('');

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
        setSubmitError('Failed to load school year. Please try again.');
      }
    };

    loadSchoolYear();
  }, [theoryLesson, loadCurrentSchoolYear]);

  // If not open, don't render
  if (!isOpen) return null;

  // Set form mode
  const handleSetFormMode = (mode: 'single' | 'bulk') => {
    if (theoryLesson?._id) return; // Cannot switch to bulk when editing
    setFormMode(mode);
  };

  // Handle form submission for single theory lesson
  const handleSingleSubmit = async (values: TheoryFormValues) => {
    try {
      setSubmitError(null);
      // Ensure school year ID is set
      const schoolYearId = values.schoolYearId || currentSchoolYear?._id;
      if (!schoolYearId) {
        setSubmitError('שנת הלימודים לא נטענה. אנא רענן את הדף.');
        return;
      }

      // Update the school year ID in values
      const theoryLessonData = {
        ...values,
        schoolYearId
      };

      await onSubmit(theoryLessonData);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'אירעה שגיאה בשמירת שיעור התאוריה'
      );
      throw error;
    }
  };

  // Handle form submission for bulk theory lessons
  const handleBulkSubmit = async (values: BulkTheoryFormValues) => {
    try {
      console.log('Bulk submit handler called with values:', values);
      setSubmitError(null);
      // Ensure school year ID is set
      const schoolYearId = values.schoolYearId || currentSchoolYear?._id;
      if (!schoolYearId) {
        const error = 'שנת הלימודים לא נטענה. אנא רענן את הדף.';
        console.error(error);
        setSubmitError(error);
        return;
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
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'אירעה שגיאה ביצירת שיעורי התאוריה'
      );
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

  // Handler for date changes to update dayOfWeek
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const date = new Date(e.target.value);
    const dayOfWeek = date.getDay();
    setFieldValue('date', e.target.value);
    setFieldValue('dayOfWeek', dayOfWeek);
  };

  return (
    <div className='theory-form-overlay'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal' onClick={(e) => e.stopPropagation()}>
        <button className='close-button' onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2>
          {theoryLesson?._id 
            ? 'עריכת שיעור תאוריה' 
            : 'הוספת שיעור תאוריה חדש'
          }
        </h2>

        {submitError && <div className='error-message'>{submitError}</div>}

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
            {({ setFieldValue }) => (
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
                    <FormField
                      label='תאריך'
                      name='date'
                      type='date'
                      required
                      labelIcon={<Calendar size={16} />}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleDateChange(e, setFieldValue)
                      }
                    />
                    
                    <div className='form-group'>
                      <label htmlFor='dayOfWeek'>
                        <Repeat size={16} className='icon' />
                        יום בשבוע
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

                  {/* Hidden fields */}
                  <Field type='hidden' name='schoolYearId' value={currentSchoolYear?._id || ''} />
                  <Field type='hidden' name='isActive' />
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
                setSubmitError(err instanceof Error ? err.message : 'Unknown error occurred');
              } finally {
                actions.setSubmitting(false);
              }
            }}
            enableReinitialize
          >
            {({ values, setFieldValue, handleSubmit }) => (
              <Form 
                className='theory-form'
                onSubmit={(e) => {
                  console.log('Bulk form submit event triggered');
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                {submitError && <div className='error-message'>{submitError}</div>}
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

                  {/* Hidden school year field */}
                  <Field type='hidden' name='schoolYearId' value={currentSchoolYear?._id || ''} />
                </div>

                {/* Form actions */}
                <div className='form-actions'>
                  <button 
                    type='button' 
                    className='primary' 
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log('Submit button clicked for bulk form');
                      // Direct submission as a fallback method
                      if (!currentSchoolYear?._id) {
                        console.error('No school year ID available');
                        setSubmitError('School year ID is required. Please reload the page and try again.');
                        return;
                      }
                      
                      const formData = {
                        ...values,
                        dayOfWeek: Number(values.dayOfWeek),
                        schoolYearId: currentSchoolYear._id
                      };
                      console.log('Direct submission with data:', formData);
                      onBulkSubmit(formData).catch(err => {
                        console.error('Direct submission error:', err);
                        setSubmitError(err instanceof Error ? err.message : 'Unknown error');
                      });
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