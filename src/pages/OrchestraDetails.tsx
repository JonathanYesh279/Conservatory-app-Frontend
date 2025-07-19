// src/pages/OrchestraDetails.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Edit, ChevronDown, ChevronUp, Music, Calendar, Users, X, Plus, Clock, MapPin, ArrowLeft, MoreHorizontal, Trash2, User } from 'lucide-react'
import { useOrchestraStore } from '../store/orchestraStore'
import { useTeacherStore } from '../store/teacherStore'
import { useStudentStore } from '../store/studentStore'
import { useRehearsalStore } from '../store/rehearsalStore'
import { useAuth } from '../hooks/useAuth'
import { OrchestraForm } from '../cmps/OrchestraForm'
import { RehearsalForm } from '../cmps/RehearsalForm'
import { ConfirmDialog } from '../cmps/ConfirmDialog'
import { Student } from '../services/studentService'
import { Rehearsal } from '../services/rehearsalService'
import { useAuthorization, createAuthorizationContext } from '../utils/authorization'

// Define member interface
interface OrchestraMember {
  _id: string
  personalInfo: {
    fullName: string
  }
  academicInfo: {
    instrument: string
  }
}

interface ConductorInfo {
  _id: string
  personalInfo: {
    fullName: string
  }
  professionalInfo?: {
    instrument?: string
  }
}

