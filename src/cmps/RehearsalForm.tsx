// src/cmps/RehearsalForm.tsx
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Repeat, Music } from 'lucide-react';
import { Formik, Form, Field } from 'formik';
import { FormField } from './FormComponents/FormField';
import { Rehearsal } from '../services/rehearsalService';
import { useRehearsalStore } from '../store/rehearsalStore';
import { useOrchestraStore } from '../store/orchestraStore';
import { useSchoolYearStore } from '../store/schoolYearStore';

import {
  RehearsalValidationSchema,
  BulkRehearsalValidationSchema,
  getInitialRehearsalValues,
  getInitialBulkRehearsalValues,
  RehearsalFormValues,
  BulkRehearsalFormValues
} from '../validations/rehearsalValidation';

import {
  DAY_OF_WEEK_OPTIONS,
  getDayName,
  VALID_LOCATIONS
} from '../validations/constants';

interface RehearsalFormProps {
  isOpen: boolean;
  onClose: () => void;
  rehearsal: Rehearsal | null;
  orchestraId: string;
  onSave?: () => void;
}

export function RehearsalForm({
  isOpen,
  onClose,
  rehearsal,
  orchestraId,
  onSave,
}: RehearsalFormProps) {
  // Store hooks
  const rehearsalStore = useRehearsalStore();
  const orchestraStore = useOrchestraStore();
  const schoolYearStore = useSchoolYearStore();

  // Destructure values from stores
  const { saveRehearsal, bulkCreateRehearsals, isLoading, error, clearError } =
    rehearsalStore;
  const { orchestras, loadOrchestras } = orchestraStore;
  const { currentSchoolYear, loadCurrentSchoolYear } = schoolYearStore;

  // Form mode state
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single');
  
  // For excluded date input in bulk mode
  const [excludedDate, setExcludedDate] = useState('');

  // Error handling
  const [formError, setFormError] = useState('');

  // Load data on mount
  useEffect(() => {
    const initializeFormData = async () => {
      // Load current school year if not already loaded
      if (!currentSchoolYear) {
        try {
          await loadCurrentSchoolYear();
        } catch (err) {
          console.error('Failed to load current school year:', err);
          setFormError('Failed to load current school year. Please try again.');
        }
      }

      // Load orchestras if not already loaded
      if (orchestras.length === 0) {
        try {
          await loadOrchestras();
        } catch (err) {
          console.error('Failed to load orchestras:', err);
          setFormError('Failed to load orchestras. Please try again.');
        }
      }
    };

    initializeFormData();

    if (clearError) {
      clearError();
    }
    
    // Set form mode based on whether we're editing or creating
    if (rehearsal?._id) {
      setFormMode('single');
    }
  }, [
    currentSchoolYear,
    loadCurrentSchoolYear,
    orchestras.length,
    loadOrchestras,
    clearError,
    rehearsal
  ]);

  // Set form mode
  const handleSetFormMode = (mode: 'single' | 'bulk') => {
    if (rehearsal?._id) return; // Cannot switch to bulk when editing
    setFormMode(mode);
  };

  // Handle form submission for single rehearsal
  const handleSingleSubmit = async (values: RehearsalFormValues) => {
    setFormError('');

    try {
      // Ensure school year ID is set
      const schoolYearId = values.schoolYearId || currentSchoolYear?._id;
      if (!schoolYearId) {
        setFormError('שנת הלימודים לא נטענה. אנא רענן את הדף.');
        return;
      }

      // Update the school year ID in values
      const rehearsalData = {
        ...values,
        schoolYearId
      };

      console.log('Saving single rehearsal:', rehearsalData);
      await saveRehearsal(rehearsalData);

      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }

      // Close form
      onClose();
    } catch (err) {
      console.error('Error saving rehearsal:', err);
      setFormError(err instanceof Error ? err.message : 'שגיאה בשמירת החזרה');
    }
  };

  // Handle form submission for bulk rehearsals
  const handleBulkSubmit = async (values: BulkRehearsalFormValues) => {
    setFormError('');

    try {
      // Ensure school year ID is set
      const schoolYearId = values.schoolYearId || currentSchoolYear?._id;
      if (!schoolYearId) {
        setFormError('שנת הלימודים לא נטענה. אנא רענן את הדף.');
        return;
      }

      // Prepare data for bulk creation
      const bulkData = {
        ...values,
        dayOfWeek: Number(values.dayOfWeek),
        schoolYearId
      };

      console.log('Creating bulk rehearsals:', bulkData);
      await bulkCreateRehearsals(bulkData);

      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }

      // Close form
      onClose();
    } catch (err) {
      console.error('Error creating bulk rehearsals:', err);
      setFormError(err instanceof Error ? err.message : 'שגיאה ביצירת חזרות מרובות');
    }
  };

  // Add excluded date in bulk mode
  const addExcludedDate = (
    excludedDate: string,
    values: BulkRehearsalFormValues,
    setFieldValue: (field: string, value: any) => void
  ) => {
    if (!excludedDate) return;

    if (!values.excludeDates.includes(excludedDate)) {
      const updatedExcludeDates = [...values.excludeDates, excludedDate];
      setFieldValue('excludeDates', updatedExcludeDates);
      setExcludedDate('');
    }
  };

  // Remove excluded date in bulk mode
  const removeExcludedDate = (
    dateToRemove: string,
    values: BulkRehearsalFormValues,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const updatedExcludeDates = values.excludeDates.filter(
      (date) => date !== dateToRemove
    );
    setFieldValue('excludeDates', updatedExcludeDates);
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className='rehearsal-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button className='close-btn' onClick={onClose} aria-label='סגור'>
          <X size={20} />
        </button>

        <h2>{rehearsal?._id ? 'עריכת חזרה' : 'הוספת חזרה חדשה'}</h2>

        {error && <div className='error-message'>{error}</div>}
        {formError && <div className='error-message'>{formError}</div>}

        {/* Mode Toggle */}
        {!rehearsal?._id && (
          <div className='mode-toggle'>
            <button
              type='button'
              className={formMode === 'single' ? 'active' : ''}
              onClick={() => handleSetFormMode('single')}
            >
              חזרה בודדת
            </button>
            <button
              type='button'
              className={formMode === 'bulk' ? 'active' : ''}
              onClick={() => handleSetFormMode('bulk')}
            >
              חזרות מרובות
            </button>
          </div>
        )}

        {formMode === 'single' ? (
          // Single Rehearsal Form
          <Formik
            initialValues={getInitialRehearsalValues(
              rehearsal, 
              orchestraId, 
              currentSchoolYear?._id || ''
            )}
            validationSchema={RehearsalValidationSchema}
            onSubmit={handleSingleSubmit}
            enableReinitialize
          >
            {() => (
              <Form>
                {/* Orchestra Selection */}
                <div className='form-section'>
                  <h3>פרטי תזמורת</h3>
                  <div className='form-row full-width'>
                    <FormField
                      label='תזמורת/הרכב'
                      name='groupId'
                      as='select'
                      required
                      labelIcon={<Music size={16} />}
                    >
                      <option value=''>בחר תזמורת/הרכב</option>
                      {orchestras.map((orchestra) => (
                        <option key={orchestra._id} value={orchestra._id}>
                          {orchestra.name}
                        </option>
                      ))}
                    </FormField>
                  </div>
                </div>

                {/* Rehearsal Information */}
                <div className='form-section'>
                  <h3>פרטי חזרה</h3>
                  
                  <div className='form-row full-width'>
                    <FormField
                      label='תאריך'
                      name='date'
                      type='date'
                      required
                      labelIcon={<Calendar size={16} />}
                    />
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
                      <option value=''>בחר מיקום</option>
                      {VALID_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  {/* Notes */}
                  <div className='form-row full-width'>
                    <FormField
                      label='הערות'
                      name='notes'
                      as='textarea'
                      rows={3}
                    />
                  </div>

                  {/* Hidden fields */}
                  <Field type='hidden' name='schoolYearId' value={currentSchoolYear?._id || ''} />
                  <Field type='hidden' name='isActive' />
                  <Field type='hidden' name='type' />
                  <Field type='hidden' name='dayOfWeek' />
                </div>

                {/* Form actions */}
                <div className='form-actions'>
                  <button type='submit' className='primary' disabled={isLoading}>
                    {isLoading ? 'שומר...' : rehearsal?._id ? 'עדכון' : 'הוספה'}
                  </button>
                  <button type='button' className='secondary' onClick={onClose}>
                    ביטול
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          // Bulk Rehearsal Form
          <Formik
            initialValues={getInitialBulkRehearsalValues(
              orchestraId, 
              currentSchoolYear?._id || ''
            )}
            validationSchema={BulkRehearsalValidationSchema}
            onSubmit={handleBulkSubmit}
            enableReinitialize
          >
            {({ values, setFieldValue }) => (
              <Form>
                {/* Orchestra Selection */}
                <div className='form-section'>
                  <h3>פרטי תזמורת</h3>
                  <div className='form-row full-width'>
                    <FormField
                      label='תזמורת/הרכב'
                      name='orchestraId'
                      as='select'
                      required
                      labelIcon={<Music size={16} />}
                    >
                      <option value=''>בחר תזמורת/הרכב</option>
                      {orchestras.map((orchestra) => (
                        <option key={orchestra._id} value={orchestra._id}>
                          {orchestra.name}
                        </option>
                      ))}
                    </FormField>
                  </div>
                </div>

                {/* Rehearsal Information */}
                <div className='form-section'>
                  <h3>פרטי חזרה</h3>
                  
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
                      חזרות ייווצרו בכל יום {getDayName(Number(values.dayOfWeek))}{' '}
                      בטווח התאריכים שנבחר
                    </div>
                  </div>

                  <div className='form-row full-width'>
                    <div className='form-group excluded-dates'>
                      <label>
                        <Calendar size={16} className='icon' />
                        תאריכים לדילוג
                      </label>

                      <div className='date-input-group'>
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
                          className='add-date-btn'
                          disabled={!excludedDate}
                        >
                          הוסף
                        </button>
                      </div>

                      {values.excludeDates.length > 0 && (
                        <div className='excluded-dates-list'>
                          <div className='list-title'>תאריכים שיידלגו:</div>
                          <ul>
                            {values.excludeDates.map((date) => (
                              <li key={date}>
                                {new Date(date).toLocaleDateString('he-IL')}
                                <button
                                  type='button'
                                  onClick={() => removeExcludedDate(date, values, setFieldValue)}
                                  className='remove-date-btn'
                                >
                                  <X size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                      <option value=''>בחר מיקום</option>
                      {VALID_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </FormField>
                  </div>

                  {/* Notes */}
                  <div className='form-row full-width'>
                    <FormField
                      label='הערות'
                      name='notes'
                      as='textarea'
                      rows={3}
                    />
                  </div>

                  {/* Hidden school year field */}
                  <Field type='hidden' name='schoolYearId' value={currentSchoolYear?._id || ''} />
                </div>

                {/* Form actions */}
                <div className='form-actions'>
                  <button type='submit' className='primary' disabled={isLoading}>
                    {isLoading ? 'שומר...' : 'יצירת חזרות מרובות'}
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