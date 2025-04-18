// src/pages/RehearsalDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Calendar, ArrowLeft } from 'lucide-react';
import { useRehearsalStore } from '../store/rehearsalStore';
import { useOrchestraStore } from '../store/orchestraStore';
import { useStudentStore } from '../store/studentStore';
import { useAuth } from '../hooks/useAuth';
import { RehearsalForm } from '../cmps/RehearsalForm';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { Student } from '../services/studentService';
import { Orchestra } from '../services/orchestraService';

export function RehearsalDetails() {
  const { rehearsalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    selectedRehearsal,
    loadRehearsalById,
    removeRehearsal,
    updateAttendance,
    isLoading,
    error,
  } = useRehearsalStore();

  const { loadOrchestraById } = useOrchestraStore();
  const { getStudentsByIds } = useStudentStore();

  // State
  const [orchestra, setOrchestra] = useState<Orchestra | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingOrchestra, setIsLoadingOrchestra] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Attendance state
  const [presentStudents, setPresentStudents] = useState<string[]>([]);
  const [absentStudents, setAbsentStudents] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check permissions
  const isAdmin = user?.roles?.includes('מנהל') || false;
  const isConductor = user?.roles?.includes('מנצח') || false;
  const canEdit = isAdmin || isConductor;
  const canUpdateAttendance = isAdmin || isConductor;

  // Load rehearsal data
  useEffect(() => {
    if (rehearsalId) {
      loadRehearsalById(rehearsalId);
    }
  }, [rehearsalId, loadRehearsalById]);

  // Load orchestra data when we have the rehearsal
  useEffect(() => {
    const fetchOrchestra = async () => {
      if (selectedRehearsal?.groupId) {
        setIsLoadingOrchestra(true);
        try {
          await loadOrchestraById(selectedRehearsal.groupId);
          const orchestraStore = useOrchestraStore.getState();
          setOrchestra(orchestraStore.selectedOrchestra);
        } catch (err) {
          console.error('Failed to load orchestra:', err);
        } finally {
          setIsLoadingOrchestra(false);
        }
      }
    };

    fetchOrchestra();
  }, [selectedRehearsal, loadOrchestraById]);

  // Load students when we have the orchestra
  useEffect(() => {
    const fetchStudents = async () => {
      if (orchestra?.memberIds && orchestra.memberIds.length > 0) {
        setIsLoadingStudents(true);
        try {
          const studentsData = await getStudentsByIds(orchestra.memberIds);
          setStudents(studentsData);
        } catch (err) {
          console.error('Failed to load students:', err);
        } finally {
          setIsLoadingStudents(false);
        }
      } else {
        setStudents([]);
      }
    };

    fetchStudents();
  }, [orchestra, getStudentsByIds]);

  // Initialize attendance state when rehearsal data loads
  useEffect(() => {
    if (selectedRehearsal?.attendance) {
      setPresentStudents(selectedRehearsal.attendance.present || []);
      setAbsentStudents(selectedRehearsal.attendance.absent || []);
    } else {
      setPresentStudents([]);
      setAbsentStudents([]);
    }
    setHasChanges(false);
  }, [selectedRehearsal]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Toggle student attendance
  const toggleAttendance = (studentId: string) => {
    let newPresent = [...presentStudents];
    let newAbsent = [...absentStudents];

    // If already in present list, move to absent
    if (presentStudents.includes(studentId)) {
      newPresent = newPresent.filter((id) => id !== studentId);
      newAbsent.push(studentId);
    }
    // If already in absent list, move to present
    else if (absentStudents.includes(studentId)) {
      newAbsent = newAbsent.filter((id) => id !== studentId);
      newPresent.push(studentId);
    }
    // If in neither list (new student), add to present
    else {
      newPresent.push(studentId);
    }

    setPresentStudents(newPresent);
    setAbsentStudents(newAbsent);
    setHasChanges(true);
    setSaveSuccess(false);
  };

  // Check if student is present
  const isStudentPresent = (studentId: string) => {
    return presentStudents.includes(studentId);
  };

  // Save attendance changes
  const saveAttendance = async () => {
    if (!rehearsalId || !selectedRehearsal) return;

    setIsSaving(true);

    try {
      await updateAttendance(rehearsalId, {
        present: presentStudents,
        absent: absentStudents,
      });
      setSaveSuccess(true);
      setHasChanges(false);

      // Reload the rehearsal to get updated data
      await loadRehearsalById(rehearsalId);
    } catch (err) {
      console.error('Failed to update attendance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Navigate back to rehearsals
  const handleBackToRehearsals = () => {
    if (orchestra?._id) {
      navigate(`/rehearsals?orchestraId=${orchestra._id}`);
    } else {
      navigate('/rehearsals');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (selectedRehearsal?._id) {
      try {
        await removeRehearsal(selectedRehearsal._id);
        navigate('/rehearsals');
      } catch (err) {
        console.error('Failed to delete rehearsal:', err);
      }
    }
    setIsConfirmDialogOpen(false);
  };

  if (isLoading) {
    return <div className='loading-state'>טוען...</div>;
  }

  if (error) {
    return <div className='error-state'>{error}</div>;
  }

  if (!selectedRehearsal) {
    return <div className='not-found-state'>חזרה לא נמצאה</div>;
  }

  return (
    <div className='rehearsal-details'>
      <div className='rehearsal-details-page'>
        <div className='rehearsal-card-container'>
          <div className='card-content'>
            {/* Rehearsal Header */}
            <div className='rehearsal-header'>
              <button
                className='back-button'
                onClick={handleBackToRehearsals}
                aria-label='חזור'
              >
                <ArrowLeft className='lucide lucide-arrow-right' />
              </button>

              <div className='header-title'>
                <h2>דיווח נוכחות לחזרה</h2>
                <div className='date-display'>
                  <Calendar size={18} />
                  <span>{formatDate(selectedRehearsal.date)}</span>
                </div>
              </div>

              <div className='header-actions'>
                {canEdit && (
                  <button className='action-btn edit' onClick={handleEdit}>
                    <Edit size={16} />
                    עריכה
                  </button>
                )}
              </div>
            </div>

            {/* Orchestra Info */}
            <div className='orchestra-info-card'>
              <h3>
                {isLoadingOrchestra ? 'טוען...' : orchestra?.name || 'לא מוגדר'}
              </h3>
              <div className='rehearsal-details-row'>
                <div className='detail-item'>
                  <span className='detail-label'>מיקום:</span>
                  <span className='detail-value'>
                    {selectedRehearsal.location}
                  </span>
                </div>
                <div className='detail-item'>
                  <span className='detail-label'>זמן:</span>
                  <span className='detail-value'>
                    {selectedRehearsal.startTime} - {selectedRehearsal.endTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Section */}
            <div className='attendance-section'>
              {/* Students List */}
              <div className='students-list-container'>
                {isLoadingStudents ? (
                  <div className='loading-students'>טוען רשימת תלמידים...</div>
                ) : students.length > 0 ? (
                  <ul className='students-list'>
                    {students.map((student) => (
                      <li
                        key={student._id}
                        className={`student-item ${
                          isStudentPresent(student._id) ? 'present' : ''
                        }`}
                      >
                        <div className='student-info'>
                          <div className='student-name'>
                            {student.personalInfo.fullName}
                          </div>
                          <div className='student-instrument'>
                            {student.academicInfo.instrument}
                          </div>
                        </div>
                        
                        <label className='toggle-switch'>
                          <input
                            type='checkbox'
                            checked={isStudentPresent(student._id)}
                            onChange={() => toggleAttendance(student._id)}
                          />
                          <span className='toggle-slider'></span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='empty-students'>
                    אין תלמידים רשומים לתזמורת זו
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            {canUpdateAttendance && (
              <div className='attendance-footer'>
                {saveSuccess && (
                  <span className='save-success'>הנוכחות עודכנה בהצלחה!</span>
                )}

                <button
                  className='save-attendance-btn'
                  onClick={saveAttendance}
                  disabled={!hasChanges || isSaving}
                >
                  {isSaving ? 'שומר...' : 'עדכן נוכחות'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Rehearsal Modal */}
      {isEditModalOpen && (
        <RehearsalForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          rehearsal={selectedRehearsal}
          orchestraId={selectedRehearsal.groupId}
          onSave={() => {
            setIsEditModalOpen(false);
            rehearsalId && loadRehearsalById(rehearsalId);
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title='מחיקת חזרה'
        message={
          <>
            <p>
              האם אתה בטוח שברצונך למחוק את החזרה בתאריך "
              {formatDate(selectedRehearsal.date)}"?
            </p>
            <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
          </>
        }
        confirmText='מחק'
        cancelText='ביטול'
        type='danger'
      />
    </div>
  );
}
