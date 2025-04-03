// src/pages/OrchestraDetails.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Edit,
  ChevronDown,
  ChevronUp,
  Music,
  Calendar,
  Users,
  X,
} from 'lucide-react';
import { useOrchestraStore } from '../store/orchestraStore';
import { useTeacherStore } from '../store/teacherStore';
import { useAuth } from '../hooks/useAuth';
import { OrchestraForm } from '../cmps/OrchestraForm';
import { ConfirmDialog } from '../cmps/ConfirmDialog';

export function OrchestraDetails() {
  const { orchestraId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    selectedOrchestra,
    loadOrchestraById,
    removeOrchestra,
    isLoading,
    error,
  } = useOrchestraStore();

  const { loadTeacherById, selectedTeacher } = useTeacherStore();

  // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [conductor, setConductor] = useState(null);
  const [isLoadingConductor, setIsLoadingConductor] = useState(false);

  // Section toggle states
  const [showInfoSection, setShowInfoSection] = useState(true);
  const [showMembersSection, setShowMembersSection] = useState(false);
  const [showRehearsalsSection, setShowRehearsalsSection] = useState(false);

  // Check permissions
  const isAdmin = user?.roles?.includes('מנהל') || false;
  const isConductor = user?.roles?.includes('מנצח') || false;
  const canEdit =
    isAdmin || (isConductor && selectedOrchestra?.conductorId === user?._id);

  // Load orchestra data
  useEffect(() => {
    if (orchestraId) {
      loadOrchestraById(orchestraId);
    }
  }, [orchestraId, loadOrchestraById]);

  // Load conductor data
  useEffect(() => {
    const fetchConductor = async () => {
      if (selectedOrchestra?.conductorId) {
        setIsLoadingConductor(true);
        try {
          await loadTeacherById(selectedOrchestra.conductorId);
          const teacherStore = useTeacherStore.getState();
          const conductorData = teacherStore.selectedTeacher;
          setConductor(conductorData);
        } catch (err) {
          console.error('Failed to load conductor:', err);
        } finally {
          setIsLoadingConductor(false);
        }
      }
    };

    fetchConductor();
  }, [selectedOrchestra, loadTeacherById]);

  // Handle edit
  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  // Handle delete
  const handleDelete = () => {
    setIsConfirmDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (selectedOrchestra?._id) {
      try {
        await removeOrchestra(selectedOrchestra._id);
        navigate('/orchestras');
      } catch (err) {
        console.error('Failed to delete orchestra:', err);
      }
    }
    setIsConfirmDialogOpen(false);
  };

  // Toggle sections
  const toggleInfoSection = () => {
    setShowInfoSection(!showInfoSection);
  };

  const toggleMembersSection = () => {
    setShowMembersSection(!showMembersSection);
  };

  const toggleRehearsalsSection = () => {
    setShowRehearsalsSection(!showRehearsalsSection);
  };

  if (isLoading) {
    return <div className='loading-state'>טוען...</div>;
  }

  if (error) {
    return <div className='error-state'>{error}</div>;
  }

  if (!selectedOrchestra) {
    return <div className='not-found-state'>תזמורת לא נמצאה</div>;
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
              {/* Orchestra Info Section */}
              <div className='section'>
                <div
                  className={`section-title clickable ${
                    showInfoSection ? 'active' : ''
                  }`}
                  onClick={toggleInfoSection}
                >
                  פרטי התזמורת
                  {showInfoSection ? (
                    <ChevronUp className='toggle-icon' size={20} />
                  ) : (
                    <ChevronDown className='toggle-icon' size={20} />
                  )}
                </div>

                {showInfoSection && (
                  <div className='section-content'>
                    <div className='info-row'>
                      <span className='info-label'>מנצח:</span>
                      <span className='info-value'>
                        {isLoadingConductor
                          ? 'טוען...'
                          : conductor
                          ? conductor.personalInfo.fullName
                          : 'לא הוגדר'}
                      </span>
                    </div>

                    <div className='info-row'>
                      <span className='info-label'>מספר תלמידים:</span>
                      <span className='info-value'>
                        {selectedOrchestra.memberIds?.length || 0}
                      </span>
                    </div>

                    <div className='info-row'>
                      <span className='info-label'>מספר חזרות:</span>
                      <span className='info-value'>
                        {selectedOrchestra.rehearsalIds?.length || 0}
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
                    {selectedOrchestra.memberIds?.length > 0 ? (
                      <div className='members-list'>
                        {/* Would render members here */}
                        <div className='message-box'>
                          התלמיד אינו משתתף בתזמורות
                        </div>
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
                    {selectedOrchestra.rehearsalIds?.length > 0 ? (
                      <div className='rehearsals-list'>
                        {/* Would render rehearsals here */}
                        <div className='message-box'>אין חזרות מתוכננות</div>
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

      {/* Edit Modal */}
      {isEditModalOpen && (
        <OrchestraForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          orchestra={selectedOrchestra}
          onSave={() => {
            setIsEditModalOpen(false);
            loadOrchestraById(orchestraId);
          }}
        />
      )}

      {/* Confirm Delete Dialog */}
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
    </div>
  );
}
