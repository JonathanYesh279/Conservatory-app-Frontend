import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronDown, ChevronUp, Clock, MapPin, User,
<<<<<<< Updated upstream
  Edit, Plus, Star, CheckCircle, AlertCircle
=======
  Edit, Plus, Star, CheckCircle, AlertCircle, RefreshCw
>>>>>>> Stashed changes
} from 'lucide-react';
import { Student } from '../../../services/studentService';
import { useTeacherStore } from '../../../store/teacherStore';
import { useTimeBlockStore } from '../../../store/timeBlockStore';
import { LessonDurationMinutes } from '../../../services/timeBlockService';

interface LessonScheduleSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
  onEditSchedule?: () => void;
}

interface StudentLesson {
  id: string;
  teacherId: string;
  teacherName: string;
  instrument?: string;
  day: string;
  startTime: string;
  endTime: string;
  duration: LessonDurationMinutes;
  location?: string;
  timeBlockId?: string;
  status: 'active' | 'cancelled' | 'completed';
  notes?: string;
}

const HEBREW_DAYS_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function LessonScheduleSection({ 
  student, 
  isOpen, 
  onToggle, 
  onEditSchedule 
}: LessonScheduleSectionProps) {
  const { teachers, loadTeachers } = useTeacherStore();
  const [lessons, setLessons] = useState<StudentLesson[]>([]);
<<<<<<< Updated upstream
=======
  const [isLoading, setIsLoading] = useState(false);
>>>>>>> Stashed changes
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Extract lessons from student data
  useEffect(() => {
    if (student?.teacherIds && teachers.length > 0) {
      const extractedLessons: StudentLesson[] = [];

      // Get lessons from teacher assignments
      if (student.teacherAssignments) {
        student.teacherAssignments.forEach((assignment, index) => {
          const teacher = teachers.find(t => t._id === assignment.teacherId);
          const teacherName = teacher?.personalInfo?.fullName || 'מורה לא ידוע';
          const instrument = teacher?.professionalInfo?.instrument;

<<<<<<< Updated upstream
          // Include both active and inactive lessons
          const lessonStatus = (assignment.isActive === false) ? 'cancelled' : 'active';
          
=======
>>>>>>> Stashed changes
          extractedLessons.push({
            id: assignment.scheduleSlotId || `lesson-${index}`,
            teacherId: assignment.teacherId,
            teacherName,
            instrument,
            day: assignment.day,
            startTime: assignment.time,
            endTime: calculateEndTime(assignment.time, assignment.duration),
            duration: assignment.duration as LessonDurationMinutes,
            location: (assignment as any).location,
            timeBlockId: assignment.scheduleSlotId,
<<<<<<< Updated upstream
            status: lessonStatus,
=======
            status: 'active',
>>>>>>> Stashed changes
            notes: assignment.notes
          });
        });
      }

      // Sort lessons by day and time
      extractedLessons.sort((a, b) => {
        const dayA = HEBREW_DAYS_ORDER.indexOf(a.day);
        const dayB = HEBREW_DAYS_ORDER.indexOf(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return a.startTime.localeCompare(b.startTime);
      });

      setLessons(extractedLessons);
    }
  }, [student, teachers]);

  // Load teachers if needed
  useEffect(() => {
    if (student?.teacherIds?.length > 0 && teachers.length === 0) {
      loadTeachers();
    }
  }, [student?.teacherIds, teachers.length, loadTeachers]);

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Group lessons by day
  const lessonsByDay = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.day]) {
      acc[lesson.day] = [];
    }
    acc[lesson.day].push(lesson);
    return acc;
  }, {} as Record<string, StudentLesson[]>);

  // Calculate statistics
