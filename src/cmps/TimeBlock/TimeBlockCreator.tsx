import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, MapPin, Copy, Check } from 'lucide-react';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import { 
  HEBREW_DAYS,
  HebrewDayName,
  TimeBlockRequest,
  TimeBlockResponse,
  timeBlockService
} from '../../services/timeBlockService';
import { VALID_LOCATIONS } from '../../validations/constants';

interface TimeBlockCreatorProps {
  teacherId: string;
  onBlockCreated?: (block: TimeBlockResponse | TimeBlockResponse[]) => void;
  onCancel?: () => void;
  initialData?: {
    _id?: string; // Add ID for edit mode
    day?: HebrewDayName;
    startTime?: string;
    endTime?: string;
    location?: string;
    notes?: string;
    isRecurring?: boolean;
    recurringDays?: HebrewDayName[];
  };
  isOpen?: boolean;
}

interface TimeBlockFormData {
  day: HebrewDayName;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  isRecurring: boolean;
  recurringDays: HebrewDayName[];
}

interface TimeBlockWizardStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isActive: boolean;
}

interface TimeBlockWizardState {
  currentStep: number;
  steps: TimeBlockWizardStep[];
  formData: TimeBlockFormData;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
}

// Define wizard steps following the guide
const WIZARD_STEPS: TimeBlockWizardStep[] = [
  {
    id: 'day-selection',
    title: 'בחירת יום',
    description: 'בחר את הימים ליום הלימוד',
    component: 'DaySelectionStep',
    isComplete: false,
    isActive: true
  },
  {
    id: 'time-range',
    title: 'טווח זמן',
    description: 'הגדר את שעות תחילת וסיום יום הלימוד',
    component: 'TimeRangeStep',
    isComplete: false,
    isActive: false
  },
  {
    id: 'details',
    title: 'פרטים נוספים',
    description: 'מיקום, הערות והגדרות חזרה',
    component: 'DetailsStep',
    isComplete: false,
    isActive: false
  },
  {
    id: 'review',
    title: 'סקירה',
    description: 'בדוק את פרטי יום הלימוד לפני יצירה',
    component: 'ReviewStep',
    isComplete: false,
    isActive: false
  }
];

