// src/components/StudentForm/InstrumentSection.tsx
import React, { useState } from 'react';
import {
  Music,
  Star,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { InstrumentProgress } from '../../services/studentService';

interface InstrumentSectionProps {
  instruments: InstrumentProgress[];
  onInstrumentsChange: (instruments: InstrumentProgress[]) => void;
  errors?: Record<string, string>;
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
  const [expandedInstrumentIndex, setExpandedInstrumentIndex] = useState<
    number | null
  >(null);

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
          ...prev[parent as keyof typeof prev],
          [child]: {
            ...prev[parent as keyof typeof prev]?.[
              child as keyof (typeof prev)[keyof typeof prev]
            ],
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
    onInstrumentsChange(updatedInstruments);

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

    onInstrumentsChange(updatedInstruments);
  };

  const handleSetPrimary = (index: number) => {
    const updatedInstruments = [...instruments];

    // Set all to non-primary first
    updatedInstruments.forEach((inst, i) => {
      inst.isPrimary = i === index;
    });

    onInstrumentsChange(updatedInstruments);
  };

  const toggleInstrumentExpand = (index: number) => {
    setExpandedInstrumentIndex(
      expandedInstrumentIndex === index ? null : index
    );
  };

  return (
    <div className='form-section'>
      <h3>כלי נגינה</h3>

      {/* List existing instruments */}
      {instruments.length > 0 && (
        <div className='instruments-list'>
          {instruments.map((instrument, index) => (
            <div key={index} className='instrument-card'>
              <div className='instrument-header'>
                <div className='instrument-name'>
                  <Music size={16} />
                  {instrument.instrumentName}
                  {instrument.isPrimary && (
                    <span className='primary-badge'>
                      <Star size={12} />
                      ראשי
                    </span>
                  )}
                </div>
                <div className='instrument-actions'>
                  {!instrument.isPrimary && (
                    <button
                      type='button'
                      className='set-primary-btn'
                      onClick={() => handleSetPrimary(index)}
                    >
                      הגדר כראשי
                    </button>
                  )}
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() => handleRemoveInstrument(index)}
                    aria-label='הסר כלי נגינה'
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    type='button'
                    className='expand-btn'
                    onClick={() => toggleInstrumentExpand(index)}
                    aria-label={
                      expandedInstrumentIndex === index
                        ? 'צמצם פרטים'
                        : 'הרחב פרטים'
                    }
                  >
                    {expandedInstrumentIndex === index ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className='instrument-details'>
                <div className='details-row'>
                  <span className='detail-label'>שלב</span>
                  <span className='detail-value'>
                    {instrument.currentStage}
                  </span>
                </div>

                {expandedInstrumentIndex === index && (
                  <>
                    <div className='details-row'>
                      <span className='detail-label'>מבחן טכני</span>
                      <span className='detail-value'>
                        {instrument.tests?.technicalTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                    <div className='details-row'>
                      <span className='detail-label'>מבחן שלב</span>
                      <span className='detail-value'>
                        {instrument.tests?.stageTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                    {(instrument.tests?.stageTest?.notes ||
                      instrument.tests?.technicalTest?.notes) && (
                      <div className='details-row'>
                        <span className='detail-label'>הערות</span>
                        <span className='detail-value'>
                          {instrument.tests?.stageTest?.notes ||
                            instrument.tests?.technicalTest?.notes}
                        </span>
                      </div>
                    )}
                  </>
                )}
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

          <div className='form-row'>
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

          <div className='form-row'>
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
              <label htmlFor='stageTestNotes'>הערות מבחן שלב</label>
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
            <div className='form-group'>
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
          </div>

          <div className='form-row'>
            <button
              type='button'
              className='add-instrument-btn primary'
              onClick={handleAddInstrument}
            >
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
