// src/cmps/StudentForm/TheoryLessonAssignmentSection.tsx
import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import { BookOpen, Trash2 } from 'lucide-react';
import { StudentFormData } from '../../constants/formConstants';
import { useTheoryStore } from '../../store/theoryStore';

export function TheoryLessonAssignmentSection() {
  // Get Formik context for form operations
  const { values, setFieldValue, isSubmitting } = useFormikContext<StudentFormData>();
  
  // Get theory lessons from store
  const { theoryLessons, loadTheoryLessons, isLoading: isLoadingTheoryLessons } = useTheoryStore();
  
  // Local state for theory lesson selection
  const [selectedTheoryLessonId, setSelectedTheoryLessonId] = useState('');
  
  // Load theory lessons if needed
  useEffect(() => {
    loadTheoryLessons();
  }, [loadTheoryLessons]);
  
  // Group theory lessons by category for better organization in the dropdown
  const theoryLessonsByCategory = theoryLessons.reduce((acc, lesson) => {
    const category = lesson.category || 'אחר';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(lesson);
    return acc;
  }, {} as Record<string, typeof theoryLessons>);
  
  // Get assigned theory lessons details by ID
  const assignedTheoryLessons = values.theoryLessonAssignments.map((assignment) => {
    const theoryLesson = theoryLessons.find((t) => t._id === assignment.theoryLessonId);
    return {
      id: assignment.theoryLessonId,
      category: theoryLesson?.category || 'שיעור העשרה לא ידוע',
      dayTime: theoryLesson ? formatDayTime(theoryLesson.dayOfWeek, theoryLesson.startTime, theoryLesson.endTime) : '',
      location: theoryLesson?.location || '',
    };
  });
  
  // Format day and time for display
  function formatDayTime(dayOfWeek?: number, startTime?: string, endTime?: string) {
    if (dayOfWeek === undefined || !startTime || !endTime) return '';
    
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const day = days[dayOfWeek] || 'לא ידוע';
    return `יום ${day} ${startTime}-${endTime}`;
  }
  
  // Handle theory lesson selection change
  const handleTheoryLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const theoryLessonId = e.target.value;
    setSelectedTheoryLessonId(theoryLessonId);
    
    // If a valid theory lesson is selected, add it to the assignments
    if (theoryLessonId) {
      // Check if this theory lesson is already assigned
      const isAlreadyAssigned = values.theoryLessonAssignments.some(
        (a) => a.theoryLessonId === theoryLessonId
      );
      
      // Add the theory lesson assignment if not already assigned
      if (!isAlreadyAssigned) {
        const updatedAssignments = [
          ...values.theoryLessonAssignments,
          { theoryLessonId },
        ];
        
        // Update Formik values
        setFieldValue('theoryLessonAssignments', updatedAssignments);
        
        // Update enrollments.theoryLessonIds to stay in sync
        setFieldValue('enrollments.theoryLessonIds', [
          ...values.enrollments.theoryLessonIds,
          theoryLessonId,
        ]);
        
        // Reset selection
        setSelectedTheoryLessonId('');
      }
    }
  };
  
  // Remove theory lesson assignment
  const handleRemoveTheoryLessonAssignment = (theoryLessonId: string) => {
    // Remove from theoryLessonAssignments
    const updatedAssignments = values.theoryLessonAssignments.filter(
      (a) => a.theoryLessonId !== theoryLessonId
    );
    setFieldValue('theoryLessonAssignments', updatedAssignments);
    
    // Remove from enrollments.theoryLessonIds to stay in sync
    const updatedTheoryLessons = values.enrollments.theoryLessonIds.filter(
      (id) => id !== theoryLessonId
    );
    setFieldValue('enrollments.theoryLessonIds', updatedTheoryLessons);
  };

  return (
    <div className='form-section theory-lessons-assignment-section'>
      <h3>שיוך לשיעורי העשרה</h3>

      {/* Display current theory lesson assignments if any */}
      {assignedTheoryLessons.length > 0 && (
        <div className='assigned-theory-lessons'>
          <h4>שיעורי העשרה משויכים</h4>
          <div className='assignments-list'>
            {assignedTheoryLessons.map((theoryLesson) => (
              <div key={theoryLesson.id} className='assignment-card'>
                <div className='assignment-header'>
                  <div className='theory-lesson-name'>
                    <BookOpen size={12} />
                    <span>{theoryLesson.category}</span>
                  </div>
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={() =>
                      handleRemoveTheoryLessonAssignment(theoryLesson.id)
                    }
                    aria-label='הסר שיעור העשרה'
                    disabled={isSubmitting}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className='assignment-details'>
                  {theoryLesson.dayTime && (
                    <div className='day-time'>{theoryLesson.dayTime}</div>
                  )}
                  {theoryLesson.location && (
                    <div className='location'>מיקום: {theoryLesson.location}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new theory lesson assignment */}
      <div className='add-theory-lesson-section'>
        <h4>הוספת שיעור העשרה</h4>

        {/* Theory Lesson Selection - automatically adds when changed */}
        <div className='form-row'>
          <div className='form-group'>
            <label htmlFor='theoryLesson'>בחר שיעור העשרה</label>
            <select
              id='theoryLesson'
              name='theoryLesson'
              value={selectedTheoryLessonId}
              onChange={handleTheoryLessonChange}
              disabled={isLoadingTheoryLessons || isSubmitting}
            >
              <option value=''>בחר שיעור העשרה</option>
              {Object.entries(theoryLessonsByCategory).map(([category, lessons]) => (
                <optgroup key={category} label={category}>
                  {lessons.map((lesson) => (
                    <option key={lesson._id} value={lesson._id}>
                      {formatDayTime(lesson.dayOfWeek, lesson.startTime, lesson.endTime)} - {lesson.location}
                    </option>
                  ))}
                  </optgroup>
              ))}
            </select>
            {isLoadingTheoryLessons && (
              <div className='loading-indicator'>טוען שיעורי העשרה...</div>
            )}
          </div>
        </div>
        {/* No "Add Theory Lesson" button - adding happens directly on selection */}
      </div>
    </div>
  );
}