import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, Clock, MapPin, CheckCircle, AlertCircle, 
  Trash2, Plus, Search, Filter, Star, RotateCcw 
} from 'lucide-react';
import { useFormikContext } from 'formik';
import { StudentFormData } from '../../constants/formConstants';
import { useTeacherStore } from '../../store/teacherStore';
import { useTimeBlockStore } from '../../store/timeBlockStore';
import { ConfirmDialog } from '../ConfirmDialog';
import { 
  AvailableSlot, 
  SlotSearchCriteria, 
  LessonDurationMinutes,
  LESSON_DURATIONS 
} from '../../services/timeBlockService';
import AvailableSlotsFinder from '../TimeBlock/AvailableSlotsFinder';

export interface StudentLessonSchedulerProps {
  newTeacherInfo?: {
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null;
}

interface LessonAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  instrument?: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: LessonDurationMinutes;
  location?: string;
  timeBlockId: string;
  optimalScore?: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
}

export function StudentLessonScheduler({ newTeacherInfo }: StudentLessonSchedulerProps) {
  const { values, setFieldValue, errors, touched, isSubmitting } = useFormikContext<StudentFormData>();
  const { teachers, loadTeachers, isLoading: isLoadingTeachers } = useTeacherStore();
  const { findAvailableSlots, isLoading: isLoadingSlots } = useTimeBlockStore();

  // Local state
  const [showTeacherSelect, setShowTeacherSelect] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [lessonAssignments, setLessonAssignments] = useState<LessonAssignment[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<string>('');
  const [showSlotFinder, setShowSlotFinder] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<LessonDurationMinutes>(60);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load teachers on mount
  useEffect(() => {
    if (teachers.length === 0) {
      loadTeachers();
    }
  }, [teachers.length, loadTeachers]);

  // Helper function to calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  // Initialize lesson assignments from form data with improved persistence
  useEffect(() => {
    if (values.teacherAssignments && values.teacherAssignments.length > 0) {
      const assignments: LessonAssignment[] = values.teacherAssignments.map((assignment, index) => {
        const startTime = assignment.time || '';
        const duration = (assignment.duration as LessonDurationMinutes) || 60;
        const endTime = calculateEndTime(startTime, duration);
        
        // Create unique ID using index, teacherId, day, and time to ensure uniqueness
        const uniqueId = `${assignment.teacherId}-${assignment.day}-${assignment.time}-${index}`;
        
        return {
          id: uniqueId,
          teacherId: assignment.teacherId,
          teacherName: getTeacherName(assignment.teacherId),
          instrument: getTeacherInstrument(assignment.teacherId),
          day: assignment.day || '',
          startTime: startTime,
          endTime: endTime,
          duration: duration,
          location: assignment.location,
          timeBlockId: assignment.scheduleSlotId || '',
          status: 'confirmed' as const,
          notes: assignment.notes
        };
      });
      
      // Only update if assignments actually changed to prevent loops
      if (JSON.stringify(assignments) !== JSON.stringify(lessonAssignments)) {
        setLessonAssignments(assignments);
      }
    } else if (lessonAssignments.length > 0) {
      // Only clear local assignments if form is actually empty and not being updated
      setTimeout(() => {
        if (values.teacherAssignments.length === 0) {
          setLessonAssignments([]);
        }
      }, 50);
    }
  }, [values.teacherAssignments]);

  // Debug logging useEffect
  useEffect(() => {
    console.log('🔍 Form data synchronization check:');
    console.log('📝 Form teacherAssignments:', values.teacherAssignments?.length || 0);
    console.log('🎯 Local assignments:', lessonAssignments.length);
    console.log('👨‍🏫 Teacher IDs in form:', values.teacherIds?.length || 0);
  }, [values.teacherAssignments, lessonAssignments, values.teacherIds]);

  // Get teacher name by ID
  const getTeacherName = (teacherId: string): string => {
    if (teacherId === 'new-teacher' && newTeacherInfo) {
      return newTeacherInfo.fullName;
    }
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.personalInfo?.fullName || 'מורה לא ידוע';
  };

  // Get teacher instrument by ID
  const getTeacherInstrument = (teacherId: string): string | undefined => {
    if (teacherId === 'new-teacher' && newTeacherInfo) {
      return newTeacherInfo.instrument;
    }
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.professionalInfo?.instrument;
  };

  // Handle teacher selection
  const handleTeacherSelect = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setSelectedSlot(null);
    setShowSlotFinder(teacherId !== '' && teacherId !== 'new-teacher');
  };

  // Handle slot selection from AvailableSlotsFinder
  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    
    // Check if the slot has the required properties
    if (!slot.timeBlockId || !slot.possibleStartTime) {
      console.warn('⚠️ Selected slot is missing required properties:', {
        timeBlockId: slot.timeBlockId,
        possibleStartTime: slot.possibleStartTime
      });
    }
  };

  // Add lesson assignment
  const handleAddLesson = () => {
    if (!selectedSlot || !selectedTeacherId) {
      console.log('❌ Missing selectedSlot or selectedTeacherId');
      return;
    }

    // Get the actual start and end times from the slot
    // Handle different property names for time
    const startTime = selectedSlot.possibleStartTime || (selectedSlot as any).startTime || (selectedSlot as any).lessonStartTime;
    const endTime = selectedSlot.possibleEndTime || (selectedSlot as any).endTime || (selectedSlot as any).lessonEndTime;

    if (!startTime) {
      console.error('❌ No start time available in slot:', selectedSlot);
      alert('שגיאה: לא נמצאה שעת התחלה בזמן הנבחר');
      return;
    }

    const newAssignment: LessonAssignment = {
      id: `${selectedTeacherId}-${selectedSlot.day}-${startTime}-${Date.now()}`,
      teacherId: selectedTeacherId,
      teacherName: getTeacherName(selectedTeacherId),
      instrument: getTeacherInstrument(selectedTeacherId),
      day: selectedSlot.day,
      startTime: startTime,
      endTime: endTime || calculateEndTime(startTime, selectedSlot.duration),
      duration: selectedSlot.duration,
      location: selectedSlot.location,
      timeBlockId: selectedSlot.timeBlockId,
      optimalScore: selectedSlot.optimalScore,
      status: 'pending',
      notes: ''
    };

    const updatedAssignments = [...lessonAssignments, newAssignment];
    setLessonAssignments(updatedAssignments);

    // Update form data - ensure all required fields are present
    const formAssignments = updatedAssignments
      .filter(assignment => assignment.startTime) // Only include assignments with valid start times
      .map(assignment => ({
        teacherId: assignment.teacherId,
        scheduleSlotId: assignment.timeBlockId,
        day: assignment.day,
        time: assignment.startTime,
        duration: assignment.duration || 60,
        notes: assignment.notes || ''
      }));

    try {
      setFieldValue('teacherAssignments', formAssignments);
      console.log('✅ Added lesson assignment successfully');
    } catch (error) {
      console.error('❌ setFieldValue(teacherAssignments) failed:', error);
    }

    // Update teacherIds
    const teacherIds = [...new Set(updatedAssignments.map(a => a.teacherId))];
    try {
      setFieldValue('teacherIds', teacherIds);
    } catch (error) {
      console.error('❌ setFieldValue(teacherIds) failed:', error);
    }

    // Validate form data persistence without setTimeout to avoid race conditions
    const validateFormData = () => {
      if (values.teacherAssignments.length === 0 && formAssignments.length > 0) {
        console.log('🚨 FORM DATA LOST! Restoring assignments immediately...');
        setFieldValue('teacherAssignments', formAssignments);
        setFieldValue('teacherIds', teacherIds);
      }
    };
    
    // Immediate validation
    validateFormData();
    
    // Backup validation after a short delay
    setTimeout(validateFormData, 50);

    // Reset selection
    setSelectedSlot(null);
    setSelectedTeacherId('');
    setShowSlotFinder(false);
    setShowTeacherSelect(false);
    
    // Trigger refresh to update conflict detection
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 200);
  };

  // Remove lesson assignment
  const handleRemoveLesson = (assignmentId: string) => {
    setAssignmentToRemove(assignmentId);
    setConfirmDialogOpen(true);
  };

  // Confirm removal
  const confirmRemoveLesson = () => {
    console.log('🗑️ Removing assignment with ID:', assignmentToRemove);
    console.log('📋 Current assignments before removal:', lessonAssignments.map(a => ({ id: a.id, teacher: a.teacherName, time: a.startTime })));
    
    // Find the specific assignment to remove from the local state
    const assignmentToRemoveData = lessonAssignments.find(a => a.id === assignmentToRemove);
    if (!assignmentToRemoveData) {
      console.error('❌ Assignment to remove not found:', assignmentToRemove);
      return;
    }
    
    console.log('🎯 Found assignment to remove:', {
      teacher: assignmentToRemoveData.teacherName,
      day: assignmentToRemoveData.day,
      time: assignmentToRemoveData.startTime
    });

    // Remove from local state
    const updatedAssignments = lessonAssignments.filter(a => a.id !== assignmentToRemove);
    setLessonAssignments(updatedAssignments);

    // Find the corresponding assignment in the form data by matching teacherId, day, and time
    const currentFormAssignments = values.teacherAssignments || [];
    const updatedFormAssignments = currentFormAssignments.filter(formAssignment => {
      const matches = formAssignment.teacherId === assignmentToRemoveData.teacherId &&
                     formAssignment.day === assignmentToRemoveData.day &&
                     formAssignment.time === assignmentToRemoveData.startTime;
      
      if (matches) {
        console.log('🎯 Removing form assignment:', {
          teacher: formAssignment.teacherId,
          day: formAssignment.day,
          time: formAssignment.time
        });
      }
      
      return !matches;
    });

    console.log('📝 Updated form assignments:', updatedFormAssignments.length, 'remaining');
    setFieldValue('teacherAssignments', updatedFormAssignments);

    // Update teacherIds - only include teachers that still have assignments
    const teacherIds = [...new Set(updatedFormAssignments.map(a => a.teacherId))];
    console.log('👨‍🏫 Updated teacher IDs:', teacherIds);
    setFieldValue('teacherIds', teacherIds);

    setConfirmDialogOpen(false);
    setAssignmentToRemove('');
    
    console.log('🗑️ Lesson removed. Updated assignments:', updatedFormAssignments.length);
    console.log('🗑️ Updated teacherIds:', teacherIds);
    
    // CRITICAL FIX: Trigger refresh with delay to ensure form data is persisted
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
      console.log('🔄 Triggered delayed slot refresh after lesson removal');
    }, 500); // Give time for form to auto-save or update
  };

  // Group assignments by teacher
  const assignmentsByTeacher = lessonAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.teacherId]) {
      acc[assignment.teacherId] = [];
    }
    acc[assignment.teacherId].push(assignment);
    return acc;
  }, {} as Record<string, LessonAssignment[]>);

  // Get validation errors
  const hasErrors = touched.teacherAssignments && errors.teacherAssignments;

  return (
    <div className="student-lesson-scheduler">
      <div className="scheduler-header">
        <h3>
          <Calendar size={20} />
          מערכת שיעורים
        </h3>
        <p className="scheduler-description">
          בחר מורים ושעות שיעור עבור התלמיד
        </p>
      </div>

      {/* Validation Errors */}
      {hasErrors && typeof errors.teacherAssignments === 'string' && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{errors.teacherAssignments}</span>
        </div>
      )}

      {/* Current Lesson Assignments */}
      {Object.keys(assignmentsByTeacher).length > 0 && (
        <div className="current-lessons">
          <h4>שיעורים מתוכננים ({lessonAssignments.length})</h4>
          <div className="lessons-grid">
            {Object.entries(assignmentsByTeacher).map(([teacherId, assignments]) => (
              <div key={teacherId} className="teacher-lessons-card">
                <div className="teacher-card-header">
                  <div className="teacher-info">
                    <User size={16} />
                    <div className="teacher-details">
                      <span className="teacher-name">{assignments[0].teacherName}</span>
                      {assignments[0].instrument && (
                        <span className="teacher-instrument">{assignments[0].instrument}</span>
                      )}
                    </div>
                  </div>
                  <div className="lessons-count">
                    {assignments.length} שיעורים
                  </div>
                </div>
                
                <div className="lessons-list">
                  {assignments.map((assignment, assignmentIndex) => (
                    <div key={assignment.id} className={`lesson-card ${assignment.status}`}>
                      <div className="lesson-main-info">
                        <div className="lesson-time">
                          <span className="lesson-day">
                            <Clock size={14} />
                            {assignment.day}
                          </span>
                          <span>{assignment.startTime} - {assignment.endTime}</span>
                        </div>
                        <div className="lesson-duration">
                          {assignment.duration} דקות
                        </div>
                      </div>
                      
                      {assignment.location && (
                        <div className="lesson-location">
                          <MapPin size={12} />
                          <span>{assignment.location}</span>
                        </div>
                      )}
                      
                      {assignment.optimalScore && (
                        <div className="lesson-score">
                          <Star size={12} />
                          <span>ציון: {assignment.optimalScore}/100</span>
                        </div>
                      )}
                      
                      <div className="lesson-actions">
                        <div className={`lesson-status ${assignment.status}`}>
                          {assignment.status === 'pending' && 'ממתין לאישור'}
                          {assignment.status === 'confirmed' && 'מאושר'}
                          {assignment.status === 'cancelled' && 'מבוטל'}
                        </div>
                        <button
                          type="button"
                          className="remove-lesson-btn"
                          onClick={() => handleRemoveLesson(assignment.id)}
                          disabled={isSubmitting}
                          aria-label="הסר שיעור"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Lesson */}
      {!showTeacherSelect && (
        <div className="add-lesson-section">
          <button
            type="button"
            className="add-lesson-btn primary"
            onClick={() => setShowTeacherSelect(true)}
            disabled={isSubmitting}
          >
            <Plus size={16} />
            {lessonAssignments.length > 0 ? 'הוסף שיעור נוסף' : 'הוסף שיעור ראשון'}
          </button>
        </div>
      )}

      {/* Teacher Selection */}
      {showTeacherSelect && (
        <div className="teacher-selection-panel">
          <div className="panel-header">
            <h4>בחירת מורה</h4>
            <p>בחר מורה כדי לראות את השעות הזמינות שלו</p>
          </div>
          
          <div className="form-group">
            <label htmlFor="teacherSelect" className="form-label">
              <User size={16} />
              מורה
            </label>
            <select
              id="teacherSelect"
              className="form-select"
              value={selectedTeacherId}
              onChange={(e) => handleTeacherSelect(e.target.value)}
              disabled={isLoadingTeachers || isSubmitting}
            >
              <option value="">בחר מורה</option>
              {newTeacherInfo && (
                <option value="new-teacher">
                  {newTeacherInfo.fullName}
                  {newTeacherInfo.instrument && ` (${newTeacherInfo.instrument})`}
                  {' (מורה חדש)'}
                </option>
              )}
              {teachers
                .filter(teacher => teacher.isActive)
                .map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.personalInfo.fullName}
                  {teacher.professionalInfo?.instrument && ` (${teacher.professionalInfo.instrument})`}
                </option>
              ))}
            </select>
            {isLoadingTeachers && (
              <div className="loading-indicator">טוען מורים...</div>
            )}
          </div>

          <div className="duration-selection">
            <label className="form-label">
              <Clock size={16} />
              משך השיעור
            </label>
            <div className="duration-buttons">
              {LESSON_DURATIONS.map(duration => (
                <button
                  key={duration}
                  type="button"
                  className={`duration-btn ${selectedDuration === duration ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedDuration(duration);
                    setRefreshTrigger(prev => prev + 1);
                  }}
                >
                  {duration} דקות
                </button>
              ))}
            </div>
            
            {/* Filter and Reset Controls */}
            <div className="duration-controls">
              <button
                type="button"
                className={`filter-toggle ${showAdvancedFilters ? 'active' : ''}`}
                onClick={() => setShowAdvancedFilters(prev => !prev)}
                title="מסננים מתקדמים"
              >
                <Filter size={14} />
                מסננים מתקדמים
              </button>
              
              <button
                type="button"
                className="reset-btn"
                onClick={() => {
                  setSelectedDuration(60);
                  setShowAdvancedFilters(false);
                  setRefreshTrigger(prev => prev + 1);
                }}
                title="איפוס חיפוש"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Slots Finder */}
      {showSlotFinder && selectedTeacherId && selectedTeacherId !== 'new-teacher' && (
        <div className="slots-finder-panel">
          <div className="panel-header">
            <h4>שעות זמינות עבור {getTeacherName(selectedTeacherId)}</h4>
            <p>שיעורי {selectedDuration} דקות - בחר שעה מהרשימה למטה</p>
          </div>
          
          <AvailableSlotsFinder
            teacherId={selectedTeacherId}
            onSlotSelect={handleSlotSelect}
            initialDuration={selectedDuration}
            compact={true}
            maxResults={20}
            selectedSlot={selectedSlot}
            refreshTrigger={refreshTrigger}
            showAdvancedFilters={showAdvancedFilters}
            currentStudentAssignments={lessonAssignments.map(assignment => ({
              teacherId: assignment.teacherId,
              day: assignment.day,
              time: assignment.startTime,
              duration: assignment.duration
            }))}
            key={`${selectedTeacherId}-${selectedDuration}-${refreshTrigger}`}
          />
          
          {selectedSlot && (
            <div className="selected-slot-preview">
              <div className="preview-header">
                <CheckCircle size={16} color="#28a745" />
                <span>שיעור נבחר</span>
              </div>
              <div className="preview-details">
                <div className="preview-item">
                  <Calendar size={14} />
                  <span>{selectedSlot.day}</span>
                </div>
                <div className="preview-item">
                  <Clock size={14} />
                  <span>
                    {(() => {
                      const startTime = selectedSlot.possibleStartTime || (selectedSlot as any).startTime || (selectedSlot as any).lessonStartTime;
                      const endTime = selectedSlot.possibleEndTime || (selectedSlot as any).endTime || (selectedSlot as any).lessonEndTime || (startTime ? calculateEndTime(startTime, selectedSlot.duration) : '');
                      return startTime && endTime ? `${startTime} - ${endTime}` : 'זמן לא זמין';
                    })()}
                  </span>
                </div>
                <div className="preview-item">
                  <span>{selectedSlot.duration} דקות</span>
                </div>
                {selectedSlot.location && (
                  <div className="preview-item">
                    <MapPin size={14} />
                    <span>{selectedSlot.location}</span>
                  </div>
                )}
                {selectedSlot.optimalScore && (
                  <div className="preview-item">
                    <Star size={14} />
                    <span>ציון אופטימלי: {selectedSlot.optimalScore}/100</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showTeacherSelect && (
        <div className="panel-actions">
          {selectedSlot ? (
            <button
                type="button"
                className="confirm-lesson-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚨 BUTTON CLICKED! About to call handleAddLesson');
                  console.log('selectedSlot exists:', !!selectedSlot);
                  console.log('selectedTeacherId exists:', !!selectedTeacherId);
                  handleAddLesson();
                }}
                disabled={isSubmitting}
              >
                <CheckCircle size={16} />
                אשר שיעור
              </button>
          ) : selectedTeacherId === 'new-teacher' ? (
            <div className="new-teacher-notice">
              <AlertCircle size={16} color="#ffc107" />
              <span>עבור מורה חדש, יש לתאם שעות בנפרד</span>
            </div>
          ) : (
            <div className="select-slot-prompt">
              <strong>בחר שעה מהרשימה למעלה</strong>
            </div>
          )}
          
          <button
            type="button"
            className="cancel-selection-btn secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTeacherSelect(false);
              setSelectedTeacherId('');
              setSelectedSlot(null);
              setShowSlotFinder(false);
            }}
            disabled={isSubmitting}
          >
            ביטול
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmRemoveLesson}
        title="הסרת שיעור"
        message="האם אתה בטוח שברצונך להסיר את השיעור הזה?"
        confirmText="הסר"
        cancelText="ביטול"
        type="warning"
      />
    </div>
  );
}

export default StudentLessonScheduler;