const TimeBlockCreator: React.FC<TimeBlockCreatorProps> = ({
  teacherId,
  onBlockCreated,
  onCancel,
  initialData,
  isOpen = true
}) => {
  // Determine if this is edit mode
  const isEditMode = !!initialData;
  const { 
    createTimeBlock, 
    updateTimeBlock,
    isLoading, 
    error, 
    clearError,
    currentTeacherSchedule,
    loadTeacherSchedule 
  } = useTimeBlockStore();
  
  const [wizardState, setWizardState] = useState<TimeBlockWizardState>({
    currentStep: 0,
    steps: WIZARD_STEPS,
    formData: {
      day: initialData?.day || HEBREW_DAYS[0],
      startTime: initialData?.startTime || '14:00',
      endTime: initialData?.endTime || '18:00',
      location: initialData?.location || '',
      notes: initialData?.notes || '',
      isRecurring: initialData?.isRecurring || false,
      recurringDays: initialData?.recurringDays || []
    },
    validationErrors: {},
    isSubmitting: false
  });

  // Load teacher schedule when component opens (with error handling)
  // Temporarily disabled to avoid API issues
  // useEffect(() => {
  //   if (isOpen && teacherId && !currentTeacherSchedule) {
  //     loadTeacherSchedule(teacherId).catch(error => {
  //       console.warn('Could not load teacher schedule for conflict detection:', error);
  //       // Continue without schedule data - this disables conflict detection but allows time block creation
  //     });
  //   }
  // }, [isOpen, teacherId, currentTeacherSchedule, loadTeacherSchedule]);

  if (!isOpen) {
    return null;
  }

  // Calculate duration for display
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return endMinutes - startMinutes;
  };

  // Format duration in hours format
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} דקות`;
    } else if (hours === 1 && mins === 0) {
      return 'שעה אחת';
    } else if (hours === 1) {
      return `שעה ו-${mins} דקות`;
    } else if (mins === 0) {
      return `${hours} שעות`;
    } else {
      return `${hours} שעות ו-${mins} דקות`;
    }
  };

  // Update form data
  const updateFormData = (updates: Partial<TimeBlockFormData>) => {
    setWizardState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      validationErrors: {}
    }));
  };

  // Helper function to check if values have changed from initial data
  const hasFormDataChanged = (): boolean => {
    if (!isEditMode || !initialData) return true;
    
    const { formData } = wizardState;
    return (
      formData.day !== initialData.day ||
      formData.startTime !== initialData.startTime ||
      formData.endTime !== initialData.endTime ||
      formData.location !== (initialData.location || '') ||
      formData.notes !== (initialData.notes || '')
    );
  };

  // Validate current step
  const validateStep = (stepIndex: number): boolean => {
    const errors: Record<string, string> = {};
    const { formData } = wizardState;

    switch (stepIndex) {
      case 0: // Day selection
        if (!formData.day) {
          errors.day = 'יש לבחור יום';
        }
        // In edit mode, allow proceeding even if day hasn't changed
        break;
      case 1: // Time range
        if (!formData.startTime) {
          errors.startTime = 'יש להזין שעת התחלה';
        }
        if (!formData.endTime) {
          errors.endTime = 'יש להזין שעת סיום';
        }
        if (formData.startTime && formData.endTime) {
          const duration = calculateDuration(formData.startTime, formData.endTime);
          if (duration <= 0) {
            errors.timeRange = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
          }
          if (duration < 30) {
            errors.timeRange = 'יום לימוד חייב להיות לפחות 30 דקות';
          }

          // Only check for conflicts if day/time has changed, or if not in edit mode
          const shouldCheckConflicts = !isEditMode || (
            initialData && (
              formData.day !== initialData.day ||
              formData.startTime !== initialData.startTime ||
              formData.endTime !== initialData.endTime
            )
          );

          if (shouldCheckConflicts && currentTeacherSchedule?.timeBlocks && currentTeacherSchedule.timeBlocks.length > 0) {
            const newTimeBlock: TimeBlockRequest = {
              day: formData.day,
              startTime: formData.startTime,
              endTime: formData.endTime,
              location: formData.location,
              notes: formData.notes
            };

            // Filter out the current time block being edited to avoid self-conflict
            const timeBlocksToCheck = isEditMode 
              ? currentTeacherSchedule.timeBlocks.filter(block => 
                  !(block.day === initialData?.day && 
                    block.startTime === initialData?.startTime && 
                    block.endTime === initialData?.endTime)
                )
              : currentTeacherSchedule.timeBlocks;

            const conflictValidation = timeBlockService.validateTimeBlockConflicts(
              newTimeBlock,
              timeBlocksToCheck
            );

            if (conflictValidation.hasConflict) {
              const conflictMessage = timeBlockService.getConflictDescription(
                conflictValidation.conflictType,
                conflictValidation.conflictingBlocks,
                newTimeBlock
              );
              errors.timeRange = conflictMessage;
            }
          }
        }
        // In edit mode, allow proceeding even if time hasn't changed
        break;
      case 3: // Review step - final validation including recurring conflicts
        // Skip recurring conflicts check in edit mode if no time/day changes
        if (!isEditMode && formData.isRecurring && formData.recurringDays.length > 0 && currentTeacherSchedule?.timeBlocks && currentTeacherSchedule.timeBlocks.length > 0) {
          const conflictingDays: string[] = [];
          
          for (const day of formData.recurringDays) {
            const newTimeBlock: TimeBlockRequest = {
              day,
              startTime: formData.startTime,
              endTime: formData.endTime,
              location: formData.location,
              notes: formData.notes
            };

            const conflictValidation = timeBlockService.validateTimeBlockConflicts(
              newTimeBlock,
              currentTeacherSchedule.timeBlocks
            );

            if (conflictValidation.hasConflict) {
              conflictingDays.push(day);
            }
          }

          if (conflictingDays.length > 0) {
            errors.submit = `קיימות התנגשות בימים הבאים: ${conflictingDays.join(', ')}. אנא בחר ימים אחרים או שנה את שעות יום הלימוד.`;
          }
        }
        break;
    }

    setWizardState(prev => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  };

  // Navigate to next step
  const nextStep = () => {
    if (validateStep(wizardState.currentStep)) {
      const newSteps = [...wizardState.steps];
      newSteps[wizardState.currentStep].isComplete = true;
      newSteps[wizardState.currentStep].isActive = false;
      
      if (wizardState.currentStep < newSteps.length - 1) {
        newSteps[wizardState.currentStep + 1].isActive = true;
        setWizardState(prev => ({
          ...prev,
          currentStep: prev.currentStep + 1,
          steps: newSteps
        }));
      }
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (wizardState.currentStep > 0) {
      const newSteps = [...wizardState.steps];
      newSteps[wizardState.currentStep].isActive = false;
      newSteps[wizardState.currentStep - 1].isActive = true;
      newSteps[wizardState.currentStep - 1].isComplete = false;
      
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
        steps: newSteps
      }));
    }
  };

  // Submit time block creation or update
  const handleSubmit = async () => {
    if (!validateStep(wizardState.currentStep)) return;

    setWizardState(prev => ({ ...prev, isSubmitting: true }));
    clearError();

    try {
      if (isEditMode && initialData?._id) {
        // Update existing time block
        const timeBlockData: TimeBlockRequest = {
          day: wizardState.formData.day,
          startTime: wizardState.formData.startTime,
          endTime: wizardState.formData.endTime,
          location: wizardState.formData.location,
          notes: wizardState.formData.notes
        };
        
        const result = await updateTimeBlock(initialData._id, timeBlockData);
        if (result) {
          onBlockCreated?.(result);
        }
      } else if (wizardState.formData.isRecurring && wizardState.formData.recurringDays.length > 0) {
        // Create multiple time blocks for recurring days (only in creation mode)
        const results: TimeBlockResponse[] = [];
        for (const day of wizardState.formData.recurringDays) {
          const timeBlockData: TimeBlockRequest = {
            day,
            startTime: wizardState.formData.startTime,
            endTime: wizardState.formData.endTime,
            location: wizardState.formData.location,
            notes: wizardState.formData.notes
          };
          
          const result = await createTimeBlock(teacherId, timeBlockData);
          if (result) {
            results.push(result);
          }
        }
        
        if (results.length > 0) {
          onBlockCreated?.(results);
        }
      } else {
        // Create single time block
        const timeBlockData: TimeBlockRequest = {
          day: wizardState.formData.day,
          startTime: wizardState.formData.startTime,
          endTime: wizardState.formData.endTime,
          location: wizardState.formData.location,
          notes: wizardState.formData.notes
        };
        
        const result = await createTimeBlock(teacherId, timeBlockData);
        if (result) {
          onBlockCreated?.(result);
        }
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} time block:`, error);
      setWizardState(prev => ({
        ...prev,
        validationErrors: { submit: String((error instanceof Error ? error.message : error) || `שגיאה ב${isEditMode ? 'עדכון' : 'יצירת'} יום הלימוד`) }
      }));
    } finally {
      setWizardState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const renderStepContent = () => {
    const { currentStep, formData, validationErrors } = wizardState;

    switch (currentStep) {
      case 0: // Day Selection Step
        return (
          <div className="day-selection-step">
            <h3>בחר יום ליום הלימוד</h3>
            <div className="day-selector">
              {HEBREW_DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  className={`day-button ${formData.day === day ? 'selected' : ''}`}
                  onClick={() => updateFormData({ day })}
                >
                  <Calendar className="day-icon" size={20} />
                  <span>{day}</span>
                </button>
              ))}
            </div>
            {validationErrors.day && (
              <div className="error-message">{validationErrors.day}</div>
            )}
          </div>
        );

      case 1: // Time Range Step
        return (
          <div className="time-range-step">
            <h3>הגדר טווח זמן ליום הלימוד</h3>
            
            {/* Show existing time blocks for the selected day */}
            {currentTeacherSchedule?.timeBlocks && (
              (() => {
                const existingBlocks = currentTeacherSchedule.timeBlocks.filter(
                  block => block.day === formData.day && block.isActive
                );
                
                if (existingBlocks.length > 0) {
                  return (
                    <div className="existing-blocks-info">
                      <h4>ימי לימוד קיימים ביום {formData.day}:</h4>
                      <div className="existing-blocks-list">
                        {existingBlocks.map(block => (
                          <div key={block._id} className="existing-block-item">
                            <Clock size={14} />
                            <span>{block.startTime} - {block.endTime}</span>
                            {block.location && <span>({block.location})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()
            )}
            
            <div className="time-inputs">
              <div className="time-input-group">
                <label>
                  <Clock size={16} />
                  שעת התחלה
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateFormData({ startTime: e.target.value })}
                  className={`time-input ${validationErrors.startTime ? 'error' : ''}`}
                />
                {validationErrors.startTime && (
                  <div className="field-error">{validationErrors.startTime}</div>
                )}
              </div>
              
              <div className="time-separator">-</div>
              
              <div className="time-input-group">
                <label>
                  <Clock size={16} />
                  שעת סיום
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateFormData({ endTime: e.target.value })}
                  className={`time-input ${validationErrors.endTime ? 'error' : ''}`}
                />
                {validationErrors.endTime && (
                  <div className="field-error">{validationErrors.endTime}</div>
                )}
              </div>
            </div>

            {formData.startTime && formData.endTime && (
              <div className="duration-info">
                <div className="duration-display">
                  <Clock size={14} />
                  <span>{formatDuration(calculateDuration(formData.startTime, formData.endTime))}</span>
                </div>
              </div>
            )}

            {validationErrors.timeRange && (
              <div className="error-message">{validationErrors.timeRange}</div>
            )}

          </div>
        );

      case 2: // Details Step
        return (
          <div className="details-step">
            <h3>פרטים נוספים</h3>
            
            <div className="form-group">
              <label>
                <MapPin size={16} />
                מיקום (אופציונלי)
              </label>
              <select
                value={formData.location || ''}
                onChange={(e) => updateFormData({ location: e.target.value })}
                className="select-input"
              >
                <option value="">בחר מיקום</option>
                {VALID_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                הערות (אופציונלי)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="הערות נוספות על יום הלימוד..."
                className="textarea-input"
                rows={3}
              />
            </div>

            {/* Hide recurring options in edit mode */}
            {!isEditMode && (
              <>
                <div className="recurring-toggle">
                  <label className="recurring-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => updateFormData({ isRecurring: e.target.checked })}
                      className="recurring-checkbox"
                    />
                    <div className="recurring-checkbox-custom">
                      <Copy size={16} />
                    </div>
                    <div className="recurring-text">
                      <span className="recurring-title">שכפול לימים נוספים</span>
                      <span className="recurring-description">צור יום לימוד זהה בימים אחרים בשבוع</span>
                    </div>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="recurring-days">
                    <h4>בחר ימים נוספים:</h4>
                    <div className="recurring-day-selector">
                      {HEBREW_DAYS.filter(day => day !== formData.day).map(day => (
                        <label key={day} className="day-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.recurringDays.includes(day)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...formData.recurringDays, day]
                                : formData.recurringDays.filter(d => d !== day);
                              updateFormData({ recurringDays: newDays });
                            }}
                          />
                          <span className="checkbox-label">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 3: // Review Step
        return (
          <div className="review-step">
            <h3>סקירה לפני יצירה</h3>
            <div className="review-summary">
              <div className="summary-section">
                <h4>זמן ומיקום</h4>
                <div className="summary-item">
                  <Calendar size={16} />
                  <span>{formData.day}</span>
                </div>
                <div className="summary-item">
                  <Clock size={16} />
                  <span>{formData.startTime} - {formData.endTime}</span>
                  <span>({formatDuration(calculateDuration(formData.startTime, formData.endTime))})</span>
                </div>
                {formData.location && (
                  <div className="summary-item">
                    <MapPin size={16} />
                    <span>{formData.location}</span>
                  </div>
                )}
              </div>

              {formData.isRecurring && formData.recurringDays.length > 0 && (
                <div className="summary-section">
                  <h4>ימים חוזרים</h4>
                  <div className="recurring-days-list">
                    {formData.recurringDays.map(day => (
                      <span key={day} className="recurring-day-tag">{day}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.notes && (
                <div className="summary-section">
                  <h4>הערות</h4>
                  <div className="summary-item">
                    <span>{formData.notes}</span>
                  </div>
                </div>
              )}
            </div>

            {validationErrors.submit && (
              <div className="error-message">{validationErrors.submit}</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="time-block-creator-overlay">
      <div className="time-block-creator">
        {/* Header */}
        <div className="creator-header">
          <h2>{isEditMode ? 'עריכת יום לימוד' : 'יצירת יום לימוד חדש'}</h2>
          <button 
            type="button"
            className="btn-icon close-btn" 
            onClick={onCancel}
            disabled={wizardState.isSubmitting}
            aria-label="סגור"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button type="button" onClick={clearError}>×</button>
          </div>
        )}

        {/* Progress Steps */}
        <div className="wizard-progress">
          {wizardState.steps.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${step.isActive ? 'active' : ''} ${step.isComplete ? 'completed' : ''}`}
            >
              <div className="step-indicator">
                {step.isComplete ? <Check size={16} /> : index + 1}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Wizard Content */}
        <div className="wizard-content">
          <div className="wizard-step">
            {renderStepContent()}
          </div>
        </div>

        {/* Navigation */}
        <div className="wizard-navigation">
          <button 
            type="button"
            className="nav-btn prev-btn"
            onClick={prevStep}
            disabled={wizardState.currentStep === 0 || wizardState.isSubmitting}
          >
            הקודם
          </button>
          
          {wizardState.currentStep < wizardState.steps.length - 1 ? (
            <button 
              type="button"
              className="nav-btn next-btn"
              onClick={nextStep}
              disabled={wizardState.isSubmitting}
            >
              הבא
            </button>
          ) : (
            <button 
              type="button"
              className="nav-btn create-btn"
              onClick={handleSubmit}
              disabled={wizardState.isSubmitting || isLoading}
            >
              {wizardState.isSubmitting || isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  {isEditMode ? 'מעדכן...' : 'יוצר...'}
                </>
              ) : (
                isEditMode 
                  ? 'עדכן יום לימוד'
                  : wizardState.formData.isRecurring && wizardState.formData.recurringDays.length > 0
                    ? `צור ${wizardState.formData.recurringDays.length} ימי לימוד`
                    : 'צור יום לימוד'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeBlockCreator;