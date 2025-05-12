// src/cmps/StudentForm/InstrumentSection.tsx
import React, { useState } from 'react';
import { Music, Star, Plus, Trash2, Check } from 'lucide-react';
import { InstrumentProgress } from '../../services/studentService';

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
  onInstrumentsChange,
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

  const stageOptions = [1, 2, 3, 4, 5, 6];

  const testStatusOptions = [
    'לא נבחן',
    'עבר/ה',
    'עבר/ה בהצלחה',
    'עבר/ה בהצטיינות',
    'לא עבר/ה',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      // Handle nested objects (e.g. tests.stageTest.status)
      const [parent, child, prop] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof typeof prev] as Record<string, any>) || {}),
          [child]: {
            ...((((prev[parent as keyof typeof prev] as Record<string, any>) ||
              {})[child as keyof (typeof prev)[keyof typeof prev]] as Record<
              string,
              any
            >) || {}),
            [prop]: value,
          },
        },
      }));
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

  const handleAddInstrument = () => {
    if (!formData.instrumentName) return;

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

    // If this is the first instrument or if it's marked as primary, make sure no other is primary
    const updatedInstruments = [...instruments];

    if (newInstrument.isPrimary) {
      updatedInstruments.forEach((inst) => {
        inst.isPrimary = false;
      });
    } else if (updatedInstruments.length === 0) {
      // If this is the first instrument, make it primary by default
      newInstrument.isPrimary = true;
    }

    updatedInstruments.push(newInstrument);
    onInstrumentsChange?.(updatedInstruments);

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
    setShowForm(false);
  };

  const handleRemoveInstrument = (index: number) => {
    const updatedInstruments = [...instruments];
    const removedInstrument = updatedInstruments[index];

    updatedInstruments.splice(index, 1);

    // If we removed the primary instrument, make the first one primary (if any exist)
    if (removedInstrument.isPrimary && updatedInstruments.length > 0) {
      updatedInstruments[0].isPrimary = true;
    }

    onInstrumentsChange?.(updatedInstruments);
  };

  const handleSetPrimary = (index: number) => {
    const updatedInstruments = [...instruments];

    // Set all to non-primary first
    updatedInstruments.forEach((inst, i) => {
      inst.isPrimary = i === index;
    });

    onInstrumentsChange?.(updatedInstruments);
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
      case 'לא עבר/ה':
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className='form-section instrument-section'>
      <h3>כלי נגינה</h3>

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
                    onClick={() => handleRemoveInstrument(index)}
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

          <div className='form-grid'>
            <div className='form-group'>
              <label htmlFor='instrumentName'>כלי נגינה</label>
              <select
                id='instrumentName'
                name='instrumentName'
                value={formData.instrumentName}
                onChange={handleInputChange}
                className={errors.instrumentName ? 'is-invalid' : ''}
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
              onClick={() => setShowForm(false)}
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