export function OrchestraDetails() {
  const { orchestraId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    selectedOrchestra,
    loadOrchestraById,
    removeOrchestra,
    isLoading,
    error,
  } = useOrchestraStore()

  const { loadTeacherById } = useTeacherStore()
  const { getStudentsByIds } = useStudentStore()
  const { 
    rehearsals, 
    loadRehearsalsByOrchestraId, 
    removeRehearsal,
    isLoading: isLoadingRehearsals 
  } = useRehearsalStore()

  // State
  const [members, setMembers] = useState<OrchestraMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [conductor, setConductor] = useState<ConductorInfo | null>(null)
  const [isLoadingConductor, setIsLoadingConductor] = useState(false)

  // Rehearsal state
  const [isRehearsalFormOpen, setIsRehearsalFormOpen] = useState(false)
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(null)
  const [isConfirmRehearsalDeleteOpen, setIsConfirmRehearsalDeleteOpen] = useState(false)
  const [rehearsalToDelete, setRehearsalToDelete] = useState<string | null>(null)

  // Section toggle states
  const [showInfoSection, setShowInfoSection] = useState(false)
  const [showMembersSection, setShowMembersSection] = useState(false)
  const [showRehearsalsSection, setShowRehearsalsSection] = useState(false)

  // Authorization setup
  const authContext = createAuthorizationContext(user, !!user)
  const authManager = useAuthorization(authContext)
  
  // Get orchestra permissions
  const orchestraPermissions = selectedOrchestra 
    ? authManager.getOrchestraActionPermissions(selectedOrchestra)
    : { canEdit: false, canDelete: false, showEditButton: false, showDeleteButton: false }
    
  const canEdit = orchestraPermissions.canEdit
  const canDelete = orchestraPermissions.canDelete
  const isAdmin = authManager.isAdmin()

  // Load orchestra data
  useEffect(() => {
    if (orchestraId) {
      loadOrchestraById(orchestraId)
    }
  }, [orchestraId, loadOrchestraById])

  // Load rehearsals when orchestra is selected
  useEffect(() => {
    if (orchestraId) {
      loadRehearsalsByOrchestraId(orchestraId)
    }
  }, [orchestraId, loadRehearsalsByOrchestraId])

  // Load conductor data
  useEffect(() => {
    const fetchConductor = async () => {
      if (selectedOrchestra?.conductorId) {
        setIsLoadingConductor(true)
        try {
          await loadTeacherById(selectedOrchestra.conductorId)
          const teacherStore = useTeacherStore.getState()
          const conductorData = teacherStore.selectedTeacher
          setConductor(conductorData as ConductorInfo)
        } catch (err) {
          console.error('Failed to load conductor:', err)
        } finally {
          setIsLoadingConductor(false)
        }
      }
    }

    fetchConductor()
  }, [selectedOrchestra, loadTeacherById])

  // Load member data
  useEffect(() => {
    const fetchMembers = async () => {
      if (
        selectedOrchestra &&
        selectedOrchestra.memberIds &&
        selectedOrchestra.memberIds.length > 0
      ) {
        setIsLoadingMembers(true)
        try {
          const responseData = await getStudentsByIds(
            selectedOrchestra.memberIds
          )

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

          setMembers(
            memberData.map((member) => ({
              ...member,
              academicInfo: {
                ...member.academicInfo,
                instrument: member.academicInfo.instrument || '', // Provide a default empty string
              },
            })) as OrchestraMember[]
          );
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
  }, [selectedOrchestra, getStudentsByIds])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

   const goBack = () => {
     navigate('/orchestras');
   };

  // Handle edit
  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  // Handle delete
  const handleDelete = () => {
    setIsConfirmDialogOpen(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (selectedOrchestra?._id) {
      try {
        await removeOrchestra(selectedOrchestra._id)
        navigate('/orchestras')
      } catch (err) {
        console.error('Failed to delete orchestra:', err)
      }
    }
    setIsConfirmDialogOpen(false)
  }

  // Rehearsal handlers
  const handleAddRehearsal = () => {
    setSelectedRehearsal(null)
    setIsRehearsalFormOpen(true)
  }

  const handleEditRehearsal = (rehearsal: Rehearsal) => {
    setSelectedRehearsal(rehearsal)
    setIsRehearsalFormOpen(true)
  }

  const handleDeleteRehearsal = (rehearsalId: string) => {
    setRehearsalToDelete(rehearsalId)
    setIsConfirmRehearsalDeleteOpen(true)
  }

  const confirmDeleteRehearsal = async () => {
    if (rehearsalToDelete) {
      try {
        await removeRehearsal(rehearsalToDelete)
        loadRehearsalsByOrchestraId(orchestraId!)
      } catch (err) {
        console.error('Failed to delete rehearsal:', err)
      }
    }
    setIsConfirmRehearsalDeleteOpen(false)
    setRehearsalToDelete(null)
  }

  const handleRehearsalClick = (rehearsalId: string) => {
    navigate(`/rehearsals/${rehearsalId}`);
  }

  const handleMemberClick = (studentId: string) => {
    navigate(`/students/${studentId}`);
  }

  // Toggle sections
  const toggleInfoSection = () => {
    setShowInfoSection(!showInfoSection)
  }

  const toggleMembersSection = () => {
    setShowMembersSection(!showMembersSection)
  }

  const toggleRehearsalsSection = () => {
    setShowRehearsalsSection(!showRehearsalsSection)
  }

  if (isLoading) {
    return <div className='loading-state'>טוען...</div>
  }

  if (error) {
    return <div className='error-state'>{error}</div>
  }

  if (!selectedOrchestra) {
    return <div className='not-found-state'>תזמורת לא נמצאה</div>
  }

  return (
    <div className='orchestra-details-content'>
      <div className='orchestra-details-page'>
        <div className='orchestra-card-container'>
          <div className='card-content'>
            {/* Orchestra Header */}
            <div className='orchestra-header'>
              <div className='header-icon'>
                <Music className='icon' size={20} />
              </div>
              <h2 className='header-title'>{selectedOrchestra.name}</h2>

              <div className='header-actions'>
                {(orchestraPermissions.showEditButton || orchestraPermissions.showDeleteButton) && (
                  <div className='actions-dropdown'>
                    <button className='actions-trigger'>
                      <MoreHorizontal size={18} />
                    </button>
                    <div className='actions-menu'>
                      {orchestraPermissions.showEditButton && (
                        <button className='action-item edit' onClick={handleEdit}>
                          <Edit size={14} />
                          <span>עריכה</span>
                        </button>
                      )}
                      {orchestraPermissions.showDeleteButton && (
                        <button className='action-item delete' onClick={handleDelete}>
                          <Trash2 size={14} />
                          <span>מחיקה</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  className='back-button'
                  onClick={goBack}
                  aria-label='חזרה'
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className='card-scroll-area'>
              {/* Orchestra Info Section */}
              <div className='section'>
                <div
                  className={`section-title clickable ${
                    showInfoSection ? 'active' : ''
                  }`}
                  onClick={toggleInfoSection}
                >
                  <Music size={16} />
                  {selectedOrchestra.type === 'הרכב' ? 'פרטי הרכב' : 'פרטי התזמורת'}
                  {showInfoSection ? (
                    <ChevronUp className='toggle-icon' size={20} />
                  ) : (
                    <ChevronDown className='toggle-icon' size={20} />
                  )}
                </div>

                {showInfoSection && (
                  <div className='section-content'>
                    <div className='orchestra-info-grid'>
                      <div className='info-item'>
                        <span className='info-label'>
                          <User size={14} />
                          מנצח:
                        </span>
                        <span className='info-value'>
                          {isLoadingConductor
                            ? 'טוען...'
                            : conductor && 'personalInfo' in conductor
                            ? conductor.personalInfo.fullName
                            : 'לא הוגדר'}
                        </span>
                      </div>

                      <div className='info-item'>
                        <span className='info-label'>
                          <MapPin size={14} />
                          מיקום:
                        </span>
                        <span className='info-value'>
                          {selectedOrchestra.location || 'לא הוגדר'}
                        </span>
                      </div>

                      <div className='info-item'>
                        <span className='info-label'>
                          <Users size={14} />
                          תלמידים:
                        </span>
                        <span className='info-value'>
                          {selectedOrchestra.memberIds?.length || 0}
                        </span>
                      </div>

                      <div className='info-item'>
                        <span className='info-label'>
                          <Calendar size={14} />
                          חזרות:
                        </span>
                        <span className='info-value'>
                          {rehearsals?.length || 0}
                        </span>
                      </div>

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
                  חברי תזמורת
                  {showMembersSection ? (
                    <ChevronUp className='toggle-icon' size={20} />
                  ) : (
                    <ChevronDown className='toggle-icon' size={20} />
                  )}
                </div>

                {showMembersSection && (
                  <div className='section-content'>
                    {selectedOrchestra.memberIds &&
                    selectedOrchestra.memberIds.length > 0 ? (
                      <div className='members-list'>
                        {isLoadingMembers ? (
                          <div className='loading-message'>טוען תלמידים...</div>
                        ) : members.length > 0 ? (
                          <ul className='members-items'>
                            {members.map((member) => (
                              <li 
                                key={member._id} 
                                className='member-item clickable'
                                onClick={() => handleMemberClick(member._id)}
                              >
                                <div className='member-info'>
                                  <div className='member-avatar'>
                                    {member.personalInfo.fullName.charAt(0)}
                                  </div>
                                  <div className='member-details'>
                                    <div className='member-name'>
                                      {member.personalInfo.fullName}
                                    </div>
                                    <div className='member-instrument'>
                                      {member.academicInfo.instrument}
                                    </div>
                                  </div>
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

              {/* Rehearsals Section */}
              <div className='section'>
                <div
                  className={`section-title clickable ${
                    showRehearsalsSection ? 'active' : ''
                  }`}
                  onClick={toggleRehearsalsSection}
                >
                  <Calendar size={18} />
                  חזרות
                  {showRehearsalsSection ? (
                    <ChevronUp className='toggle-icon' size={20} />
                  ) : (
                    <ChevronDown className='toggle-icon' size={20} />
                  )}
                </div>

                {showRehearsalsSection && (
                  <div className='section-content'>
                    {/* Add Rehearsal Button - Only visible for authorized users */}
                    {orchestraPermissions.canEdit && (
                      <div className='add-rehearsal-btn-container'>
                        <button
                          className='btn primary add-rehearsal-btn'
                          onClick={handleAddRehearsal}
                        >
                          <Plus size={16} />
                          הוסף חזרה
                        </button>
                      </div>
                    )}

                    {isLoadingRehearsals ? (
                      <div className='loading-message'>טוען חזרות...</div>
                    ) : rehearsals && rehearsals.length > 0 ? (
                      <div className='rehearsals-list'>
                        {rehearsals
                          .sort(
                            (a, b) =>
                              new Date(a.date).getTime() -
                              new Date(b.date).getTime()
                          )
                          .map((rehearsal) => (
                            <div key={rehearsal._id}
                              className='rehearsal-item'
                              onClick={() => handleRehearsalClick(rehearsal._id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className='rehearsal-header'>
                                <div className='rehearsal-date'>
                                  <Calendar size={16} />
                                  <span>{formatDate(rehearsal.date)}</span>
                                </div>

                                {orchestraPermissions.canEdit && (
                                  <div className='rehearsal-actions'>
                                    <button
                                      className='action-btn edit'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditRehearsal(rehearsal)
                                    }}
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      className='action-btn delete'
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteRehearsal(rehearsal._id)
                                      }}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className='rehearsal-details'>
                                <div className='rehearsal-time'>
                                  <Clock size={16} />
                                  <span>
                                    {rehearsal.startTime} - {rehearsal.endTime}
                                  </span>
                                </div>
                                <div className='rehearsal-location'>
                                  <MapPin size={16} />
                                  <span>{rehearsal.location}</span>
                                </div>
                                {rehearsal.notes && (
                                  <div className='rehearsal-notes'>
                                    <span className='notes-label'>הערות:</span>
                                    <span className='notes-text'>
                                      {rehearsal.notes}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className='warning-box'>
                        אין חזרות רשומות לתזמורת זו
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Orchestra Modal */}
      {isEditModalOpen && (
        <OrchestraForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          orchestra={selectedOrchestra}
          onSave={() => {
            setIsEditModalOpen(false);
            orchestraId && loadOrchestraById(orchestraId);
          }}
        />
      )}

      {/* Rehearsal Form Modal */}
      {isRehearsalFormOpen && (
        <RehearsalForm
          isOpen={isRehearsalFormOpen}
          onClose={() => setIsRehearsalFormOpen(false)}
          rehearsal={selectedRehearsal}
          orchestraId={orchestraId!}
          onSave={() => {
            setIsRehearsalFormOpen(false);
            orchestraId && loadRehearsalsByOrchestraId(orchestraId);
          }}
        />
      )}

      {/* Confirm Delete Orchestra Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title='מחיקת תזמורת'
        message={
          <>
            <p>
              האם אתה בטוח שברצונך למחוק את התזמורת "{selectedOrchestra.name}"?
            </p>
            <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
          </>
        }
        confirmText='מחק'
        cancelText='ביטול'
        type='danger'
      />

      {/* Confirm Delete Rehearsal Dialog */}
      <ConfirmDialog
        isOpen={isConfirmRehearsalDeleteOpen}
        onClose={() => setIsConfirmRehearsalDeleteOpen(false)}
        onConfirm={confirmDeleteRehearsal}
        title='מחיקת חזרה'
        message={
          <>
            <p>האם אתה בטוח שברצונך למחוק חזרה זו?</p>
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