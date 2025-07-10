// src/cmps/StudentDetails/sections/TheoryLessonsSection.tsx
import { ChevronDown, ChevronUp, BookOpen, RefreshCw } from 'lucide-react';
import { Student } from '../../../services/studentService';
import { TheoryLesson } from '../../../services/theoryService';
import { useEffect, useState, useRef } from 'react';
import { teacherService } from '../../../services/teacherService';

interface TheoryLessonsSectionProps {
  student: Student;
  theoryLessons: TheoryLesson[];
  theoryLessonsLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onTheoryLessonClick: (theoryLessonId: string) => void;
}

export function TheoryLessonsSection({
  student,
  theoryLessons,
  theoryLessonsLoading,
  isOpen,
  onToggle,
  onTheoryLessonClick,
}: TheoryLessonsSectionProps) {
  // Use a ref to track if the component has already created placeholders
  const placeholdersCreated = useRef(false);
  
  // Create placeholders for theory lessons that haven't loaded yet
  const [placeholderTheoryLessons, setPlaceholderTheoryLessons] = useState<any[]>([]);
  
  // Store teacher names for displaying
  const [teacherNames, setTeacherNames] = useState<Record<string, string>>({});

  // Determine if we have any theory lesson IDs
  // Assuming they will be stored in student.enrollments.theoryLessonIds
  const studentTheoryLessonIds = student && student.enrollments?.theoryLessonIds
    ? student.enrollments.theoryLessonIds.filter(id => id)
    : [];

  const hasTheoryLessons = studentTheoryLessonIds.length > 0;

  // Create placeholder theory lessons only once if needed
  useEffect(() => {
    // Only run this if:
    // 1. We have theory lesson IDs
    // 2. We don't have actual theory lessons
    // 3. We're not currently loading theory lessons
    // 4. We haven't already created placeholders
    if (
      studentTheoryLessonIds.length > 0 &&
      theoryLessons.length === 0 &&
      !theoryLessonsLoading &&
      !placeholdersCreated.current
    ) {
      // Create placeholders based on IDs
      const placeholders = studentTheoryLessonIds.map((id) => ({
        _id: id,
        category: 'שיעור העשרה',
        isPlaceholder: true,
      }));

      setPlaceholderTheoryLessons(placeholders);
      placeholdersCreated.current = true; // Mark that we've created placeholders
    }
  }, [studentTheoryLessonIds, theoryLessons.length, theoryLessonsLoading]);

  // Reset the placeholders created flag when the student changes
  useEffect(() => {
    return () => {
      placeholdersCreated.current = false; // Reset when component unmounts
    };
  }, [student._id]); // Only reset when student changes

  // Load teacher names for theory lessons
  useEffect(() => {
    async function loadTeacherNames() {
      if (!theoryLessons || theoryLessons.length === 0) return;
      
      // Extract unique teacher IDs from theory lessons
      const teacherIds = [...new Set(theoryLessons.map(lesson => lesson.teacherId))];
      
      if (teacherIds.length === 0) return;
      
      try {
        // Fetch teacher data
        const teachers = await teacherService.getTeachersByIds(teacherIds);
        
        // Create a map of teacher IDs to names
        const teacherNameMap: Record<string, string> = {};
        teachers.forEach(teacher => {
          if (teacher && teacher._id && teacher.personalInfo?.fullName) {
            teacherNameMap[teacher._id] = teacher.personalInfo.fullName;
          }
        });
        
        setTeacherNames(teacherNameMap);
      } catch (error) {
        console.error('Failed to load teacher names for theory lessons:', error);
      }
    }
    
    loadTeacherNames();
  }, [theoryLessons]);

  // Determine if we should use placeholder data
  const shouldUsePlaceholders =
    studentTheoryLessonIds.length > 0 &&
    theoryLessons.length === 0 &&
    !theoryLessonsLoading &&
    placeholderTheoryLessons.length > 0;

  // Format day and time for display
  const formatTimeDisplay = (dayOfWeek: number, startTime: string, endTime: string) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const day = days[dayOfWeek] || 'לא ידוע';
    return `יום ${day} ${startTime}-${endTime}`;
  };

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <BookOpen size={16} />
        <span>
          שיעורי העשרה {hasTheoryLessons ? `(${studentTheoryLessonIds.length})` : ''}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {theoryLessonsLoading ? (
            <div className='sd-loading-indicator'>
              <RefreshCw size={16} className='spin' />
              <span>טוען שיעורי העשרה...</span>
            </div>
          ) : !hasTheoryLessons ? (
            <div className='sd-empty-state'>התלמיד אינו משתתף בשיעורי העשרה</div>
          ) : shouldUsePlaceholders ? (
            // Use placeholder data when theory lessons haven't loaded yet
            <div className='sd-theory-lessons-grid'>
              {placeholderTheoryLessons.map((theoryLesson) => (
                <div
                  key={theoryLesson._id}
                  className='sd-theory-lesson-card clickable sd-theory-lesson-placeholder'
                  onClick={() => onTheoryLessonClick(theoryLesson._id)}
                >
                  <BookOpen size={20} />
                  <span>{theoryLesson.category}</span>
                </div>
              ))}
            </div>
          ) : (
            // Use fully loaded theory lessons data
            <div className='sd-theory-lessons-grid'>
              {theoryLessons.map((theoryLesson) => (
                <div
                  key={theoryLesson._id}
                  className='sd-theory-lesson-card clickable'
                  onClick={() => onTheoryLessonClick(theoryLesson._id)}
                >
                  <div className="sd-theory-lesson-header">
                    <BookOpen size={20} />
                    <span className="sd-theory-lesson-category">{theoryLesson.category}</span>
                  </div>
                  
                  <div className="sd-theory-lesson-details">
                    {theoryLesson.teacherId && (
                      <div className="sd-theory-lesson-teacher">
                        <span>מורה: {teacherNames[theoryLesson.teacherId] || 'לא ידוע'}</span>
                      </div>
                    )}
                    
                    {theoryLesson.dayOfWeek !== undefined && theoryLesson.startTime && theoryLesson.endTime && (
                      <div className="sd-theory-lesson-schedule">
                        <span>{formatTimeDisplay(theoryLesson.dayOfWeek, theoryLesson.startTime, theoryLesson.endTime)}</span>
                      </div>
                    )}
                    
                    {theoryLesson.location && (
                      <div className="sd-theory-lesson-location">
                        <span>מיקום: {theoryLesson.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}