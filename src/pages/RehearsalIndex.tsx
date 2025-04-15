// src/pages/RehearsalIndex.tsx
import { useEffect, useState } from 'react';
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
import { Searchbar } from '../cmps/Searchbar';
import { useSearchbar } from '../hooks/useSearchbar';
import { Rehearsal } from '../services/rehearsalService';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { RehearsalList } from '../cmps/RehearsalList';
import { RehearsalForm } from '../cmps/RehearsalForm';
import { Orchestra } from '../services/orchestraService';

export function RehearsalIndex() {
  const { rehearsals, isLoading, error, loadRehearsals, removeRehearsal } =
    useRehearsalStore();
  const { orchestras, loadOrchestras } = useOrchestraStore();

  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const orchestraIdParam = searchParams.get('orchestraId');

  // State for modal forms and dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(
    null
  );
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [rehearsalToDelete, setRehearsalToDelete] = useState<string | null>(
    null
  );
  const [selectedOrchestraId, setSelectedOrchestraId] = useState<string | null>(
    orchestraIdParam
  );

  // Filter state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Define which fields to search in rehearsals
  const rehearsalSearchFields = (rehearsal: Rehearsal) => [
    rehearsal.location,
    // Add more searchable fields if needed
  ];

  // Use the search hook
  const { filteredEntities: filteredRehearsals, handleSearch } = useSearchbar(
    rehearsals,
    rehearsalSearchFields
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.roles.includes('מנהל');
  const isConductor = user?.roles.includes('מנצח');
  const isDetailPage =
    location.pathname.includes('/rehearsals/') &&
    !location.pathname.endsWith('/rehearsals/');

  // Load rehearsals and orchestras when component mounts
  useEffect(() => {
    loadOrchestras();

    // If orchestraId is provided in URL, load rehearsals for that orchestra only
    if (orchestraIdParam) {
      loadRehearsals({ groupId: orchestraIdParam });
      setSelectedOrchestraId(orchestraIdParam);
    } else {
      loadRehearsals();
    }
  }, [loadRehearsals, loadOrchestras, orchestraIdParam]);

  // Filter rehearsals by selected orchestra
  const getFilteredRehearsalsByOrchestra = () => {
    if (!selectedOrchestraId) return filteredRehearsals;

    return filteredRehearsals.filter(
      (rehearsal) => rehearsal.groupId === selectedOrchestraId
    );
  };

  // Filter rehearsals by selected date
  const getFilteredRehearsalsByDate = () => {
    const rehearsalsByOrchestra = getFilteredRehearsalsByOrchestra();

    if (!selectedDate) return rehearsalsByOrchestra;

    return rehearsalsByOrchestra.filter(
      (rehearsal) => rehearsal.date === selectedDate
    );
  };

  // Get the final filtered rehearsals
  const getFilteredRehearsals = () => {
    return getFilteredRehearsalsByDate();
  };

  // Get the selected orchestra object
  const getSelectedOrchestra = (): Orchestra | undefined => {
    if (!selectedOrchestraId) return undefined;
    return orchestras.find(
      (orchestra) => orchestra._id === selectedOrchestraId
    );
  };

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
        setRehearsalToDelete(null);
      } catch (err) {
        console.error('Failed to remove rehearsal:', err);
      }
    }
    setIsConfirmDialogOpen(false);
  };

  // Handle orchestra selection
  const handleOrchestraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOrchestraId = e.target.value || null;
    setSelectedOrchestraId(newOrchestraId);

    // Update URL search params
    if (newOrchestraId) {
      setSearchParams({ orchestraId: newOrchestraId });
    } else {
      searchParams.delete('orchestraId');
      setSearchParams(searchParams);
    }
  };

  // Handle date selection
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value || null);
  };

  // Check if user can add/edit rehearsals
  const canAddRehearsal = isAdmin || isConductor;
  const canEditRehearsal = isAdmin || isConductor;

  // Group rehearsals by date for display
  const groupRehearsalsByDate = (rehearsals: Rehearsal[]) => {
    const grouped = rehearsals.reduce((acc, rehearsal) => {
      const date = rehearsal.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(rehearsal);
      return acc;
    }, {} as Record<string, Rehearsal[]>);

    // Sort dates
    return Object.keys(grouped)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        date,
        rehearsals: grouped[date].sort((a, b) =>
          a.startTime.localeCompare(b.startTime)
        ),
      }));
  };

  const finalRehearsals = getFilteredRehearsals();
  const groupedRehearsals = groupRehearsalsByDate(finalRehearsals);
  const selectedOrchestra = getSelectedOrchestra();

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
                {selectedOrchestra && (
                  <span className='subtitle'>{selectedOrchestra.name}</span>
                )}
              </h1>
            </div>

            <div className='search-action-container'>
              <Searchbar onSearch={handleSearch} placeholder='חיפוש חזרות...' />

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

                {canAddRehearsal && (
                  <button
                    className='btn-icon add-btn'
                    onClick={handleAddRehearsal}
                    aria-label='הוספת חזרה חדשה'
                    disabled={!selectedOrchestraId}
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
            groupedRehearsals={groupedRehearsals}
            isLoading={isLoading}
            onEdit={canEditRehearsal ? handleEditRehearsal : undefined}
            onView={handleViewRehearsal}
            onRemove={isAdmin ? handleRemoveRehearsal : undefined}
            orchestras={orchestras}
          />
        )}

        <Outlet />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={confirmRemoveRehearsal}
          title='מחיקת חזרה'
          message={
            <>
              <p>האם אתה בטוח שברצונך למחוק את החזרה?</p>
              <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
            </>
          }
          confirmText='מחק'
          cancelText='ביטול'
          type='danger'
        />

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

      {!isDetailPage && <BottomNavbar />}
    </div>
  );
}