<<<<<<< Updated upstream
  const activeLessons = lessons.filter(lesson => lesson.status === 'active');
  const stats = {
    totalLessons: activeLessons.length,
    totalWeeklyMinutes: activeLessons.reduce((sum, lesson) => sum + lesson.duration, 0),
    uniqueTeachers: new Set(activeLessons.map(lesson => lesson.teacherId)).size,
    daysWithLessons: Object.keys(lessonsByDay).length
  };


  return (
    <div className="sd-section lesson-schedule-section">
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Calendar size={16} />
        <span>
          מערכת שיעורים{' '}
          {stats.totalLessons > 0 && `(${stats.totalLessons})`}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className="sd-toggle-icon" />
        ) : (
          <ChevronDown size={18} className="sd-toggle-icon" />
        )}
      </div>

      {isOpen && (
        <div className="sd-section-content">
=======
  const stats = {
    totalLessons: lessons.length,
    totalWeeklyMinutes: lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
    uniqueTeachers: new Set(lessons.map(lesson => lesson.teacherId)).size,
    daysWithLessons: Object.keys(lessonsByDay).length
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadTeachers();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh lesson data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="details-section lesson-schedule-section">
      <div
        className={`section-header clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <div className="section-title">
          <Calendar size={16} />
          <span>מערכת שיעורים</span>
          {stats.totalLessons > 0 && (
            <span className="lesson-count">({stats.totalLessons})</span>
          )}
        </div>
        <div className="header-actions">
          {isOpen && (
            <>
              <button
                className="refresh-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
                disabled={isLoading}
                title="רענן נתונים"
              >
                <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              </button>
              {onEditSchedule && (
                <button
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSchedule();
                  }}
                  title="ערוך מערכת שיעורים"
                >
                  <Edit size={14} />
                </button>
              )}
            </>
          )}
          {isOpen ? (
            <ChevronUp size={16} className="toggle-icon" />
          ) : (
            <ChevronDown size={16} className="toggle-icon" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="section-content">
>>>>>>> Stashed changes
          {lessons.length === 0 ? (
            <div className="empty-schedule-state">
              <Calendar size={48} color="#ffc107" />
              <div className="empty-content">
                <h4>אין שיעורים מתוכננים</h4>
                <p>התלמיד עדיין לא שויך לשיעורים במערכת</p>
                {onEditSchedule && (
                  <button
                    className="add-lessons-btn"
                    onClick={onEditSchedule}
                  >
                    <Plus size={16} />
                    הוסף שיעורים
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Schedule Statistics */}
              <div className="schedule-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.totalLessons}</span>
                    <span className="stat-label">שיעורים בשבוע</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={16} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.totalWeeklyMinutes}</span>
                    <span className="stat-label">דקות בשבוע</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <User size={16} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.uniqueTeachers}</span>
                    <span className="stat-label">מורים</span>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <CheckCircle size={16} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{stats.daysWithLessons}</span>
<<<<<<< Updated upstream
                    <span className="stat-label">ימים עם שיעורים</span>
=======
                    <span className="stat-label">ימי לימוד</span>
>>>>>>> Stashed changes
                  </div>
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="weekly-schedule">
                <h4>מערכת שבועית</h4>
<<<<<<< Updated upstream
                {Object.keys(lessonsByDay).length === 0 ? (
                  <div className="no-schedule-days">
                    <p>אין שיעורים מתוכננים השבוע</p>
                  </div>
                ) : (
                  <div className="schedule-grid">
                    {HEBREW_DAYS_ORDER.filter(day => {
                      const dayLessons = lessonsByDay[day] || [];
                      return dayLessons.length > 0; // Only show days with lessons (active or inactive)
                    }).map(day => {
                    const dayLessons = lessonsByDay[day] || [];
                    return (
                      <div key={day} className={`day-column has-lessons`}>
                        <div className="day-header">
                          <span className="day-name">{day}</span>
                          <span className="lessons-count">{dayLessons.length}</span>
                        </div>
                        
                        <div className="day-lessons">
                          {dayLessons.map(lesson => (
                            <div key={lesson.id} className={`lesson-slot ${lesson.status}`}>
                              <div className="lesson-time">
                                <Clock size={12} />
                                <span>{lesson.startTime} - {lesson.endTime}</span>
                              </div>
                              
                              <div className="lesson-teacher">
                                <User size={12} />
                                <span>{lesson.teacherName}</span>
                              </div>
                              
                              {lesson.instrument && (
                                <div className="lesson-instrument">
                                  <span>{lesson.instrument}</span>
                                </div>
                              )}
                              
                              {lesson.location && (
                                <div className="lesson-location">
                                  <MapPin size={12} />
                                  <span>{lesson.location}</span>
                                </div>
                              )}
                              
                              <div className="lesson-duration">
                                {lesson.duration} דקות
                              </div>
                              
                              <div className={`lesson-status ${lesson.status}`}>
                                {lesson.status === 'active' && <CheckCircle size={12} />}
                                {lesson.status === 'cancelled' && <AlertCircle size={12} />}
                                <span>
                                  {lesson.status === 'active' && 'פעיל'}
                                  {lesson.status === 'cancelled' && 'מבוטל'}
                                  {lesson.status === 'completed' && 'הושלם'}
                                </span>
                              </div>
                            </div>
                          ))}
=======
                <div className="schedule-grid">
                  {HEBREW_DAYS_ORDER.map(day => {
                    const dayLessons = lessonsByDay[day] || [];
                    return (
                      <div key={day} className={`day-column ${dayLessons.length > 0 ? 'has-lessons' : 'empty'}`}>
                        <div className="day-header">
                          <span className="day-name">{day}</span>
                          {dayLessons.length > 0 && (
                            <span className="lessons-count">{dayLessons.length}</span>
                          )}
                        </div>
                        
                        <div className="day-lessons">
                          {dayLessons.length === 0 ? (
                            <div className="no-lessons">
                              <span>אין שיעורים</span>
                            </div>
                          ) : (
                            dayLessons.map(lesson => (
                              <div key={lesson.id} className={`lesson-slot ${lesson.status}`}>
                                <div className="lesson-time">
                                  <Clock size={12} />
                                  <span>{lesson.startTime} - {lesson.endTime}</span>
                                </div>
                                
                                <div className="lesson-teacher">
                                  <User size={12} />
                                  <span>{lesson.teacherName}</span>
                                </div>
                                
                                {lesson.instrument && (
                                  <div className="lesson-instrument">
                                    <span>{lesson.instrument}</span>
                                  </div>
                                )}
                                
                                {lesson.location && (
                                  <div className="lesson-location">
                                    <MapPin size={12} />
                                    <span>{lesson.location}</span>
                                  </div>
                                )}
                                
                                <div className="lesson-duration">
                                  {lesson.duration} דקות
                                </div>
                                
                                <div className={`lesson-status ${lesson.status}`}>
                                  {lesson.status === 'active' && <CheckCircle size={12} />}
                                  {lesson.status === 'cancelled' && <AlertCircle size={12} />}
                                  <span>
                                    {lesson.status === 'active' && 'פעיל'}
                                    {lesson.status === 'cancelled' && 'מבוטל'}
                                    {lesson.status === 'completed' && 'הושלם'}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
>>>>>>> Stashed changes
                        </div>
                      </div>
                    );
                  })}
<<<<<<< Updated upstream
                  </div>
                )}
=======
                </div>
>>>>>>> Stashed changes
              </div>

              {/* Last Updated */}
              <div className="section-footer">
                <div className="last-updated">
                  <span>עודכן לאחרונה: {lastUpdated.toLocaleString('he-IL')}</span>
                </div>
                {onEditSchedule && (
                  <button
                    className="edit-schedule-btn"
                    onClick={onEditSchedule}
                  >
                    <Edit size={14} />
                    ערוך מערכת שיעורים
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default LessonScheduleSection;