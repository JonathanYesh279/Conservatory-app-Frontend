// src/cmps/StudentForm/TheoryLessonAssignmentSection.tsx
import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import { BookOpen, Trash2, User } from 'lucide-react';
import { StudentFormData } from '../../constants/formConstants';
import { useTheoryStore } from '../../store/theoryStore';
import { useTeacherStore } from '../../store/teacherStore';
import { useNavigate } from 'react-router-dom';

export function TheoryLessonAssignmentSection() {
  // Get Formik context for form operations
  const { values, setFieldValue, isSubmitting } = useFormikContext<StudentFormData>();
  
  // Get theory lessons from store
  const { theoryLessons, loadTheoryLessons, isLoading: isLoadingTheoryLessons } = useTheoryStore();
  
  // Get teachers from store
  const { teachers, loadTeachers } = useTeacherStore();
  
  // Navigation
  const navigate = useNavigate();
  
  // Local state for theory lesson selection
  const [selectedTheoryLessonId, setSelectedTheoryLessonId] = useState('');
  
  // Load theory lessons and teachers if needed
  useEffect(() => {
    loadTheoryLessons();
    loadTeachers();
  }, [loadTheoryLessons, loadTeachers]);

  // Helper function to get teacher name
  const getTeacherName = (teacherId: string): string => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher?.personalInfo?.fullName || 'מורה לא ידוע';
  };

  // Handle navigation to theory lesson details
  const handleTheoryLessonClick = (theoryLessonId: string) => {
    navigate(`/theory/${theoryLessonId}`);
  };
  
  // Consolidate theory lessons by recurring pattern (category + dayOfWeek + time + location)
  // This groups identical weekly lessons to show unique options instead of redundant individual instances
  const consolidatedTheoryLessons = theoryLessons.reduce((acc, lesson) => {
    const key = `${lesson.category || 'אחר'}-${lesson.dayOfWeek}-${lesson.startTime}-${lesson.endTime}-${lesson.location}`;
    
    if (!acc[key]) {
      // Store the first instance as the representative lesson for this recurring pattern
      acc[key] = {
        ...lesson,
        allInstanceIds: [lesson._id], // Track all lesson IDs that match this pattern
        representativeId: lesson._id  // ID of the lesson instance we're showing
      };
    } else {
      // Add this lesson ID to the list of instances for this pattern
      acc[key].allInstanceIds.push(lesson._id);
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Group consolidated lessons by category for better organization in the dropdown
  const theoryLessonsByCategory = Object.values(consolidatedTheoryLessons).reduce((acc, lesson) => {
    const category = lesson.category || 'אחר';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(lesson);
    return acc;
  }, {} as Record<string, any[]>);
  
  // Get assigned theory lessons details by ID, grouped by recurring pattern
  const assignedTheoryLessonsMap = values.theoryLessonAssignments.reduce((acc, assignment) => {
    const theoryLesson = theoryLessons.find((t) => t._id === assignment.theoryLessonId);
    if (theoryLesson) {
      // Find which consolidated lesson this assignment belongs to
      const consolidatedLesson = Object.values(consolidatedTheoryLessons).find(
        lesson => lesson.allInstanceIds.includes(assignment.theoryLessonId)
      );
      
      if (consolidatedLesson) {
        const key = consolidatedLesson.representativeId;
        if (!acc[key]) {
          acc[key] = {
            representativeId: key,
            category: theoryLesson.category || 'שיעור העשרה לא ידוע',
            dayTime: formatDayTime(theoryLesson.dayOfWeek, theoryLesson.startTime, theoryLesson.endTime),
            location: theoryLesson.location || '',
            teacherId: theoryLesson.teacherId,
            teacherName: getTeacherName(theoryLesson.teacherId),
            assignedInstances: [],
            totalInstances: consolidatedLesson.allInstanceIds.length
          };
        }
        acc[key].assignedInstances.push(assignment.theoryLessonId);
      }
    }
    return acc;
  }, {} as Record<string, any>);
  
  const assignedTheoryLessons = Object.values(assignedTheoryLessonsMap);
  
  // Format day and time for display
  function formatDayTime(dayOfWeek?: number, startTime?: string, endTime?: string) {
    if (dayOfWeek === undefined || !startTime || !endTime) return '';
    
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const day = days[dayOfWeek] || 'לא ידוע';
    return `יום ${day} ${startTime}-${endTime}`;
  }
  
  // Handle theory lesson selection change
  const handleTheoryLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRepresentativeId = e.target.value;
    setSelectedTheoryLessonId(selectedRepresentativeId);
    
    // If a valid theory lesson is selected, add all instances of this recurring pattern
    if (selectedRepresentativeId) {
      // Find the consolidated lesson by its representative ID
      const consolidatedLesson = Object.values(consolidatedTheoryLessons).find(
        lesson => lesson.representativeId === selectedRepresentativeId
      );
      
      if (consolidatedLesson) {
        // Get all instance IDs for this recurring pattern
        const allInstanceIds = consolidatedLesson.allInstanceIds;
        
        // Check if any of these instances are already assigned
        const alreadyAssignedIds = values.theoryLessonAssignments
          .map(a => a.theoryLessonId)
          .filter(id => allInstanceIds.includes(id));
        
        // Only add instances that aren't already assigned
        const newInstanceIds = allInstanceIds.filter((id: string) => !alreadyAssignedIds.includes(id));
        
        if (newInstanceIds.length > 0) {
          // Create assignments for all new instances
          const newAssignments = newInstanceIds.map((id: string) => ({ theoryLessonId: id }));
          
          const updatedAssignments = [
            ...values.theoryLessonAssignments,
            ...newAssignments,
          ];
          
          // Update Formik values
          setFieldValue('theoryLessonAssignments', updatedAssignments);
          
          // Update enrollments.theoryLessonIds to stay in sync
          setFieldValue('enrollments.theoryLessonIds', [
            ...values.enrollments.theoryLessonIds,
            ...newInstanceIds,
          ]);
          
          console.log(`📚 Added ${newInstanceIds.length} theory lesson instances for recurring pattern:`, {
            category: consolidatedLesson.category,
            dayTime: formatDayTime(consolidatedLesson.dayOfWeek, consolidatedLesson.startTime, consolidatedLesson.endTime),
            location: consolidatedLesson.location,
            totalInstances: allInstanceIds.length,
            newInstances: newInstanceIds.length,
            alreadyAssigned: alreadyAssignedIds.length
          });
        } else {
          console.log('⚠️ All instances of this theory lesson pattern are already assigned');
        }
        
        // Reset selection
        setSelectedTheoryLessonId('');
      }
    }
  };
  
  // Remove theory lesson assignment
  const handleRemoveTheoryLessonAssignment = (theoryLessonId: string) => {
    // Find the consolidated lesson that contains this lesson ID
    const consolidatedLesson = Object.values(consolidatedTheoryLessons).find(
      lesson => lesson.allInstanceIds.includes(theoryLessonId)
    );
    
    if (consolidatedLesson) {
      // Remove ALL instances of this recurring pattern
      const idsToRemove = consolidatedLesson.allInstanceIds;
      
      // Remove from theoryLessonAssignments
      const updatedAssignments = values.theoryLessonAssignments.filter(
        (a) => !idsToRemove.includes(a.theoryLessonId)
      );
      setFieldValue('theoryLessonAssignments', updatedAssignments);
      
      // Remove from enrollments.theoryLessonIds to stay in sync
      const updatedTheoryLessons = values.enrollments.theoryLessonIds.filter(
        (id) => !idsToRemove.includes(id)
      );
      setFieldValue('enrollments.theoryLessonIds', updatedTheoryLessons);
      
      console.log(`🗑️ Removed ${idsToRemove.length} theory lesson instances for recurring pattern:`, {
        category: consolidatedLesson.category,
        dayTime: formatDayTime(consolidatedLesson.dayOfWeek, consolidatedLesson.startTime, consolidatedLesson.endTime),
        location: consolidatedLesson.location,
        removedInstances: idsToRemove.length
      });
    } else {
      // Fallback: remove just the single lesson if consolidation logic fails
      const updatedAssignments = values.theoryLessonAssignments.filter(
        (a) => a.theoryLessonId !== theoryLessonId
      );
      setFieldValue('theoryLessonAssignments', updatedAssignments);
      
      const updatedTheoryLessons = values.enrollments.theoryLessonIds.filter(
        (id) => id !== theoryLessonId
      );
      setFieldValue('enrollments.theoryLessonIds', updatedTheoryLessons);
      
      console.log('🗑️ Removed single theory lesson instance (fallback):', theoryLessonId);
    }
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
              <div key={theoryLesson.representativeId} className='assignment-card clickable'
                   onClick={() => handleTheoryLessonClick(theoryLesson.assignedInstances[0])}>
                <div className='assignment-header'>
                  <div className='theory-lesson-name'>
                    <BookOpen size={12} />
                    <span>{theoryLesson.category}</span>
                    {theoryLesson.totalInstances > 1 && (
                      <span className='instance-count'>
                        ({theoryLesson.assignedInstances.length}/{theoryLesson.totalInstances} שיעורים)
                      </span>
                    )}
                  </div>
                  <button
                    type='button'
                    className='remove-btn'
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click when removing
                      handleRemoveTheoryLessonAssignment(theoryLesson.assignedInstances[0]);
                    }}
                    aria-label='הסר שיעור העשרה'
                    disabled={isSubmitting}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className='assignment-details'>
                  {theoryLesson.teacherName && (
                    <div className='teacher-name'>
                      <User size={12} />
                      <span>מורה: {theoryLesson.teacherName}</span>
                    </div>
                  )}
                  {theoryLesson.dayTime && (
                    <div className='day-time'>{theoryLesson.dayTime}</div>
                  )}
                  {theoryLesson.location && (
                    <div className='location'>מיקום: {theoryLesson.location}</div>
                  )}
                  {theoryLesson.totalInstances > 1 && (
                    <div className='enrollment-info'>
                      רישום לכל השיעורים השבועיים
                    </div>
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
                  {(lessons as any[]).map((lesson: any) => (
                    <option key={lesson.representativeId} value={lesson.representativeId}>
                      {lesson.category} - {lesson.location} | {formatDayTime(lesson.dayOfWeek, lesson.startTime, lesson.endTime)}
                      {getTeacherName(lesson.teacherId) !== 'מורה לא ידוע' && ` | מורה: ${getTeacherName(lesson.teacherId)}`}
                      {lesson.allInstanceIds.length > 1 && ` | ${lesson.allInstanceIds.length} שיעורים`}
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