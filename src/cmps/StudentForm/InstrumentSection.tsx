// src/cmps/StudentForm/InstrumentSection.tsx
import React, { useState, useEffect } from 'react';
import { Music, Star, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { InstrumentProgress } from '../../services/studentService';
import { ConfirmDialog } from '../ConfirmDialog';

interface InstrumentSectionProps {
  instruments: InstrumentProgress[];
  addInstrument: (instrumentName: string) => void;
  removeInstrument: (instrumentName: string) => void;
  setPrimaryInstrument: (instrumentName: string) => void;
  updateInstrumentProgress: (
    instrumentName: string,
    field: string,
    value: any
  ) => void;
  updateInstrumentTest: (
    instrumentName: string,
    testType: string,
    field: string,
    value: any
  ) => void;
  onInstrumentsChange?: (instruments: InstrumentProgress[]) => void;
  isSubmitting?: boolean;
  isFormOpen?: boolean;
  errors: any;
}

export function InstrumentSection({
  instruments,
  addInstrument,
  removeInstrument,
  setPrimaryInstrument,
  updateInstrumentProgress,
  updateInstrumentTest,
  errors = {},
}: InstrumentSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<InstrumentProgress>>({
    instrumentName: '',
    currentStage: 1,
    isPrimary: false,
    tests: {
      stageTest: { status: 'לא נבחן', notes: '' },
      technicalTest: { status: 'לא נבחן', notes: '' },
    },
  });

  // Add state for confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [instrumentToRemove, setInstrumentToRemove] = useState<string | null>(
    null
  );

  // Add feedback states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastAddedInstrument, setLastAddedInstrument] = useState('');
  const [formError, setFormError] = useState('');

  const instrumentOptions = [
    'כינור',
    'צ׳לו',
    'ויולה',
    'קונטרבס',
    'חליל',
    'קלרינט',
    'אבוב',
    'בסון',
    'סקסופון',
    'חצוצרה',
    'טרומבון',
    'קרן יער',
    'טובה',
    'פסנתר',
    'גיטרה',
    'מדרימבה',
    'תופים',
    'הקשה',
  ];

  const stageOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  const testStatusOptions = [
    'לא נבחן',
    'עבר/ה',
    'עבר/ה בהצטיינות',
    'עבר/ה בהצטיינות יתרה',
    'לא עבר/ה',
  ];

  // Clear success message after timeout
  useEffect(() => {
    let timer: number;
    if (showSuccessMessage) {
      timer = window.setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSuccessMessage]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Clear any form errors when user makes changes
    setFormError('');

    if (name.includes('.')) {
      // Handle nested objects (e.g. tests.stageTest.status)
      const [parent, child, prop] = name.split('.');
      setFormData((prev) => {
        // Get the parent object with a fallback to an empty object
        const parentObj =
          (prev[parent as keyof typeof prev] as Record<string, any>) || {};

        // Get the child object with a fallback to an empty object
        const childObj = parentObj[child] || {};

        // Create updated child with the new property value
        const updatedChild = {
          ...childObj,
          [prop]: value,
        };

        // Create updated parent with the new child object
        const updatedParent = {
          ...parentObj,
          [child]: updatedChild,
        };

        // Return the updated form data
        return {
          ...prev,
          [parent]: updatedParent,
        };
      });
    } else if (name === 'isPrimary') {
      // Handle checkbox
      setFormData((prev) => ({
        ...prev,
        isPrimary: (e.target as HTMLInputElement).checked,
      }));
    } else {
      // Handle regular fields
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'currentStage' ? parseInt(value, 10) : value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.instrumentName) {
      setFormError('יש לבחור כלי נגינה');
      return false;
    }

    // Check if this instrument already exists
    if (instruments.some((i) => i.instrumentName === formData.instrumentName)) {
      setFormError('כלי נגינה זה כבר קיים ברשימה');
      return false;
    }

    return true;
  };

  const handleAddInstrument = () => {
    // Validate form before adding
    if (!validateForm()) return;

    const newInstrument = {
      instrumentName: formData.instrumentName,
      currentStage: formData.currentStage || 1,
      isPrimary: formData.isPrimary || false,
      tests: {
        stageTest: {
          status: formData.tests?.stageTest?.status || 'לא נבחן',
          notes: formData.tests?.stageTest?.notes || '',
        },
        technicalTest: {
          status: formData.tests?.technicalTest?.status || 'לא נבחן',
          notes: formData.tests?.technicalTest?.notes || '',
        },
      },
    } as InstrumentProgress;

    // Store the instrument name for the success message
    setLastAddedInstrument(newInstrument.instrumentName);

    // IMPORTANT: Use the provided addInstrument function from props
    addInstrument(newInstrument.instrumentName);

    // Update stage if not default
    if (newInstrument.currentStage !== 1) {
      updateInstrumentProgress(
        newInstrument.instrumentName,
        'currentStage',
        newInstrument.currentStage
      );
    }

    // Update primary status if true
    if (newInstrument.isPrimary) {
      setPrimaryInstrument(newInstrument.instrumentName);
    }

    // Update test statuses if not default
    if (
      newInstrument.tests?.stageTest?.status !== 'לא נבחן' ||
      newInstrument.tests.stageTest.notes
    ) {
      updateInstrumentTest(
        newInstrument.instrumentName,
        'stageTest',
        'status',
        newInstrument.tests?.stageTest?.status
      );

      if (newInstrument.tests?.stageTest?.notes) {
        updateInstrumentTest(
          newInstrument.instrumentName,
          'stageTest',
          'notes',
          newInstrument.tests.stageTest.notes
        );
      }
    }

    if (
      newInstrument.tests?.technicalTest?.status !== 'לא נבחן' ||
      newInstrument.tests.technicalTest.notes
    ) {
      updateInstrumentTest(
        newInstrument.instrumentName,
        'technicalTest',
        'status',
        newInstrument.tests?.technicalTest?.status
      );

      if (newInstrument.tests?.technicalTest?.notes) {
        updateInstrumentTest(
          newInstrument.instrumentName,
          'technicalTest',
          'notes',
          newInstrument.tests.technicalTest.notes
        );
      }
    }

    // Show success message
    setShowSuccessMessage(true);

    // Reset form
    setFormData({
      instrumentName: '',
      currentStage: 1,
      isPrimary: false,
      tests: {
        stageTest: { status: 'לא נבחן', notes: '' },
        technicalTest: { status: 'לא נבחן', notes: '' },
      },
    });

    // Close the form
    setShowForm(false);
  };

  // Initiate the removal process by showing confirmation dialog
  const initiateRemoveInstrument = (instrumentName: string) => {
    setInstrumentToRemove(instrumentName);
    setIsConfirmDialogOpen(true);
  };

  // Confirm the removal after user accepts the dialog
  const confirmRemoveInstrument = () => {
    if (instrumentToRemove) {
      // Call the actual removeInstrument function from props
      removeInstrument(instrumentToRemove);
      setInstrumentToRemove(null);
    }
    setIsConfirmDialogOpen(false);
  };

  const handleSetPrimary = (index: number) => {
    if (index >= 0 && index < instruments.length) {
      const instrument = instruments[index];
      setPrimaryInstrument(instrument.instrumentName);
    }
  };

  // Function to get badge class based on test status
  const getTestStatusBadge = (status: string) => {
    switch (status) {
      case 'עבר/ה':
        return 'status-passed';
      case 'עבר/ה בהצלחה':
        return 'status-success';
      case 'עבר/ה בהצטיינות':
        return 'status-excellent';
      case 'עבר/ה בהצטיינות יתרה':
        return 'status-excellent';
      case 'לא עבר/ה':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className='form-section instrument-section'>
      <h3>כלי נגינה</h3>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className='success-message'>
          <Check size={16} />
          <span>הכלי {lastAddedInstrument} נוסף בהצלחה</span>
        </div>
      )}

      {/* List existing instruments */}
      {instruments.length > 0 && (
        <div className='instruments-list'>
          {instruments.map((instrument, index) => (
            <div key={index} className='instrument-card'>
              <div className='instrument-header'>
                <div className='instrument-info'>
                  <div className='instrument-name-wrapper'>
                    <div className='instrument-name'>
                      <Music size={16} />
                      <span>{instrument.instrumentName}</span>
                      {instrument.isPrimary && (
                        <span className='primary-badge'>
                          <Star size={12} />
                          ראשי
                        </span>
                      )}
                    </div>
                    <div className='stage-badge'>
                      שלב {instrument.currentStage}
                    </div>
                  </div>

                  <div className='test-badges'>
                    <div
                      className={`test-badge ${getTestStatusBadge(
                        instrument.tests?.technicalTest?.status || 'לא נבחן'
                      )}`}
                    >
                      <span className='test-label'>טכני:</span>
                      <span className='test-value'>
                        {instrument.tests?.technicalTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                    <div
                      className={`test-badge ${getTestStatusBadge(
                        instrument.tests?.stageTest?.status || 'לא נבחן'
                      )}`}
                    >
                      <span className='test-label'>שלב:</span>
                      <span className='test-value'>
                        {instrument.tests?.stageTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                  </div>

                  {(instrument.tests?.stageTest?.notes ||
                    instrument.tests?.technicalTest?.notes) && (
                    <div className='test-notes'>
                      <span>
                        {instrument.tests?.stageTest?.notes ||
                          instrument.tests?.technicalTest?.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className='instrument-actions'>
                  {!instrument.isPrimary && (
                    <button
                      type='button'
                      className='set-primary-btn'
                      onClick={() => handleSetPrimary(index)}
                      title='הגדר כראשי'
                    >
                      <Star size={14} />
                    </button>
                  )}
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() =>
                      initiateRemoveInstrument(instrument.instrumentName)
                    }
                    aria-label='הסר כלי נגינה'
                    title='הסר כלי נגינה'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add instrument button or form */}
      {!showForm ? (
        <div className='add-more-instruments'>
          <button
            type='button'
            className='add-more-btn'
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            הוסף כלי נגינה
          </button>
        </div>
      ) : (
        <div className='add-instrument-form'>
          <h4>הוספת כלי נגינה</h4>

          {/* Form error message */}
          {formError && (
            <div className='form-error-message'>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className='form-grid'>
            <div className='form-group'>
              <label htmlFor='instrumentName'>כלי נגינה *</label>
              <select
                id='instrumentName'
                name='instrumentName'
                value={formData.instrumentName}
                onChange={handleInputChange}
                className={
                  errors.instrumentName || formError ? 'is-invalid' : ''
                }
              >
                <option value=''>בחר כלי נגינה</option>
                {instrumentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.instrumentName && (
                <div className='form-error'>{errors.instrumentName}</div>
              )}
            </div>

            <div className='form-group'>
              <label htmlFor='currentStage'>שלב</label>
              <select
                id='currentStage'
                name='currentStage'
                value={formData.currentStage}
                onChange={handleInputChange}
              >
                {stageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='form-grid'>
            <div className='form-group'>
              <label htmlFor='stageTestStatus'>מבחן שלב</label>
              <select
                id='stageTestStatus'
                name='tests.stageTest.status'
                value={formData.tests?.stageTest?.status || 'לא נבחן'}
                onChange={handleInputChange}
              >
                {testStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className='form-group'>
              <label htmlFor='technicalTestStatus'>מבחן טכני</label>
              <select
                id='technicalTestStatus'
                name='tests.technicalTest.status'
                value={formData.tests?.technicalTest?.status || 'לא נבחן'}
                onChange={handleInputChange}
              >
                {testStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className='form-row'>
            <div className='form-group'>
              <label htmlFor='stageTestNotes'>הערות</label>
              <input
                type='text'
                id='stageTestNotes'
                name='tests.stageTest.notes'
                value={formData.tests?.stageTest?.notes || ''}
                onChange={handleInputChange}
                placeholder='הערות אופציונליות'
              />
            </div>
          </div>

          <div className='form-row'>
            <div className='primary-checkbox'>
              <input
                type='checkbox'
                id='isPrimary'
                name='isPrimary'
                checked={formData.isPrimary}
                onChange={handleInputChange}
              />
              <label htmlFor='isPrimary'>כלי נגינה ראשי</label>
            </div>
          </div>

          <div className='form-actions-row'>
            <button
              type='button'
              className='add-instrument-btn'
              onClick={handleAddInstrument}
            >
              <Check size={16} />
              הוסף
            </button>
            <button
              type='button'
              className='cancel-btn'
              onClick={() => {
                setShowForm(false);
                setFormError('');
              }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmRemoveInstrument}
        title='הסרת כלי נגינה'
        message={`האם אתה בטוח שברצונך להסיר את ${
          instrumentToRemove ? instrumentToRemove : 'כלי הנגינה'
        }?`}
        confirmText='הסר'
        cancelText='ביטול'
        type='warning'
      />
    </div>
  );
}
