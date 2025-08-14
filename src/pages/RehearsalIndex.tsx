// src/pages/RehearsalIndex.tsx
import { useEffect, useState, useMemo } from 'react';
import {
  Outlet,
  useNavigate,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import { useRehearsalStore } from '../store/rehearsalStore';
import { useOrchestraStore } from '../store/orchestraStore';
import { Header } from '../cmps/Header';
import { BottomNavbar } from '../cmps/BottomNavbar';
import { Plus, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Rehearsal, RehearsalFilter } from '../services/rehearsalService';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { RehearsalList } from '../cmps/RehearsalList';
import { RehearsalForm } from '../cmps/RehearsalForm';
<<<<<<< Updated upstream
import { RehearsalDeleteDialog } from '../cmps/RehearsalDeleteDialog';
import { useToast } from '../cmps/Toast';

export function RehearsalIndex() {
  const { rehearsals, isLoading, error, loadRehearsals, removeRehearsal, removeRehearsalsByOrchestra } =
=======
import { useToast } from '../cmps/Toast';

export function RehearsalIndex() {
  const { rehearsals, isLoading, error, loadRehearsals, removeRehearsal } =
>>>>>>> Stashed changes
    useRehearsalStore();
  const { orchestras, loadOrchestras } = useOrchestraStore();
  const { addToast } = useToast();

  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const orchestraIdParam = searchParams.get('orchestraId');
  const fromDateParam = searchParams.get('fromDate');

  // State for modal forms and dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(
    null
  );
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [rehearsalToDelete, setRehearsalToDelete] = useState<string | null>(
    null
  );
<<<<<<< Updated upstream
  
  // State for bulk delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRehearsalForDelete, setSelectedRehearsalForDelete] = useState<Rehearsal | null>(null);
=======
>>>>>>> Stashed changes

  // Filter states
  const [selectedOrchestraId, setSelectedOrchestraId] = useState<string | null>(
    orchestraIdParam
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    fromDateParam
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Navigation
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // User role checks
  const isAdmin = user?.roles.includes('מנהל');
  const isConductor = user?.roles.includes('מנצח');
  const isDetailPage =
    location.pathname.includes('/rehearsals/') &&
    !location.pathname.endsWith('/rehearsals/');

  // Load rehearsals and orchestras when component mounts or filters change
  useEffect(() => {
    loadOrchestras();

    // Build filter parameters from URL or state
    const filterParams: RehearsalFilter = {};

    if (orchestraIdParam) {
      filterParams.groupId = orchestraIdParam;
      setSelectedOrchestraId(orchestraIdParam);
    }

    if (fromDateParam) {
      filterParams.fromDate = fromDateParam;
      setSelectedDate(fromDateParam);
    } else {
      const today = new Date()
       const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
       filterParams.fromDate = formattedDate;
       setSelectedDate(formattedDate);
    }

    // Load rehearsals with filters
    loadRehearsals(filterParams);
  }, [loadRehearsals, loadOrchestras, orchestraIdParam, fromDateParam]);

  // Update URL params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);

    if (selectedOrchestraId) {
      newParams.set('orchestraId', selectedOrchestraId);
    } else {
      newParams.delete('orchestraId');
    }

    setSearchParams(newParams);
  }, [selectedOrchestraId, setSearchParams]);

  // Filter rehearsals based on search term only (orchestra name)
  const filteredRehearsals = useMemo(() => {
    // Apply client-side search filtering only
    if (!searchTerm.trim()) {
      return rehearsals;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return rehearsals.filter((rehearsal) => {
      const orchestra = orchestras.find((o) => o._id === rehearsal.groupId);
      return orchestra && orchestra.name.toLowerCase().includes(lowerSearch);
    });
  }, [rehearsals, searchTerm, orchestras]);

  // Handler functions for rehearsal CRUD operations
  const handleAddRehearsal = () => {
    setSelectedRehearsal(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedRehearsal(null);
  };

  const handleEditRehearsal = (rehearsalId: string) => {
    const rehearsal = rehearsals.find((r) => r._id === rehearsalId) || null;
    setSelectedRehearsal(rehearsal);
    setIsFormOpen(true);
  };

  const handleViewRehearsal = (rehearsalId: string) => {
    navigate(`/rehearsals/${rehearsalId}`);
  };

  const handleRemoveRehearsal = (rehearsalId: string) => {
    const rehearsal = rehearsals.find((r) => r._id === rehearsalId);
    if (rehearsal) {
      setRehearsalToDelete(rehearsalId);
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmRemoveRehearsal = async () => {
    if (rehearsalToDelete) {
      try {
        await removeRehearsal(rehearsalToDelete);
        
        // Show success toast
        addToast({
          type: 'success',
          message: 'החזרה נמחקה לצמיתות בהצלחה',
        });
        
        setRehearsalToDelete(null);
      } catch (err) {
        console.error('Failed to remove rehearsal:', err);
        
        // Show error toast
        addToast({
          type: 'danger',
          message: 'אירעה שגיאה במחיקת החזרה',
        });
      }
    }
    setIsConfirmDialogOpen(false);
  };

<<<<<<< Updated upstream
  // Handle opening the delete dialog with options
  const handleRehearsalDeleteWithOptions = (orchestraId: string, rehearsalId: string) => {
    const rehearsal = rehearsals.find(r => r._id === rehearsalId);
    if (rehearsal) {
      setSelectedRehearsalForDelete(rehearsal);
      setIsDeleteDialogOpen(true);
    }
  };

  // Handle single rehearsal delete from dialog
  const handleDeleteSingleRehearsal = async () => {
    if (selectedRehearsalForDelete) {
      try {
        await removeRehearsal(selectedRehearsalForDelete._id);
        
        addToast({
          type: 'success',
          message: 'החזרה נמחקה בהצלחה',
        });
      } catch (err) {
        console.error('Failed to remove rehearsal:', err);
        addToast({
          type: 'danger',
          message: 'אירעה שגיאה במחיקת החזרה',
        });
      }
    }
  };

  // Handle bulk delete all rehearsals for orchestra
  const handleDeleteAllOrchestraRehearsals = async () => {
    if (selectedRehearsalForDelete) {
      try {
        const result = await removeRehearsalsByOrchestra(selectedRehearsalForDelete.groupId);
        
        addToast({
          type: 'success',
          message: `נמחקו ${result.deletedCount} חזרות בהצלחה`,
        });
      } catch (err) {
        console.error('Failed to remove orchestra rehearsals:', err);
        addToast({
          type: 'danger',
          message: 'אירעה שגיאה במחיקת החזרות',
        });
      }
    }
  };

=======
>>>>>>> Stashed changes
  // Handle filter changes
  const handleOrchestraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrchestraId = e.target.value || null;
    setSelectedOrchestraId(newOrchestraId);

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (newOrchestraId) {
      newParams.set('orchestraId', newOrchestraId);
    } else {
      newParams.delete('orchestraId');
    }
    setSearchParams(newParams);

    // Reload rehearsals with new filters
    const filterParams = {
      groupId: newOrchestraId || undefined,
      fromDate: selectedDate || undefined,
    };
    loadRehearsals(filterParams);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value || null;
    setSelectedDate(dateValue);

    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (dateValue) {
      newParams.set('fromDate', dateValue);
    } else {
      newParams.delete('fromDate');
    }
    setSearchParams(newParams);

    // Reload rehearsals with new filters
    const filterParams = {
      groupId: selectedOrchestraId || undefined,
      fromDate: dateValue || undefined,
    };
    loadRehearsals(filterParams);
  };

  // const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSearchTerm(e.target.value);
  // };

  // const clearSearch = () => {
  //   setSearchTerm('');
  // };

  const clearFilters = () => {
    setSelectedOrchestraId(null);
    setSelectedDate(null);
    setSearchTerm('');

    // Clear URL params
    setSearchParams(new URLSearchParams());

    // Reload rehearsals without filters
    loadRehearsals({});
  };

  // Check if user can add/edit rehearsals
  const canAddRehearsal = isAdmin || isConductor;
  const canEditRehearsal = isAdmin || isConductor;

  return (
    <div className='app-container'>
      <Header />
      <main className='main-content'>
        {/* Only show search bar and action buttons if not on details page */}
        {!isDetailPage && (
          <div className='page-header'>
            <div className='page-title'>
              <h1>
                <Calendar className='title-icon' />
                לוח חזרות
              </h1>
            </div>

            <div className='search-action-container-rehearsal'>
              <div className='action-buttons'>
                {/* Orchestra Filter */}
                <div className='filter-dropdown'>
                  <select
                    value={selectedOrchestraId || ''}
                    onChange={handleOrchestraChange}
                    className='filter-select'
                  >
                    <option value=''>כל התזמורות</option>
                    {orchestras.map((orchestra) => (
                      <option key={orchestra._id} value={orchestra._id}>
                        {orchestra.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Filter */}
                <div className='filter-date'>
                  <input
                    type='date'
                    value={selectedDate || ''}
                    onChange={handleDateChange}
                    className='date-picker'
                  />
                </div>

                {/* Clear Filters Button - Add this inside action-buttons */}
                {(selectedOrchestraId || selectedDate || searchTerm) && (
                  <button className='btn secondary' onClick={clearFilters}>
                    איפוס
                  </button>
                )}

                {/* Add Button */}
                {canAddRehearsal && (
                  <button
                    className='btn-icon add-btn'
                    onClick={handleAddRehearsal}
                    aria-label='הוספת חזרה חדשה'
                  >
                    <Plus className='icon' />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {error && <div className='error-message'>{error}</div>}

        {!isDetailPage && (
          <RehearsalList
            rehearsals={filteredRehearsals}
            isLoading={isLoading}
            onEdit={canEditRehearsal ? handleEditRehearsal : undefined}
            onView={handleViewRehearsal}
<<<<<<< Updated upstream
            onRemoveOrchestra={isAdmin ? handleRehearsalDeleteWithOptions : undefined}
=======
            onRemove={isAdmin ? handleRemoveRehearsal : undefined}
>>>>>>> Stashed changes
            orchestras={orchestras}
          />
        )}

        <Outlet />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={confirmRemoveRehearsal}
          title='⚠️ מחיקה לצמיתות'
          message={
            <>
              <p><strong>זהירות: פעולת מחיקה לצמיתות!</strong></p>
              <p>החזרה תימחק לצמיתות מהמערכת.</p>
              <p>כל נתוני הנוכחות והמידע הקשור יימחקו גם כן.</p>
              <p className='text-sm text-muted'><strong>פעולה זו לא ניתנת לביטול!</strong></p>
            </>
          }
          confirmText='מחק לצמיתות'
          cancelText='ביטול'
          type='danger'
        />

<<<<<<< Updated upstream
        {/* Rehearsal Delete Dialog */}
        {isDeleteDialogOpen && selectedRehearsalForDelete && (
          <RehearsalDeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => {
              setIsDeleteDialogOpen(false);
              setSelectedRehearsalForDelete(null);
            }}
            orchestraName={
              orchestras.find(o => o._id === selectedRehearsalForDelete.groupId)?.name || 'לא ידוע'
            }
            orchestraRehearsalsCount={
              rehearsals.filter(r => r.groupId === selectedRehearsalForDelete.groupId).length
            }
            onDeleteSingle={async () => {
              await handleDeleteSingleRehearsal();
              setIsDeleteDialogOpen(false);
              setSelectedRehearsalForDelete(null);
            }}
            onDeleteAll={async () => {
              await handleDeleteAllOrchestraRehearsals();
              setIsDeleteDialogOpen(false);
              setSelectedRehearsalForDelete(null);
            }}
          />
        )}

=======
>>>>>>> Stashed changes
        {/* Rehearsal Form Modal */}
        {isFormOpen && (
          <RehearsalForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            rehearsal={selectedRehearsal}
            orchestraId={selectedOrchestraId || ''}
            onSave={loadRehearsals}
          />
        )}
      </main>

      {!isDetailPage && !isFormOpen && <BottomNavbar />}
    </div>
  );
}
