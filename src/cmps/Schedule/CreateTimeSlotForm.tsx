import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { 
  CreateScheduleSlotData, 
  ScheduleSlot, 
  UpdateScheduleSlotData 
} from '../../services/scheduleService';
import { timeSlotSchema } from '../../utils/scheduleValidation';
import { useScheduleManagement } from '../../hooks/useScheduleManagement';
import { 
  formatDayOfWeek, 
  generateTimeSlotOptions, 
  calculateEndTime,
  getDurationOptions
} from '../../utils/scheduleUtils';
import ScheduleConflictIndicator from './ScheduleConflictIndicator';

interface CreateTimeSlotFormProps {
  teacherId: string;
  initialSlot?: ScheduleSlot;
  onSubmit?: (slot: ScheduleSlot) => void;
  onCancel?: () => void;
}

const CreateTimeSlotForm: React.FC<CreateTimeSlotFormProps> = ({
  teacherId,
  initialSlot,
  onSubmit,
  onCancel
}) => {
  // Get schedule management functionality
  const { 
    createTimeSlot, 
    updateTimeSlot, 
    checkForConflicts, 
    isCreating, 
    isUpdating, 
    error, 
    clearErrors 
  } = useScheduleManagement({ teacherId });
  
  // Local state
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(Boolean(initialSlot));
  const [selectedDuration, setSelectedDuration] = useState(30); // Default 30 minutes
  
  // Generate time options
  const timeOptions = generateTimeSlotOptions(8, 20, 15); // 8 AM to 8 PM, 15-minute intervals
  const durationOptions = getDurationOptions();
  
  // Initialize form values
  const initialValues: CreateScheduleSlotData | UpdateScheduleSlotData = {
    dayOfWeek: initialSlot?.dayOfWeek ?? new Date().getDay(),
    startTime: initialSlot?.startTime ?? '09:00',
    endTime: initialSlot?.endTime ?? '09:30',
    location: initialSlot?.location ?? '',
    notes: initialSlot?.notes ?? '',
    isRecurring: initialSlot?.isRecurring ?? true
  };
  
  // Handle end time calculation when start time or duration changes
  const updateEndTime = (startTime: string, durationMinutes: number): string => {
    return calculateEndTime(startTime, durationMinutes);
  };
  
  // Handle form submission
  const handleSubmit = async (values: CreateScheduleSlotData | UpdateScheduleSlotData) => {
    // Clear any previous errors
    clearErrors();
    setConflictError(null);
    
    // Check for conflicts
    const conflict = checkForConflicts({
      id: initialSlot?.id,
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      isRecurring: values.isRecurring || false
    });
    
    if (conflict) {
      setConflictError(conflict);
      return;
    }
    
    try {
      let result: ScheduleSlot | null;
      
      if (isEditMode && initialSlot) {
        // Update existing slot
        result = await updateTimeSlot(initialSlot.id, values as UpdateScheduleSlotData);
      } else {
        // Create new slot
        result = await createTimeSlot(values as CreateScheduleSlotData);
      }
      
      if (result && onSubmit) {
        onSubmit(result);
      }
    } catch (err) {
      console.error('Error saving time slot:', err);
    }
  };
  
  return (
    <div className="create-time-slot-form">
      <h2>{isEditMode ? 'Edit Time Slot' : 'Create New Time Slot'}</h2>
      
      {(error || conflictError) && (
        <div className="form-error">
          {error || conflictError}
        </div>
      )}
      
      <Formik
        initialValues={initialValues}
        validationSchema={timeSlotSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isValid, dirty }) => (
          <Form>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dayOfWeek">Day of Week</label>
                <Field
                  as="select"
                  id="dayOfWeek"
                  name="dayOfWeek"
                  className="form-control"
                >
                  {Array.from({ length: 7 }, (_, i) => (
                    <option key={i} value={i}>
                      {formatDayOfWeek(i, 'medium')}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="dayOfWeek" component="div" className="form-error" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <Field
                  as="select"
                  id="startTime"
                  name="startTime"
                  className="form-control"
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const startTime = e.target.value;
                    setFieldValue('startTime', startTime);
                    setFieldValue('endTime', updateEndTime(startTime, selectedDuration));
                  }}
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="startTime" component="div" className="form-error" />
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Duration</label>
                <select
                  id="duration"
                  className="form-control"
                  value={selectedDuration}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const duration = parseInt(e.target.value, 10);
                    setSelectedDuration(duration);
                    setFieldValue('endTime', updateEndTime(values.startTime, duration));
                  }}
                >
                  {durationOptions.map(duration => (
                    <option key={duration} value={duration}>
                      {duration} minutes
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <Field
                  as="select"
                  id="endTime"
                  name="endTime"
                  className="form-control"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="endTime" component="div" className="form-error" />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location (Optional)</label>
                <Field
                  type="text"
                  id="location"
                  name="location"
                  className="form-control"
                  placeholder="Room number, building, etc."
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <Field
                  as="textarea"
                  id="notes"
                  name="notes"
                  className="form-control"
                  rows={3}
                  placeholder="Additional information about this time slot..."
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <Field
                    type="checkbox"
                    id="isRecurring"
                    name="isRecurring"
                    className="form-checkbox"
                  />
                  Recurring weekly slot
                </label>
                <div className="checkbox-help">
                  Check this if this slot repeats every week
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onCancel}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="submit-button"
                disabled={!isValid || !dirty || isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? 'Saving...'
                  : isEditMode
                    ? 'Update Slot'
                    : 'Create Slot'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateTimeSlotForm;