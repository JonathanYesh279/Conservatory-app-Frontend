// src/cmps/StudentForm/InstrumentSelectionSection.tsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { VALID_INSTRUMENTS } from '../../hooks/useStudentForm';

interface InstrumentSelectionSectionProps {
  instruments: Array<{ id: string; name: string; isPrimary: boolean }>;
  addInstrument: (instrumentName: string) => void;
  removeInstrument: (instrumentId: string) => void;
  isPrimaryInstrument: (instrumentId: string) => boolean;
  setPrimaryInstrument: (instrumentId: string) => void;
  errors: Record<string, string>;
}

export function InstrumentSelectionSection({
  instruments,
  addInstrument,
  removeInstrument,
  errors,
}: InstrumentSelectionSectionProps) {
  // State to track number of additional inputs
  const [additionalInputsCount, setAdditionalInputsCount] = useState(0);

  // State for tracking values of additional inputs
  const [additionalInputValues, setAdditionalInputValues] = useState<string[]>(
    []
  );

  // Get primary instrument value
  const primaryInstrumentValue =
    instruments.find((i) => i.isPrimary)?.name || '';

  // Handle primary instrument change
  const handlePrimaryInstrumentChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;

    if (value) {
      // Find primary instrument if exists
      const primaryInstrument = instruments.find((i) => i.isPrimary);

      if (primaryInstrument) {
        // Remove old primary and add new one
        removeInstrument(primaryInstrument.id);
      }

      // Add the new primary instrument
      addInstrument(value);
    }
  };

  // Handle additional instrument change
  const handleAdditionalInstrumentChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    index: number
  ) => {
    const value = e.target.value;

    // Update the input value in state
    const newValues = [...additionalInputValues];
    newValues[index] = value;
    setAdditionalInputValues(newValues);

    if (value) {
      // Add the instrument
      addInstrument(value);
    }
  };

  // Add another instrument input field
  const addAnotherInstrumentInput = () => {
    setAdditionalInputsCount((prevCount) => prevCount + 1);
    setAdditionalInputValues((prev) => [...prev, '']);
  };

  // Get currently selected instrument names
  const selectedInstrumentNames = instruments.map((i) => i.name);

  // Get available instruments (not yet selected)
  const getAvailableInstruments = (currentIndex: number) => {
    const currentValue = additionalInputValues[currentIndex] || '';

    return VALID_INSTRUMENTS.filter(
      (instrument) =>
        !selectedInstrumentNames.includes(instrument) ||
        instrument === currentValue
    );
  };

  return (
    <div className='form-section'>
      <h3>כלי נגינה</h3>

      {/* Primary instrument selection */}
      <div className='form-row'>
        <div className='form-group'>
          <label htmlFor='primaryInstrument'>כלי נגינה *</label>
          <select
            id='primaryInstrument'
            name='primaryInstrument'
            value={primaryInstrumentValue}
            onChange={handlePrimaryInstrumentChange}
            className={errors['academicInfo.instruments'] ? 'is-invalid' : ''}
            required
          >
            <option value=''>בחר כלי נגינה</option>
            {VALID_INSTRUMENTS.map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
          </select>
          {errors['academicInfo.instruments'] && (
            <div className='form-error'>
              {errors['academicInfo.instruments']}
            </div>
          )}
        </div>
      </div>

      {/* Additional instrument input fields */}
      {Array.from({ length: additionalInputsCount }).map((_, index) => (
        <div key={`additional-instrument-${index}`} className='form-row'>
          <div className='form-group'>
            <label htmlFor={`additionalInstrument-${index}`}>
              כלי נגינה נוסף
            </label>
            <select
              id={`additionalInstrument-${index}`}
              name={`additionalInstrument-${index}`}
              value={additionalInputValues[index] || ''}
              onChange={(e) => handleAdditionalInstrumentChange(e, index)}
            >
              <option value=''>בחר כלי נגינה</option>
              {getAvailableInstruments(index).map((instrument) => (
                <option key={instrument} value={instrument}>
                  {instrument}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Button to add another instrument input */}
      <button
        type='button'
        className='add-another-btn'
        onClick={addAnotherInstrumentInput}
      >
        <Plus size={16} />
        הוסף כלי נוסף
      </button>
    </div>
  );
}
