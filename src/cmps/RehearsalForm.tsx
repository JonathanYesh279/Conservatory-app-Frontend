// src/cmps/RehearsalForm.tsx
import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Repeat } from 'lucide-react'
import { Rehearsal } from '../services/rehearsalService'
import { useRehearsalStore } from '../store/rehearsalStore'
import { useOrchestraStore } from '../store/orchestraStore'
import { useSchoolYearStore } from '../store/schoolYearStore'

interface RehearsalFormData {
  _id?: string
  groupId: string
  date: string
  startTime: string
  endTime: string
  location: string
  notes?: string
  isActive: boolean
  schoolYearId: string
}

interface BulkRehearsalData {
  orchestraId: string
  startDate: string
  endDate: string
  dayOfWeek: number
  startTime: string
  endTime: string
  location: string
  notes?: string
  excludeDates: string[]
  schoolYearId: string
}

interface RehearsalFormProps {
  isOpen: boolean
  onClose: () => void
  rehearsal: Rehearsal | null
  orchestraId: string
  onSave?: () => void
}

export function RehearsalForm({
  isOpen,
  onClose,
  rehearsal,
  orchestraId,
  onSave,
}: RehearsalFormProps) {
  const { saveRehearsal, bulkCreateRehearsals, isLoading, error, clearError } = useRehearsalStore()
  const { selectedOrchestra } = useOrchestraStore()
  const { currentSchoolYear } = useSchoolYearStore()
  
  // Get current school year ID
  const currentSchoolYearId = currentSchoolYear?._id || '';
  
  // Form state
  const [formData, setFormData] = useState<RehearsalFormData>({
    groupId: orchestraId,
    date: formatDateForInput(new Date()),
    startTime: '16:00',
    endTime: '18:00',
    location: 'אולם חזרות ראשי',
    notes: '',
    isActive: true,
    schoolYearId: currentSchoolYearId
  })

  // Bulk scheduling state
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [bulkData, setBulkData] = useState<BulkRehearsalData>({
    orchestraId: orchestraId,
    startDate: formatDateForInput(new Date()),
    endDate: formatDateForInput(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)),
    dayOfWeek: new Date().getDay(),
    startTime: '16:00',
    endTime: '18:00',
    location: 'אולם חזרות ראשי',
    notes: '',
    excludeDates: [],
    schoolYearId: currentSchoolYearId
  })
  
  // Excluded dates for bulk scheduling
  const [excludedDate, setExcludedDate] = useState('')
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Helper to format date for the input field
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // Initialize form data when editing an existing rehearsal
  useEffect(() => {
    // Cannot be in bulk mode when editing
    if (rehearsal?._id) {
      setIsBulkMode(false)
    }

    if (rehearsal?._id) {
      setFormData({
        _id: rehearsal._id,
        groupId: rehearsal.groupId,
        date: rehearsal.date,
        startTime: rehearsal.startTime,
        endTime: rehearsal.endTime,
        location: rehearsal.location || '',
        notes: rehearsal.notes || '',
        isActive: rehearsal.isActive !== false,
        schoolYearId: rehearsal.schoolYearId || currentSchoolYearId
      })
    } else {
      // Reset form for new rehearsal
      const today = new Date()
      
      // Basic form data
      setFormData({
        groupId: orchestraId,
        date: formatDateForInput(today),
        startTime: '16:00',
        endTime: '18:00',
        location: 'אולם חזרות ראשי',
        notes: '',
        isActive: true,
        schoolYearId: currentSchoolYearId
      })
      
      // Bulk data with defaults
      setBulkData({
        orchestraId: orchestraId,
        startDate: formatDateForInput(today),
        endDate: formatDateForInput(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
        dayOfWeek: today.getDay(),
        startTime: '16:00',
        endTime: '18:00',
        location: 'אולם חזרות ראשי',
        notes: '',
        excludeDates: [],
        schoolYearId: currentSchoolYearId
      })
    }

    setErrors({})
    if (clearError) clearError()
  }, [rehearsal, isOpen, clearError, orchestraId, currentSchoolYearId])

  // Handle input changes for single rehearsal
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Mirror changes to bulk form if applicable
    if (['startTime', 'endTime', 'location', 'notes'].includes(name)) {
      setBulkData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  // Handle input changes for bulk creation
  const handleBulkChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setBulkData(prev => ({
      ...prev,
      [name]: value
    }))

    // Mirror changes to single form if applicable
    if (['startTime', 'endTime', 'location', 'notes'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  // Handle day of week selection
  const handleDayOfWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBulkData(prev => ({
      ...prev,
      dayOfWeek: parseInt(e.target.value, 10)
    }))
  }
  
  // Toggle between single and bulk modes
  const toggleBulkMode = () => {
    // Can't switch to bulk mode when editing
    if (rehearsal?._id) return
    
    setIsBulkMode(!isBulkMode)
  }
  
  // Add date to excluded dates
  const addExcludedDate = () => {
    if (!excludedDate) return
    
    if (!bulkData.excludeDates.includes(excludedDate)) {
      setBulkData(prev => ({
        ...prev,
        excludeDates: [...prev.excludeDates, excludedDate]
      }))
      setExcludedDate('')
    }
  }
  
  // Remove date from excluded dates
  const removeExcludedDate = (dateToRemove: string) => {
    setBulkData(prev => ({
      ...prev,
      excludeDates: prev.excludeDates.filter(date => date !== dateToRemove)
    }))
  }
  
  // Get day name in Hebrew
  const getDayName = (dayIndex: number): string => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    return days[dayIndex]
  }

  // Validate single rehearsal form
  const validateSingleForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields validation
    if (!formData.date) {
      newErrors['date'] = 'תאריך החזרה הוא שדה חובה'
    }

    if (!formData.startTime) {
      newErrors['startTime'] = 'שעת התחלה היא שדה חובה'
    }

    if (!formData.endTime) {
      newErrors['endTime'] = 'שעת סיום היא שדה חובה'
    }

    if (!formData.location) {
      newErrors['location'] = 'מיקום החזרה הוא שדה חובה'
    }

    // Validate that end time is after start time
    if (formData.startTime && formData.endTime) {
      if (formData.endTime <= formData.startTime) {
        newErrors['endTime'] = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Validate bulk creation form
  const validateBulkForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!bulkData.startDate) {
      newErrors['startDate'] = 'תאריך התחלה הוא שדה חובה'
    }
    
    if (!bulkData.endDate) {
      newErrors['endDate'] = 'תאריך סיום הוא שדה חובה'
    }
    
    if (bulkData.startDate && bulkData.endDate) {
      if (new Date(bulkData.endDate) < new Date(bulkData.startDate)) {
        newErrors['endDate'] = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה'
      }
    }
    
    if (!bulkData.startTime) {
      newErrors['startTime'] = 'שעת התחלה היא שדה חובה'
    }
    
    if (!bulkData.endTime) {
      newErrors['endTime'] = 'שעת סיום היא שדה חובה'
    }
    
    if (bulkData.startTime && bulkData.endTime) {
      if (bulkData.endTime <= bulkData.startTime) {
        newErrors['endTime'] = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
      }
    }
    
    if (!bulkData.location) {
      newErrors['location'] = 'מיקום החזרה הוא שדה חובה'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate based on current mode
    const isValid = isBulkMode ? validateBulkForm() : validateSingleForm()
    if (!isValid) return

    try {
      if (isBulkMode) {
        // Ensure all required fields are present, especially schoolYearId
        const bulkCreateData: BulkRehearsalData = {
          ...bulkData,
          orchestraId: bulkData.orchestraId || orchestraId,
          schoolYearId: bulkData.schoolYearId || currentSchoolYearId,
          excludeDates: bulkData.excludeDates || []
        }
        
        console.log('Sending bulk create data:', bulkCreateData)
        
        // Bulk create
        await bulkCreateRehearsals(bulkCreateData)
      } else {
        // Ensure schoolYearId is set
        const singleRehearsalData: RehearsalFormData = {
          ...formData,
          schoolYearId: formData.schoolYearId || currentSchoolYearId
        }
        
        // Single rehearsal
        await saveRehearsal(singleRehearsalData)
      }

      // Call optional onSave callback
      if (onSave) {
        onSave()
      }

      // Close the form after successful save
      onClose()
    } catch (err) {
      console.error('Error saving rehearsal:', err)
      // Show the error to the user
      setErrors({
        form: err instanceof Error ? err.message : 'Error saving rehearsal'
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className='rehearsal-form'>
      <div className='overlay' onClick={onClose}></div>
      <div className='form-modal'>
        <button
          className='btn-icon close-btn'
          onClick={onClose}
          aria-label='סגור'
        >
          <X size={20} />
        </button>

        <h2>{rehearsal?._id ? 'עריכת חזרה' : 'הוספת חזרה חדשה'}</h2>
        <h3>{selectedOrchestra?.name}</h3>

        {error && <div className='error-message'>{error}</div>}
        {errors.form && <div className='error-message'>{errors.form}</div>}
        
        {/* Mode Toggle - Only visible when creating new */}
        {!rehearsal?._id && (
          <div className='mode-toggle'>
            <button
              type="button"
              className={`toggle-btn ${!isBulkMode ? 'active' : ''}`}
              onClick={() => setIsBulkMode(false)}
            >
              חזרה בודדת
            </button>
            <button
              type="button"
              className={`toggle-btn ${isBulkMode ? 'active' : ''}`}
              onClick={() => setIsBulkMode(true)}
            >
              חזרות מרובות
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Rehearsal Information Section */}
          <div className='form-section'>
            <h3>פרטי חזרה</h3>

            {!isBulkMode ? (
              /* Single Rehearsal Form */
              <>
                {/* Date */}
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
                      value={formData.date}
                      onChange={handleChange}
                      className={errors['date'] ? 'is-invalid' : ''}
                      required
                    />
                    {errors['date'] && (
                      <div className='form-error'>{errors['date']}</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Bulk Rehearsal Creation Form */
              <>
                {/* Date Range */}
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
                      value={bulkData.startDate}
                      onChange={handleBulkChange}
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
                      value={bulkData.endDate}
                      onChange={handleBulkChange}
                      className={errors['endDate'] ? 'is-invalid' : ''}
                      required
                    />
                    {errors['endDate'] && (
                      <div className='form-error'>{errors['endDate']}</div>
                    )}
                  </div>
                </div>
                
                {/* Day of Week */}
                <div className='form-row full-width'>
                  <div className='form-group'>
                    <label htmlFor='dayOfWeek'>
                      <Repeat size={16} className='icon' />
                      יום בשבוע *
                    </label>
                    <select
                      id='dayOfWeek'
                      name='dayOfWeek'
                      value={bulkData.dayOfWeek}
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
                      חזרות ייווצרו בכל יום {getDayName(bulkData.dayOfWeek)} בטווח התאריכים שנבחר
                    </div>
                  </div>
                </div>
                
                {/* Excluded Dates */}
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
                        min={bulkData.startDate}
                        max={bulkData.endDate}
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
                    
                    {bulkData.excludeDates.length > 0 && (
                      <div className='excluded-dates-list'>
                        <div className='list-title'>תאריכים שיידלגו:</div>
                        <ul>
                          {bulkData.excludeDates.map(date => (
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
                  value={isBulkMode ? bulkData.startTime : formData.startTime}
                  onChange={isBulkMode ? handleBulkChange : handleChange}
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
                  value={isBulkMode ? bulkData.endTime : formData.endTime}
                  onChange={isBulkMode ? handleBulkChange : handleChange}
                  className={errors['endTime'] ? 'is-invalid' : ''}
                  required
                />
                {errors['endTime'] && (
                  <div className='form-error'>{errors['endTime']}</div>
                )}
              </div>
            </div>

            {/* Location - Common for both modes */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='location'>
                  <MapPin size={16} className='icon' />
                  מיקום *
                </label>
                <input
                  type='text'
                  id='location'
                  name='location'
                  value={isBulkMode ? bulkData.location : formData.location}
                  onChange={isBulkMode ? handleBulkChange : handleChange}
                  className={errors['location'] ? 'is-invalid' : ''}
                  required
                />
                {errors['location'] && (
                  <div className='form-error'>{errors['location']}</div>
                )}
              </div>
            </div>

            {/* Notes - Common for both modes */}
            <div className='form-row full-width'>
              <div className='form-group'>
                <label htmlFor='notes'>הערות</label>
                <textarea
                  id='notes'
                  name='notes'
                  value={isBulkMode ? bulkData.notes : formData.notes}
                  onChange={isBulkMode ? handleBulkChange : handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Hidden fields */}
            {!isBulkMode && (
              <input
                type='hidden'
                name='schoolYearId'
                value={formData.schoolYearId}
              />
            )}
            
            {isBulkMode && (
              <input
                type='hidden'
                name='schoolYearId'
                value={bulkData.schoolYearId}
              />
            )}
          </div>

          {/* Form Actions */}
          <div className='form-actions'>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'שומר...' : isBulkMode 
                ? 'יצירת חזרות מרובות' 
                : rehearsal?._id ? 'עדכון' : 'הוספה'}
            </button>

            <button type='button' className='btn secondary' onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}