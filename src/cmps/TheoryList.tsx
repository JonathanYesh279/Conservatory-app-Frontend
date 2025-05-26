// src/cmps/TheoryList.tsx
import { TheoryLesson } from '../services/theoryService';
import { Teacher } from '../services/teacherService';
import { TheoryPreview } from './TheoryPreview';
import { BookOpen } from 'lucide-react';
import { useMemo } from 'react';

interface TheoryListProps {
  theoryLessons: TheoryLesson[];
  isLoading: boolean;
  teachers: Teacher[];
  onEdit?: (theoryLessonId: string) => void;
  onView: (theoryLessonId: string) => void;
  onRemove?: (theoryLessonId: string) => void;
}

export function TheoryList({
  theoryLessons,
  isLoading,
  teachers,
  onEdit,
  onView,
  onRemove,
}: TheoryListProps) {
  // Group theory lessons by date with today's lessons first
  const groupedTheoryLessons = useMemo(() => {
    if (!theoryLessons.length) return [];

    // Get today's date as YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Group theory lessons by date
    const dateGroups = theoryLessons.reduce((groups, theoryLesson) => {
      const date = theoryLesson.date;
      if (!groups[date]) {
        groups[date] = {
          date,
          theoryLessons: [],
          isToday: date === today,
        };
      }
      groups[date].theoryLessons.push(theoryLesson);
      return groups;
    }, {} as Record<string, { date: string; theoryLessons: TheoryLesson[]; isToday: boolean }>);

    // Sort theory lessons within each group by start time
    Object.values(dateGroups).forEach((group) => {
      group.theoryLessons.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Convert to array and sort with today first, then by date
    return Object.values(dateGroups).sort((a, b) => {
      // Today's theory lessons first
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;

      // Then by date (ascending)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [theoryLessons]);

  if (isLoading && theoryLessons.length === 0) {
    return <div className='loading-state'>טוען שיעורי תאוריה...</div>;
  }

  if (theoryLessons.length === 0) {
    return (
      <div className='empty-state'>
        <p>לא נמצאו שיעורי תאוריה להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף שיעורים חדשים</p>
      </div>
    );
  }

  // Format date to display in Hebrew
  const formatDateHeader = (dateStr: string, isToday: boolean) => {
    if (isToday) {
      return 'שיעורי תאוריה היום';
    }

    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get teacher name by id
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    return teacher ? teacher.personalInfo.fullName : 'מדריך לא מוגדר';
  };

  return (
    <div className='theory-list-container'>
      {groupedTheoryLessons.map(({ date, theoryLessons, isToday }) => (
        <div
          key={date}
          className={`theory-date-group ${isToday ? 'today-group' : ''}`}
        >
          <div className='date-header'>
            <BookOpen size={18} />
            <h2>{formatDateHeader(date, isToday)}</h2>
          </div>

          <div className='theory-grid'>
            {theoryLessons.map((theoryLesson) => (
              <TheoryPreview
                key={theoryLesson._id}
                theoryLesson={theoryLesson}
                teacherName={getTeacherName(theoryLesson.teacherId)}
                onEdit={onEdit}
                onView={onView}
                onRemove={onRemove}
                isToday={isToday}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}