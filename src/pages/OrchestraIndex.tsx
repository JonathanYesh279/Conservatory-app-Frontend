// src/pages/OrchestraIndex.tsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useOrchestraStore } from '../store/orchestraStore';
import { Header } from '../cmps/Header';
import { BottomNavbar } from '../cmps/BottomNavbar';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Searchbar } from '../cmps/Searchbar';
import { useSearchbar } from '../hooks/useSearchbar';
import { Orchestra } from '../services/orchestraService';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { OrchestraList } from '../cmps/OrchestraList';
import { OrchestraForm } from '../cmps/OrchestraForm';
import { useSchoolYearStore } from '../store/schoolYearStore';

export function OrchestraIndex() {
  const {
    orchestras,
    isLoading,
    error,
    loadOrchestras,
    removeOrchestra,
  } = useOrchestraStore();

  const { loadCurrentSchoolYear } = useSchoolYearStore();

  // State for modal forms and dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrchestra, setSelectedOrchestra] = useState<Orchestra | null>(
    null
  );
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [orchestraToDelete, setOrchestraToDelete] = useState<string | null>(
    null
  );

  // Define which fields to search in orchestras
  const orchestraSearchFields = (orchestra: Orchestra) => [
    orchestra.name,
    orchestra.type,
  ];

  // Use the search hook
  const { filteredEntities: filteredOrchestras, handleSearch } = useSearchbar(
    orchestras,
    orchestraSearchFields
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.roles.includes('מנהל');
  const isConductor = user?.roles.includes('מנצח');
  const isDetailPage =
    location.pathname.includes('/orchestras/') &&
    !location.pathname.endsWith('/orchestras/');

  // Load orchestras when component mounts
  useEffect(() => {
    loadOrchestras();
    loadCurrentSchoolYear();
  }, [loadOrchestras, loadCurrentSchoolYear]);

  // Handler functions for orchestra CRUD operations
  const handleAddOrchestra = () => {
    setSelectedOrchestra(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedOrchestra(null);
  };

  const handleEditOrchestra = (orchestraId: string) => {
    const orchestra = orchestras.find((o) => o._id === orchestraId) || null;
    setSelectedOrchestra(orchestra);
    setIsFormOpen(true);
  };

  const handleViewOrchestra = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`);
  };

  const handleRemoveOrchestra = (orchestraId: string) => {
    const orchestra = orchestras.find((o) => o._id === orchestraId);
    if (orchestra) {
      setOrchestraToDelete(orchestraId);
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmRemoveOrchestra = async () => {
    if (orchestraToDelete) {
      try {
        await removeOrchestra(orchestraToDelete);
        setOrchestraToDelete(null);
      } catch (err) {
        console.error('Failed to remove orchestra:', err);
      }
    }
  };

  const handleFilter = () => {
    // This would open your filter dialog
    alert('Open filter dialog');
  };

  // Check if user can add/edit orchestras
  const canAddOrchestra = isAdmin;
  const canEditOrchestra = isAdmin || isConductor;

  return (
    <div className='app-container'>
      <Header />
      <main className='main-content'>
        {/* Only show search bar and action buttons if not on details page */}
        {!isDetailPage && (
          <div className='page-header'>
            <div className='search-action-container'>
              <Searchbar
                onSearch={handleSearch}
                placeholder='חיפוש תזמורות...'
              />

              <div className='action-buttons'>
                <button
                  className='btn-icon filter-btn'
                  onClick={handleFilter}
                  aria-label='סנן תזמורות'
                >
                  <Filter className='icon' />
                </button>

                {canAddOrchestra && (
                  <button
                    className='btn-icon add-btn'
                    onClick={handleAddOrchestra}
                    aria-label='הוספת תזמורת חדשה'
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
          <OrchestraList
            orchestras={filteredOrchestras}
            isLoading={isLoading}
            onEdit={canEditOrchestra ? handleEditOrchestra : undefined}
            onView={handleViewOrchestra}
            onRemove={isAdmin ? handleRemoveOrchestra : undefined}
          />
        )}

        <Outlet context={{ loadOrchestras }} />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={confirmRemoveOrchestra}
          title='מחיקת תזמורת'
          message={
            <>
              <p>האם אתה בטוח שברצונך למחוק את התזמורת?</p>
              <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
            </>
          }
          confirmText='מחק'
          cancelText='ביטול'
          type='danger'
        />

        {/* Orchestra Form Modal */}
        {isFormOpen && (
          <OrchestraForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            orchestra={selectedOrchestra}
            onSave={loadOrchestras}
          />
        )}
      </main>

      <BottomNavbar />
    </div>
  );
}
