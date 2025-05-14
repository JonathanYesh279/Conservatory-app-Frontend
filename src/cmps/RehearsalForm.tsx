// src/cmps/RehearsalForm.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Repeat, Music } from 'lucide-react';
import { Rehearsal } from '../services/rehearsalService';
import { useRehearsalStore } from '../store/rehearsalStore';
import { useOrchestraStore } from '../store/orchestraStore';
import { useSchoolYearStore } from '../store/schoolYearStore';

import { VALID_LOCATIONS } from './OrchestraForm';

// Helper function
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

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

  // Single rehearsal form data
  const [singleFormData, setSingleFormData] = useState({
    _id: rehearsal?._id,
    groupId: orchestraId || '',
    date: formatDateForInput(new Date()),
    startTime: '16:00',
    endTime: '18:00',
    location: VALID_LOCATIONS[0],
    notes: '',
    isActive: true,
    schoolYearId: currentSchoolYear?._id || '',
    type: 'תזמורת',
    dayOfWeek: new Date().getDay(),
  });

  // Bulk rehearsal form data
  const [bulkFormData, setBulkFormData] = useState({
    orchestraId: orchestraId || '',
    startDate: formatDateForInput(new Date()),
    endDate: formatDateForInput(
      new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
    ),
    dayOfWeek: new Date().getDay(),
    startTime: '16:00',
    endTime: '18:00',
    location: VALID_LOCATIONS[0],
    notes: '',
    excludeDates: [] as string[],
    schoolYearId: currentSchoolYear?._id || '',
  });

  // Excluded dates temp value
  const [excludedDate, setExcludedDate] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
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
  }, [
    currentSchoolYear,
    loadCurrentSchoolYear,
    orchestras.length,
    loadOrchestras,
    clearError,
  ]);

  // Update form data when school year changes
  useEffect(() => {
    if (currentSchoolYear?._id) {
      console.log(
        'Updating form data with school year ID:',
        currentSchoolYear._id
      );

      setSingleFormData((prev) => ({
        ...prev,
        schoolYearId: currentSchoolYear._id,
      }));

      setBulkFormData((prev) => ({
        ...prev,
        schoolYearId: currentSchoolYear._id,
      }));
    }
  }, [currentSchoolYear]);

  // Update form data when editing existing rehearsal
  useEffect(() => {
    if (rehearsal?._id) {
      setFormMode('single');
      setSingleFormData({
        _id: rehearsal._id,
        groupId: rehearsal.groupId,
        date: rehearsal.date,
        startTime: rehearsal.startTime,
        endTime: rehearsal.endTime,
        location: rehearsal.location || '',
        notes: rehearsal.notes || '',
        isActive: rehearsal.isActive !== false,
        schoolYearId: rehearsal.schoolYearId || currentSchoolYear?._id || '',
        type: rehearsal.type || 'תזמורת',
        dayOfWeek: rehearsal.dayOfWeek,
      });
    } else {
      // Reset form for new rehearsal
      const today = new Date();
      const todayDayOfWeek = today.getDay();
      const currentSchoolYearId = currentSchoolYear?._id || '';

      // Single form data
      setSingleFormData({
        _id: undefined,
        groupId: orchestraId || '',
        date: formatDateForInput(today),
        startTime: '16:00',
        endTime: '18:00',
        location: VALID_LOCATIONS[0],
        notes: '',
        isActive: true,
        schoolYearId: currentSchoolYearId,
        type: 'תזמורת',
        dayOfWeek: todayDayOfWeek,
      });

      // Bulk form data
      setBulkFormData({
        orchestraId: orchestraId || '',
        startDate: formatDateForInput(today),
        endDate: formatDateForInput(
          new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        ),
        dayOfWeek: todayDayOfWeek,
        startTime: '16:00',
        endTime: '18:00',
        location: VALID_LOCATIONS[0],
        notes: '',
        excludeDates: [],
        schoolYearId: currentSchoolYearId,
      });
    }

    setErrors({});
    setFormError('');
  }, [rehearsal, orchestraId, currentSchoolYear]);

  // Handle single form field changes
  const handleSingleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setSingleFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mirror to bulk form for common fields
    if (['startTime', 'endTime', 'location', 'notes'].includes(name)) {
      setBulkFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === 'groupId') {
      setBulkFormData((prev) => ({
        ...prev,
        orchestraId: value,
      }));
    }

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle bulk form field changes
  const handleBulkFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setBulkFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mirror to single form for common fields
    if (['startTime', 'endTime', 'location', 'notes'].includes(name)) {
      setSingleFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else if (name === 'orchestraId') {
      setSingleFormData((prev) => ({
        ...prev,
        groupId: value,
      }));
    }

    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Handle day of week selection
  const handleDayOfWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dayValue = parseInt(e.target.value, 10);

    setBulkFormData((prev) => ({
      ...prev,
      dayOfWeek: dayValue,
    }));

    setSingleFormData((prev) => ({
      ...prev,
      dayOfWeek: dayValue,
    }));
  };

  // Set form mode
  const handleSetFormMode = (mode: 'single' | 'bulk') => {
    if (rehearsal?._id) return; // Cannot switch to bulk when editing
    setFormMode(mode);
  };

  // Add excluded date
  const addExcludedDate = () => {
    if (!excludedDate) return;

    if (!bulkFormData.excludeDates.includes(excludedDate)) {
      setBulkFormData((prev) => ({
        ...prev,
        excludeDates: [...prev.excludeDates, excludedDate],
      }));
      setExcludedDate('');
    }
  };

  // Remove excluded date
  const removeExcludedDate = (dateToRemove: string) => {
    setBulkFormData((prev) => ({
      ...prev,
      excludeDates: prev.excludeDates.filter((date) => date !== dateToRemove),
    }));
  };

  // Get Hebrew day name
  const getDayName = (dayIndex: number): string => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[dayIndex];
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formMode === 'single') {
      // Validate single rehearsal form
      if (!singleFormData.groupId) newErrors.groupId = 'יש לבחור תזמורת';
      if (!singleFormData.date) newErrors.date = 'תאריך חובה';
      if (!singleFormData.startTime) newErrors.startTime = 'שעת התחלה חובה';
      if (!singleFormData.endTime) newErrors.endTime = 'שעת סיום חובה';
      if (!singleFormData.location) newErrors.location = 'מיקום חובה';
      if (!singleFormData.schoolYearId)
        newErrors.schoolYearId = 'שנת לימודים חובה';

      // Time validation
      if (
        singleFormData.startTime &&
        singleFormData.endTime &&
        singleFormData.endTime <= singleFormData.startTime
      ) {
        newErrors.endTime = 'שעת סיום חייבת להיות אחרי שעת התחלה';
      }
    } else {
      // Validate bulk rehearsal form
      if (!bulkFormData.orchestraId) newErrors.orchestraId = 'יש לבחור תזמורת';
      if (!bulkFormData.startDate) newErrors.startDate = 'תאריך התחלה חובה';
      if (!bulkFormData.endDate) newErrors.endDate = 'תאריך סיום חובה';
      if (!bulkFormData.startTime) newErrors.startTime = 'שעת התחלה חובה';
      if (!bulkFormData.endTime) newErrors.endTime = 'שעת סיום חובה';
      if (!bulkFormData.location) newErrors.location = 'מיקום חובה';
      if (!bulkFormData.schoolYearId)
        newErrors.schoolYearId = 'שנת לימודים חובה';

      // Date validation
      if (
        bulkFormData.startDate &&
        bulkFormData.endDate &&
        new Date(bulkFormData.endDate) < new Date(bulkFormData.startDate)
      ) {
        newErrors.endDate = 'תאריך סיום חייב להיות אחרי תאריך התחלה';
      }

      // Time validation
      if (
        bulkFormData.startTime &&
        bulkFormData.endTime &&
        bulkFormData.endTime <= bulkFormData.startTime
      ) {
        newErrors.endTime = 'שעת סיום חייבת להיות אחרי שעת התחלה';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Check if school year is loaded
    if (!currentSchoolYear?._id) {
      try {
        await loadCurrentSchoolYear();
      } catch (err) {
        setFormError('שנת הלימודים לא נטענה. אנא רענן את הדף.');
        return;
      }
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      if (formMode === 'single') {
        // Submit single rehearsal
        const rehearsalData = {
          ...singleFormData,
          schoolYearId: currentSchoolYear?._id || singleFormData.schoolYearId,
        };

        console.log('Saving single rehearsal:', rehearsalData);
        await saveRehearsal(rehearsalData);
      } else {
        // Submit bulk rehearsals
        const bulkData = {
          ...bulkFormData,
          dayOfWeek: Number(bulkFormData.dayOfWeek),
          schoolYearId: currentSchoolYear?._id || bulkFormData.schoolYearId,
        };

        console.log('Creating bulk rehearsals:', bulkData);
        await bulkCreateRehearsals(bulkData);
      }

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

        <form onSubmit={handleSubmit}>
          {/* Orchestra Selection */}
          <div className='form-section'>
            <h3>פרטי תזמורת</h3>
            <div className='form-row full-width'>
              <div className='form-group'>
                <label
                  htmlFor={formMode === 'single' ? 'groupId' : 'orchestraId'}
                >
                  <Music size={16} className='icon' />
                  תזמורת/הרכב *
                </label>
                <select
                  id={formMode === 'single' ? 'groupId' : 'orchestraId'}
                  name={formMode === 'single' ? 'groupId' : 'orchestraId'}
                  value={
                    formMode === 'single'
                      ? singleFormData.groupId
                      : bulkFormData.orchestraId
                  }
                  onChange={
                    formMode === 'single'
                      ? handleSingleFormChange
                      : handleBulkFormChange
                  }
                  className={
                    errors[formMode === 'single' ? 'groupId' : 'orchestraId']
                      ? 'is-invalid'
                      : ''
                  }
                  required
                >
                  <option value=''>בחר תזמורת/הרכב</option>
                  {orchestras.map((orchestra) => (
                    <option key={orchestra._id} value={orchestra._id}>
                      {orchestra.name}
                    </option>
                  ))}
                </select>
                {errors[formMode === 'single' ? 'groupId' : 'orchestraId'] && (
                  <div className='form-error'>
                    {errors[formMode === 'single' ? 'groupId' : 'orchestraId']}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rehearsal Information */}
          <div className='form-section'>
            <h3>פרטי חזרה</h3>

            {formMode === 'single' ? (
              /* Single Rehearsal Form */
              <div className='form-row full-width'>
                <div className='form-group'>
                  <label htmlFor='date'>
                    <Calendar size={16} className='icon' />
                    תאריך *
                  </label>
                  <input
                    type='date'
                    id='date'
                    name='date'
                    value={singleFormData.date}
                    onChange={handleSingleFormChange}
                    className={errors['date'] ? 'is-invalid' : ''}
                    required
                  />
                  {errors['date'] && (
                    <div className='form-error'>{errors['date']}</div>
                  )}
                </div>
              </div>
            ) : (
              /* Bulk Rehearsal Form */
              <>
                <div className='form-row'>
                  <div className='form-group'>
                    <label htmlFor='startDate'>
                      <Calendar size={16} className='icon' />
                      תאריך התחלה *
                    </label>
                    <input
                      type='date'
                      id='startDate'
                      name='startDate'
                      value={bulkFormData.startDate}
                      onChange={handleBulkFormChange}
                      className={errors['startDate'] ? 'is-invalid' : ''}
                      required
                    />
                    {errors['startDate'] && (
                      <div className='form-error'>{errors['startDate']}</div>
                    )}
                  </div>

                  <div className='form-group'>
                    <label htmlFor='endDate'>
                      <Calendar size={16} className='icon' />
                      תאריך סיום *
                    </label>
                    <input
                      type='date'
                      id='endDate'
                      name='endDate'
                      value={bulkFormData.endDate}
                      onChange={handleBulkFormChange}
                      className={errors['endDate'] ? 'is-invalid' : ''}
                      required
                    />
                    {errors['endDate'] && (
                      <div className='form-error'>{errors['endDate']}</div>
                    )}
                  </div>
                </div>

                <div className='form-row full-width'>
                  <div className='form-group'>
                    <label htmlFor='dayOfWeek'>
                      <Repeat size={16} className='icon' />
                      יום בשבוע *
                    </label>
                    <select
                      id='dayOfWeek'
                      name='dayOfWeek'
                      value={bulkFormData.dayOfWeek}
                      onChange={handleDayOfWeekChange}
                      required
                    >
                      <option value={0}>יום ראשון</option>
                      <option value={1}>יום שני</option>
                      <option value={2}>יום שלישי</option>
                      <option value={3}>יום רביעי</option>
                      <option value={4}>יום חמישי</option>
                      <option value={5}>יום שישי</option>
                      <option value={6}>יום שבת</option>
                    </select>
                    <div className='help-text'>
                      חזרות ייווצרו בכל יום {getDayName(bulkFormData.dayOfWeek)}{' '}
                      בטווח התאריכים שנבחר
                    </div>
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
                        min={bulkFormData.startDate}
                        max={bulkFormData.endDate}
                      />
                      <button
                        type='button'
                        onClick={addExcludedDate}
                        className='add-date-btn'
                        disabled={!excludedDate}
                      >
                        הוסף
                      </button>
                    </div>

                    {bulkFormData.excludeDates.length > 0 && (
                      <div className='excluded-dates-list'>
                        <div className='list-title'>תאריכים שיידלגו:</div>
                        <ul>
                          {bulkFormData.excludeDates.map((date) => (
                            <li key={date}>
                              {new Date(date).toLocaleDateString('he-IL')}
                              <button
                                type='button'
                                onClick={() => removeExcludedDate(date)}
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
              </>
            )}

            {/* Time - Common for both modes */}
            <div className='form-row'>
              <div className='form-group'>
                <label htmlFor='startTime'>
                  <Clock size={16} className='icon' />
                  שעת התחלה *
                </label>
                <input
                  type='time'
                  id='startTime'
                  name='startTime'
                  value={
                    formMode === 'single'
                      ? singleFormData.startTime
                      : bulkFormData.startTime
                  }
                  onChange={
                    formMode === 'single'
                      ? handleSingleFormChange
                      : handleBulkFormChange
                  }
                  className={errors['startTime'] ? 'is-invalid' : ''}
                  required
                />
                {errors['startTime'] && (
                  <div className='form-error'>{errors['startTime']}</div>
                )}
              </div>

              <div className='form-group'>
                <label htmlFor='endTime'>
                  <Clock size={16} className='icon' />
                  שעת סיום *
                </label>
                <input
                  type='time'
                  id='endTime'
                  name='endTime'
                  value={
                    formMode === 'single'
                      ? singleFormData.endTime
                      : bulkFormData.endTime
                  }
                  onChange={
                    formMode === 'single'
                      ? handleSingleFormChange
                      : handleBulkFormChange
                  }
                  className={errors['endTime'] ? 'is-invalid' : ''}
                  required
                />
                {errors['endTime'] && (
                  <div className='form-error'>{errors['endTime']}</div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='location'>
                  <MapPin size={16} className='icon' />
                  מיקום *
                </label>
                <select
                  id='location'
                  name='location'
                  value={
                    formMode === 'single'
                      ? singleFormData.location
                      : bulkFormData.location
                  }
                  onChange={
                    formMode === 'single'
                      ? handleSingleFormChange
                      : handleBulkFormChange
                  }
                  className={errors['location'] ? 'is-invalid' : ''}
                  required
                >
                  <option value='' disabled>
                    בחר מיקום
                  </option>
                  {VALID_LOCATIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                {errors['location'] && (
                  <div className='form-error'>{errors['location']}</div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='notes'>הערות</label>
                <textarea
                  id='notes'
                  name='notes'
                  value={
                    formMode === 'single'
                      ? singleFormData.notes
                      : bulkFormData.notes
                  }
                  onChange={
                    formMode === 'single'
                      ? handleSingleFormChange
                      : handleBulkFormChange
                  }
                  rows={3}
                />
              </div>
            </div>

            {/* Hidden school year field - but now explicitly set its value from current school year */}
            <input
              type='hidden'
              name='schoolYearId'
              value={currentSchoolYear?._id || ''}
            />
          </div>

          {/* Form actions */}
          <div className='form-actions'>
            <button type='submit' className='primary' disabled={isLoading}>
              {isLoading
                ? 'שומר...'
                : formMode === 'bulk'
                ? 'יצירת חזרות מרובות'
                : rehearsal?._id
                ? 'עדכון'
                : 'הוספה'}
            </button>
            <button type='button' className='secondary' onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
