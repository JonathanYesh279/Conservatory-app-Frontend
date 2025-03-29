// src/pages/TeacherIndex.tsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { teacherService, Teacher } from '../services/teacherService';
import { Header } from '../cmps/Header';
import { BottomNavbar } from '../cmps/BottomNavbar';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Searchbar } from '../cmps/Searchbar';
import { useSearchbar } from '../hooks/useSearchbar';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { FloatingActionButton } from '../cmps/FloatingActionButton';
import { TeacherList } from '../cmps/TeacherList';

export function TeacherIndex() {
  // State for teachers data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for modal forms and dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);

  // Define which fields to search in teachers
  const teacherSearchFields = (teacher: Teacher) => [
    teacher.personalInfo.fullName,
    teacher.professionalInfo?.instrument || '',
    teacher.personalInfo.email || '',
    teacher.personalInfo.phone || '',
  ];

  // Use the search hook
  const { filteredEntities: filteredTeachers, handleSearch } = useSearchbar(
    teachers,
    teacherSearchFields
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.roles.includes('מנהל');
  const isDetailPage =
    location.pathname.includes('/teachers/') &&
    !location.pathname.endsWith('/teachers/');

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Function to load teachers
  const loadTeachers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const teachersData = await teacherService.getTeachers();
      setTeachers(teachersData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load teachers';
      setError(errorMessage);
      console.error('Error loading teachers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler functions for teacher CRUD operations
  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTeacher(null);
  };

  const handleEditTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId) || null;
    setSelectedTeacher(teacher);
    setIsFormOpen(true);
  };

  const handleViewTeacher = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`);
  };

  const handleRemoveTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    if (teacher) {
      setTeacherToDelete(teacherId);
      setIsConfirmDialogOpen(true);
    }
  };

  const confirmRemoveTeacher = async () => {
    if (teacherToDelete) {
      setIsLoading(true);
      try {
        await teacherService.removeTeacher(teacherToDelete);
        // Update the teachers list after deletion
        setTeachers(teachers.filter((t) => t._id !== teacherToDelete));
        setTeacherToDelete(null);
      } catch (err) {
        console.error('Failed to remove teacher:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove teacher';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFilter = () => {
    // This would open your filter dialog
    alert('Open filter dialog');
  };

  // Only admin can add new teachers
  const canAddTeacher = isAdmin;

  return (
    <div className='app-container'>
      <Header />
      <main className='main-content'>
        {/* Only show search bar and action buttons if not on details page */}
        {!isDetailPage && (
          <div className='page-header'>
            <div className='search-action-container'>
              <Searchbar onSearch={handleSearch} placeholder='חיפוש מורים...' />

              <div className='action-buttons'>
                <button
                  className='btn-icon filter-btn'
                  onClick={handleFilter}
                  aria-label='סנן מורים'
                >
                  <Filter className='icon' />
                </button>

                {canAddTeacher && (
                  <button
                    className='btn-icon add-btn'
                    onClick={handleAddTeacher}
                    aria-label='הוספת מורה חדש'
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
          <TeacherList
            teachers={filteredTeachers}
            isLoading={isLoading}
            onEdit={handleEditTeacher}
            onView={handleViewTeacher}
            onRemove={isAdmin ? handleRemoveTeacher : undefined}
          />
        )}

        <Outlet context={{ loadTeachers }} />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={confirmRemoveTeacher}
          title='מחיקת מורה'
          message={
            <>
              <p>האם אתה בטוח שברצונך למחוק את המורה?</p>
              <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
            </>
          }
          confirmText='מחק'
          cancelText='ביטול'
          type='danger'
        />

        {/* Here you would include your TeacherForm component */}
        {/* <TeacherForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          teacher={selectedTeacher}
          onSave={loadTeachers}
        /> */}
      </main>

      <BottomNavbar />
    </div>
  );
}
