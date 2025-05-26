// src/cmps/TeacherDetails/sections/TeacherTheoryLessonsSection.tsx
import { ChevronDown, ChevronUp, BookOpen, RefreshCw } from 'lucide-react';
import { Teacher } from '../../../services/teacherService';
import { TheoryLesson } from '../../../services/theoryService';
import { useEffect, useState, useRef } from 'react';
import '../../../styles/components/teacher-details-sections.scss';
// Student service not needed here

interface TeacherTheoryLessonsSectionProps {
  teacher: Teacher;
  theoryLessons: TheoryLesson[];
  theoryLessonsLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onTheoryLessonClick: (theoryLessonId: string) => void;
}

export function TeacherTheoryLessonsSection({
  teacher,
  theoryLessons,
  theoryLessonsLoading,
  isOpen,
  onToggle,
  onTheoryLessonClick,
}: TeacherTheoryLessonsSectionProps) {
  // Use a ref to track if the component has already created placeholders
  const placeholdersCreated = useRef(false);
  
  // Create placeholders for theory lessons that haven't loaded yet
  const [placeholderTheoryLessons, setPlaceholderTheoryLessons] = useState<any[]>([]);
  
  // Store student counts for displaying
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  // Check if the teacher has any theory lessons assigned
  const hasTheoryLessons = theoryLessons && theoryLessons.length > 0;

  // Create placeholder theory lessons only once if needed
  useEffect(() => {
    // Only run this if:
    // 1. We're not currently loading theory lessons
    // 2. We haven't already created placeholders
    // 3. No theory lessons are loaded yet
    if (
      !theoryLessonsLoading &&
      !placeholdersCreated.current &&
      !hasTheoryLessons
    ) {
      // Create generic placeholders since we don't know the IDs yet
      const placeholders = Array(3).fill(null).map((_, index) => ({
        _id: `placeholder-${index}`,
        category: 'שיעור העשרה',
        isPlaceholder: true,
      }));

      setPlaceholderTheoryLessons(placeholders);
      placeholdersCreated.current = true; // Mark that we've created placeholders
    }
  }, [theoryLessons, theoryLessonsLoading, hasTheoryLessons]);

  // Reset the placeholders created flag when the teacher changes
  useEffect(() => {
    return () => {
      placeholdersCreated.current = false; // Reset when component unmounts
    };
  }, [teacher._id]); // Only reset when teacher changes

  // Count students for each theory lesson
  useEffect(() => {
    async function countStudents() {
      if (!theoryLessons || theoryLessons.length === 0) return;
      
      const counts: Record<string, number> = {};
      
      // Extract student counts for each theory lesson
      theoryLessons.forEach(lesson => {
        counts[lesson._id] = lesson.studentIds?.length || 0;
      });
      
      setStudentCounts(counts);
    }
    
    countStudents();
  }, [theoryLessons]);

  // Determine if we should use placeholder data
  const shouldUsePlaceholders =
    !hasTheoryLessons &&
    !theoryLessonsLoading &&
    placeholderTheoryLessons.length > 0;

  // Format day and time for display
  const formatTimeDisplay = (dayOfWeek: number, startTime: string, endTime: string) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const day = days[dayOfWeek] || 'לא ידוע';
    return `יום ${day} ${startTime}-${endTime}`;
  };

  return (
    <div className='section'>
      <div
        className={`section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <BookOpen size={16} />
        <span>
          שיעורי העשרה {hasTheoryLessons ? `(${theoryLessons.length})` : ''}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className='td-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='td-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='td-section-content'>
          {theoryLessonsLoading ? (
            <div className='td-loading-indicator'>
              <RefreshCw size={16} className='spin' />
              <span>טוען שיעורי העשרה...</span>
            </div>
          ) : !hasTheoryLessons && shouldUsePlaceholders ? (
            // Use placeholder data when theory lessons haven't loaded yet
            <div className='td-theory-lessons-grid'>
              {placeholderTheoryLessons.map((theoryLesson) => (
                <div
                  key={theoryLesson._id}
                  className='td-theory-lesson-card td-theory-lesson-placeholder'
                >
                  <BookOpen size={20} />
                  <span>{theoryLesson.category}</span>
                </div>
              ))}
            </div>
          ) : hasTheoryLessons ? (
            // Use fully loaded theory lessons data
            <div className='td-theory-lessons-grid'>
              {theoryLessons.map((theoryLesson) => (
                <div
                  key={theoryLesson._id}
                  className='td-theory-lesson-card clickable'
                  onClick={() => onTheoryLessonClick(theoryLesson._id)}
                >
                  <div className="td-theory-lesson-header">
                    <BookOpen size={20} />
                    <span className="td-theory-lesson-category">{theoryLesson.category}</span>
                  </div>
                  
                  <div className="td-theory-lesson-details">
                    {theoryLesson.dayOfWeek !== undefined && theoryLesson.startTime && theoryLesson.endTime && (
                      <div className="td-theory-lesson-schedule">
                        <span>{formatTimeDisplay(theoryLesson.dayOfWeek, theoryLesson.startTime, theoryLesson.endTime)}</span>
                      </div>
                    )}
                    
                    {theoryLesson.location && (
                      <div className="td-theory-lesson-location">
                        <span>מיקום: {theoryLesson.location}</span>
                      </div>
                    )}
                    
                    <div className="td-theory-lesson-students">
                      <span>תלמידים: {studentCounts[theoryLesson._id] || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='td-empty-state'>המורה אינו מלמד שיעורי העשרה</div>
          )}
        </div>
      )}
    </div>
  );
}