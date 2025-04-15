// src/pages/RehearsalDetails.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Edit,
  ChevronDown,
  ChevronUp,
  Music,
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  ArrowRight,
} from 'lucide-react'
import { useRehearsalStore } from '../store/rehearsalStore'
import { useOrchestraStore } from '../store/orchestraStore'
import { useStudentStore } from '../store/studentStore'
import { useAuth } from '../hooks/useAuth'
import { RehearsalForm } from '../cmps/RehearsalForm'
import { ConfirmDialog } from '../cmps/ConfirmDialog'
import { Student } from '../services/studentService'
import { Orchestra } from '../services/orchestraService'

interface OrchestraMember {
  _id: string
  personalInfo: {
    fullName: string
  }
  academicInfo: {
    instrument: string
  }
}

export function RehearsalDetails() {
  const { rehearsalId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    selectedRehearsal,
    loadRehearsalById,
    removeRehearsal,
    isLoading,
    error,
  } = useRehearsalStore()

  const { loadOrchestraById } = useOrchestraStore()
  const { getStudentsByIds } = useStudentStore()

  // State
  const [orchestra, setOrchestra] = useState<Orchestra | null>(null)
  const [isLoadingOrchestra, setIsLoadingOrchestra] = useState(false)
  const [members, setMembers] = useState<OrchestraMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  // Section toggle states
  const [showInfoSection, setShowInfoSection] = useState(true)
  const [showMembersSection, setShowMembersSection] = useState(false)
  const [showNotesSection, setShowNotesSection] = useState(false)

  // Check permissions
  const isAdmin = user?.roles?.includes('מנהל') || false
  const isConductor = user?.roles?.includes('מנצח') || false
  const canEdit = isAdmin || isConductor
  
  // Load rehearsal data
  useEffect(() => {
    if (rehearsalId) {
      loadRehearsalById(rehearsalId)
    }
  }, [rehearsalId, loadRehearsalById])

  // Load orchestra data when we have the rehearsal
  useEffect(() => {
    const fetchOrchestra = async () => {
      if (selectedRehearsal?.orchestraId) {
        setIsLoadingOrchestra(true)
        try {
          await loadOrchestraById(selectedRehearsal.orchestraId)
          const orchestraStore = useOrchestraStore.getState()
          setOrchestra(orchestraStore.selectedOrchestra)
        } catch (err) {
          console.error('Failed to load orchestra:', err)
        } finally {
          setIsLoadingOrchestra(false)
        }
      }
    }

    fetchOrchestra()
  }, [selectedRehearsal, loadOrchestraById])

  // Load members when we have the orchestra
  useEffect(() => {
    const fetchMembers = async () => {
      if (orchestra?.memberIds && orchestra.memberIds.length > 0) {
        setIsLoadingMembers(true)
        try {
          const responseData = await getStudentsByIds(orchestra.memberIds)

          // Map to only the fields we need
          const memberData = responseData.map((student: Student) => ({
            _id: student._id,
            personalInfo: {
              fullName: student.personalInfo.fullName,
            },
            academicInfo: {
              instrument: student.academicInfo.instrument,
            },
          }))

          setMembers(memberData)
        } catch (err) {
          console.error('Failed to load members:', err)
        } finally {
          setIsLoadingMembers(false)
        }
      } else {
        // Reset members if no memberIds
        setMembers([])
      }
    }

    fetchMembers()
  }, [orchestra, getStudentsByIds])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Calculate duration in a readable format
  const formatDuration = (startTime: string, endTime: string): string => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const start = startHours * 60 + startMinutes
    const end = endHours * 60 + endMinutes
    const minutes = end - start
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours === 0) {
      return `${mins} דקות`
    } else if (hours === 1 && mins === 0) {
      return 'שעה אחת'
    } else if (hours === 1) {
      return `שעה ו-${mins} דקות`
    } else if (mins === 0) {
      return `${hours} שעות`
    } else {
      return `${hours} שעות ו-${mins} דקות`
    }
  }

  // Handle edit
  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  // Handle delete
  const handleDelete = () => {
    setIsConfirmDialogOpen(true)
  }

  // Navigate back to orchestra
  const handleBackToOrchestra = () => {
    if (orchestra?._id) {
      navigate(`/orchestras/${orchestra._id}`)
    } else {
      navigate('/orchestras')
    }
  }

  // Navigate back to rehearsals
  const handleBackToRehearsals = () => {
    if (orchestra?._id) {
      navigate(`/rehearsals?orchestraId=${orchestra._id}`)
    } else {
      navigate('/rehearsals')
    }
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (selectedRehearsal?._id) {
      try {
        await removeRehearsal(selectedRehearsal._id)
        if (orchestra?._id) {
          navigate(`/rehearsals?orchestraId=${orchestra._id}`)
        } else {
          navigate('/rehearsals')
        }
      } catch (err) {
        console.error('Failed to delete rehearsal:', err)
      }
    }
    setIsConfirmDialogOpen(false)
  }

  // Toggle sections
  const toggleInfoSection = () => {
    setShowInfoSection(!showInfoSection)
  }

  const toggleMembersSection = () => {
    setShowMembersSection(!showMembersSection)
  }

  const toggleNotesSection = () => {
    setShowNotesSection(!showNotesSection)
  }

  if (isLoading) {
    return <div className='loading-state'>טוען...</div>
  }

  if (error) {
    return <div className='error-state'>{error}</div>
  }

  if (!selectedRehearsal) {
    return <div className='not-found-state'>חזרה לא נמצאה</div>
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
              >
                <ArrowRight size={18} />
                חזרה לרשימת החזרות
              </button>
              <div className='header-title'>
                <h2>פרטי החזרה</h2>
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

                {isAdmin && (
                  <button className='action-btn delete' onClick={handleDelete}>
                    <X size={16} />
                    מחיקה
                  </button>
                )}
              </div>
            </div>

            {/* Card Content */}
            <div className='card-scroll-area'>
              {/* Rehearsal Info Section */}
              <div className='section'>
                <div
                  className={`section-title clickable ${
                    showInfoSection ? 'active' : ''
                  }`}
                  onClick={toggleInfoSection}
                >
                  פרטי החזרה
                  {showInfoSection ? (
                    <ChevronUp className='toggle-icon' size={20} />
                  ) : (
                    <ChevronDown className='toggle-icon' size={20} />
                  )}
                </div>

                {showInfoSection && (
                  <div className='section-content'>
                    <div className='info-row'>
                      <span className='info-label'>תזמורת:</span>
                      <span className='info-value info-link' onClick={handleBackToOrchestra}>
                        {isLoadingOrchestra
                          ? 'טוען...'
                          : orchestra
                          ? orchestra.name
                          : 'לא מוגדר'}
                      </span>
                    </div>

                    <div className='info-row'>
                      <span className='info-label'>זמן:</span>
                      <span className='info-value'>
                        {selectedRehearsal.startTime} - {selectedRehearsal.endTime}
                        <span className='duration'>
                          ({formatDuration(selectedRehearsal.startTime, selectedRehearsal.endTime)})
                        </span>
                      </span>
                    </div>

                    <div className='info-row'>
                      <span className='info-label'>מיקום:</span>
                      <span className='info-value'>{selectedRehearsal.location}</span>
                    </div>

                    <div className='info-row'>
                      <span className='info-label'>מספר תלמידים:</span>
                      <span className='info-value'>
                        {orchestra?.memberIds?.length || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div className='section'>
                <div
                  className={`section-title clickable ${
                    showMembersSection ? 'active' : ''
                  }`}
                  onClick={toggleMembersSection}
                >
                  <Users size={18} />
                  תלמידים
                  {showMembersSection ? (
                    <ChevronUp className='toggle-icon' size={20} />
                  ) : (
                    <ChevronDown className='toggle-icon' size={20} />
                  )}
                </div>

                {showMembersSection && (
                  <div className='section-content'>
                    {orchestra?.memberIds && orchestra.memberIds.length > 0 ? (
                      <div className='members-list'>
                        {isLoadingMembers ? (
                          <div className='loading-message'>טוען תלמידים...</div>
                        ) : members.length > 0 ? (
                          <ul className='members-items'>
                            {members.map((member) => (
                              <li key={member._id} className='member-item'>
                                <div className='member-info'>
                                  <span className='member-name'>
                                    {member.personalInfo.fullName}
                                  </span>
                                  <span className='member-instrument'>
                                    {member.academicInfo.instrument}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className='message-box'>
                            לא ניתן לטעון את נתוני התלמידים
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='warning-box'>אין תלמידים בתזמורת זו</div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes Section (if there are notes) */}
              {selectedRehearsal.notes && (
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      showNotesSection ? 'active' : ''
                    }`}
                    onClick={toggleNotesSection}
                  >
                    הערות
                    {showNotesSection ? (
                      <ChevronUp className='toggle-icon' size={20} />
                    ) : (
                      <ChevronDown className='toggle-icon' size={20} />
                    )}
                  </div>

                  {showNotesSection && (
                    <div className='section-content'>
                      <div className='notes-box'>
                        {selectedRehearsal.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Rehearsal Modal */}
      {isEditModalOpen && (
        <RehearsalForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          rehearsal={selectedRehearsal}
          orchestraId={selectedRehearsal.orchestraId}
          onSave={() => {
            setIsEditModalOpen(false)
            rehearsalId && loadRehearsalById(rehearsalId)
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
              האם אתה בטוח שברצונך למחוק את החזרה בתאריך "{formatDate(selectedRehearsal.date)}"?
            </p>
            <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
          </>
        }
        confirmText='מחק'
        cancelText='ביטול'
        type='danger'
      />
    </div>
  )
}