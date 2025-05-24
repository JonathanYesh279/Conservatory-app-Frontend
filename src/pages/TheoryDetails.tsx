// src/pages/TheoryDetails.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Users, Calendar } from 'lucide-react';
import { TheoryForm } from '../cmps/TheoryForm';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { useTheoryStore } from '../store/theoryStore';
import { useTeacherStore } from '../store/teacherStore';
import { useStudentStore } from '../store/studentStore';
// DAYS_OF_WEEK not needed here
import { useToast } from '../cmps/Toast';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../cmps/Header';

export function TheoryDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theoryLessonId } = useParams<{ theoryLessonId: string }>();
  const { addToast } = useToast();
  // Auth is needed but user variable not used
  useAuth();
  // Dropdown ref not needed
  

  const {
    selectedTheoryLesson,
    isLoading,
    error,
    loadTheoryLessonById,
    saveTheoryLesson,
    removeTheoryLesson,
    updateAttendance,
  } = useTheoryStore();

  const { teachers, loadTeachers } = useTeacherStore();
  const { getStudentsByIds } = useStudentStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [attendance, setAttendance] = useState<{
    present: string[];
    absent: string[];
  }>({ present: [], absent: [] });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filter for theory teachers only
  const theoryTeachers = teachers.filter((teacher) =>
    teacher.roles?.includes('מורה תאוריה')
  );

  // Load theory lesson and teachers on mount
  useEffect(() => {
    if (theoryLessonId) {
      loadTheoryLessonById(theoryLessonId);
      loadTeachers();
    }
  }, [theoryLessonId, loadTheoryLessonById, loadTeachers]);

  // Load students when theory lesson changes
  useEffect(() => {
    async function loadStudents() {
      if (selectedTheoryLesson?.studentIds?.length) {
        setIsLoadingStudents(true);
        try {
          const fetchedStudents = await getStudentsByIds(
            selectedTheoryLesson.studentIds
          );
          setStudents(fetchedStudents);
        } catch (err) {
          console.error('Error loading students:', err);
        } finally {
          setIsLoadingStudents(false);
        }
      } else {
        setStudents([]);
      }
    }

    loadStudents();
  }, [selectedTheoryLesson, getStudentsByIds]);

  // Set attendance state when theory lesson changes
  useEffect(() => {
    if (selectedTheoryLesson?.attendance) {
      setAttendance({
        present: selectedTheoryLesson.attendance.present || [],
        absent: selectedTheoryLesson.attendance.absent || [],
      });
    } else {
      setAttendance({ present: [], absent: [] });
    }
    setHasChanges(false);
    setSaveSuccess(false);
  }, [selectedTheoryLesson]);


  // Get teacher name
  const getTeacherName = () => {
    if (!selectedTheoryLesson) return 'לא ידוע';
    const teacher = teachers.find((t) => t._id === selectedTheoryLesson.teacherId);
    return teacher ? teacher.personalInfo.fullName : 'לא ידוע';
  };

  // Handle theory lesson update
  const handleUpdate = async (theoryLessonData: any) => {
    try {
      await saveTheoryLesson(theoryLessonData);
      
      // Show success toast
      addToast({
        type: 'success',
        message: 'שיעור התאוריה עודכן בהצלחה',
      });
      
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error updating theory lesson:', err);
      
      // Show error toast
      addToast({
        type: 'danger',
        message: 'אירעה שגיאה בעדכון שיעור התאוריה',
      });
      
      throw err;
    }
  };

  // Handle theory lesson deletion
  const handleDelete = async () => {
    if (!theoryLessonId) return;

    try {
      await removeTheoryLesson(theoryLessonId);
      
      // Show success toast
      addToast({
        type: 'success',
        message: 'שיעור התאוריה נמחק בהצלחה',
      });
      
      navigate('/theory');
    } catch (err) {
      console.error('Error deleting theory lesson:', err);
      
      // Show error toast
      addToast({
        type: 'danger',
        message: 'אירעה שגיאה במחיקת שיעור התאוריה',
      });
    } finally {
      setConfirmDelete(false);
    }
  };

  // Handle attendance update
  const handleAttendanceUpdate = async () => {
    if (!theoryLessonId || !selectedTheoryLesson) return;

    setIsSaving(true);

    try {
      await updateAttendance(theoryLessonId, attendance);
      
      // Show success toast
      addToast({
        type: 'success',
        message: 'נוכחות עודכנה בהצלחה',
      });
      
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Reload the theory lesson to get updated data
      await loadTheoryLessonById(theoryLessonId);
    } catch (err) {
      console.error('Error updating attendance:', err);
      
      // Show error toast
      addToast({
        type: 'danger',
        message: 'אירעה שגיאה בעדכון הנוכחות',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle attendance change for a student
  const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
    setAttendance((prev) => {
      // Create copies of the arrays
      const present = [...prev.present];
      const absent = [...prev.absent];

      // Remove from both arrays first
      const presentIndex = present.indexOf(studentId);
      if (presentIndex !== -1) present.splice(presentIndex, 1);

      const absentIndex = absent.indexOf(studentId);
      if (absentIndex !== -1) absent.splice(absentIndex, 1);

      // Add to the appropriate array
      if (isPresent) {
        present.push(studentId);
      } else {
        absent.push(studentId);
      }

      return { present, absent };
    });
    
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // Calculate duration function - kept for future use
  // const calculateDuration = (startTime: string, endTime: string) => {
  //   const [startHours, startMinutes] = startTime.split(':').map(Number);
  //   const [endHours, endMinutes] = endTime.split(':').map(Number);

  //   const start = startHours * 60 + startMinutes;
  //   const end = endHours * 60 + endMinutes;
  //   const durationMinutes = end - start;

  //   const hours = Math.floor(durationMinutes / 60);
  //   const minutes = durationMinutes % 60;

  //   if (hours === 0) {
  //     return `${minutes} דקות`;
  //   } else if (hours === 1 && minutes === 0) {
  //     return 'שעה אחת';
  //   } else if (hours === 1) {
  //     return `שעה ו-${minutes} דקות`;
  //   } else if (minutes === 0) {
  //     return `${hours} שעות`;
  //   } else {
  //     return `${hours} שעות ו-${minutes} דקות`;
  //   }
  // };

  if (isLoading) {
    return <div className='loading-state'>טוען שיעור תאוריה...</div>;
  }

  if (error) {
    return <div className='error-message'>{error}</div>;
  }

  if (!selectedTheoryLesson) {
    return <div className='not-found'>שיעור התאוריה לא נמצא</div>;
  }

  
  // Handle back navigation
  const handleBack = () => {
    // Check if we navigated from the theory index
    if (location.key) {
      navigate(-1); // Go back to previous page
    } else {
      navigate('/theory'); // Fallback to theory index
    }
  };
  

  return (
    <div className='app-container'>
      <Header />
      <main className='main-content'>
        <div className='theory-details'>
          <div className='theory-details-page'>
            <div className='theory-card-container'>
              <div className='card-content'>
            {/* Theory Header */}
            <div className='theory-header'>
              <button
                className='back-button'
                onClick={handleBack}
                aria-label='חזור'
              >
                <ArrowLeft className='lucide lucide-arrow-left' />
              </button>

              <div className='header-title'>
                <h2>שיעור תאוריה</h2>
                <div className='date-display'>
                  <Calendar size={18} />
                  <span>{formatDate(selectedTheoryLesson.date)}</span>
                </div>
              </div>

              <div className='header-actions'>
                <button
                  className='action-btn edit'
                  onClick={() => setIsFormOpen(true)}
                  aria-label='ערוך'
                >
                  <Edit size={16} />
                  עריכה
                </button>
                <button
                  className='action-btn delete'
                  onClick={() => setConfirmDelete(true)}
                  aria-label='מחק'
                >
                  <Trash2 size={16} />
                  מחיקה
                </button>
              </div>
            </div>

            {/* Theory Info */}
            <div className='theory-info-card'>
              <h3>{selectedTheoryLesson.category || 'שיעור תאוריה'}</h3>
              <div className='theory-details-row'>
                <div className='detail-item'>
                  <span className='detail-label'>מורה:</span>
                  <span className='detail-value'>{getTeacherName()}</span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>מיקום:</span>
                  <span className='detail-value'>{selectedTheoryLesson.location}</span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>זמן:</span>
                  <span className='detail-value'>
                    {selectedTheoryLesson.startTime} - {selectedTheoryLesson.endTime}
                  </span>
                </div>
              </div>

              {selectedTheoryLesson.notes && (
                <div className='theory-notes'>
                  <span className='notes-label'>הערות:</span>
                  <p className='notes-content'>{selectedTheoryLesson.notes}</p>
                </div>
              )}

              {selectedTheoryLesson.syllabus && (
                <div className='theory-syllabus'>
                  <span className='syllabus-label'>סילבוס:</span>
                  <p className='syllabus-content'>{selectedTheoryLesson.syllabus}</p>
                </div>
              )}
            </div>

            {/* Attendance Section */}
            <div className='attendance-section'>
              <div className='attendance-header'>
                <h3>
                  <Users size={18} />
                  נוכחות תלמידים
                </h3>
              </div>
              
              {/* Students List */}
              <div className='students-list-container'>
                {isLoadingStudents ? (
                  <div className='loading-students'>טוען רשימת תלמידים...</div>
                ) : students.length > 0 ? (
                  <ul className='students-list'>
                    {students.map((student) => {
                      const isPresent = attendance.present.includes(student._id);
                      
                      return (
                        <li
                          key={student._id}
                          className={`student-item ${isPresent ? 'present' : ''}`}
                        >
                          <div className='student-info'>
                            <div className='student-name'>
                              {student.personalInfo.fullName}
                            </div>
                            <div className='student-instrument'>
                              {student.academicInfo.instrumentProgress?.[0]?.instrumentName || student.academicInfo.instrument || 'לא מוגדר'}
                            </div>
                          </div>
                          
                          <label className='toggle-switch'>
                            <input
                              type='checkbox'
                              checked={isPresent}
                              onChange={() => handleAttendanceChange(student._id, !isPresent)}
                            />
                            <span className='toggle-slider'></span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className='empty-students'>
                    אין תלמידים רשומים לשיעור זה
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className='attendance-footer'>
              {saveSuccess && (
                <span className='save-success'>הנוכחות עודכנה בהצלחה!</span>
              )}

              <button
                className='save-attendance-btn'
                onClick={handleAttendanceUpdate}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? 'שומר...' : 'עדכן נוכחות'}
              </button>
            </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Theory Modal */}
      <TheoryForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        onBulkSubmit={async (data) => {
          // Not needed in edit mode but required by interface
          console.log("Bulk submit not applicable in details view", data);
          return { insertedCount: 0, theoryLessonIds: [] };
        }}
        theoryLesson={selectedTheoryLesson}
        theoryTeachers={theoryTeachers}
        isLoading={isLoading}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title='מחיקת שיעור תאוריה'
        message={
          <>
            <p>
              האם אתה בטוח שברצונך למחוק את שיעור התאוריה "{selectedTheoryLesson.category}"?
            </p>
            <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
          </>
        }
        confirmText='מחק'
        cancelText='ביטול'
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
        type='danger'
      />
    </div>
  );
}