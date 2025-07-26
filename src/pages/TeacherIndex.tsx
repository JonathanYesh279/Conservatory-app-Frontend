import { useEffect, useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../cmps/Header';
import { BottomNavbar } from '../cmps/BottomNavbar';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Searchbar } from '../cmps/Searchbar';
import { useSearchAndFilterDropdown } from '../hooks/useSearchAndFilterDropdown.tsx';
import { FilterDropdown, FilterDropdownOptions } from '../cmps/FilterDropdown.tsx';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { useTeacherStore } from '../store/teacherStore';
import { Teacher } from '../services/teacherService';
import { TeacherList } from '../cmps/TeacherList';
import { TeacherForm } from '../cmps/TeacherForm';
import { StudentForm } from '../cmps/StudentForm/StudentForm';
import { Student } from '../services/studentService';
import { useAuthorization, createAuthorizationContext } from '../utils/authorization';
import { sanitizeError } from '../utils/errorHandler';
import { useToast } from '../cmps/Toast';

export function TeacherIndex() {
  const {
    teachers,
    isLoading,
    error,
    loadTeachers,
    removeTeacher,
    clearSelectedTeacher,
    setSelectedTeacher,
    selectedTeacher,
  } = useTeacherStore();

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  // State for modal forms and dialogs
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  // State to pass back the newly created student
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [newTeacherInfo, setNewTeacherInfo] = useState<{
    _id?: string;
    fullName: string;
    instrument?: string;
  } | null>(null);
  
  // Add filter dropdown state
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Define which fields to search in teachers - memoized to prevent infinite loop
  const teacherSearchFields = useMemo(() => (teacher: Teacher) => [
    teacher.personalInfo.fullName,
    teacher.professionalInfo?.instrument || '',
    teacher.personalInfo.email || '',
    teacher.personalInfo.phone || '',
  ], []);

  // Filter out current user from teachers list - memoized to prevent infinite loop
  const teachersWithoutCurrentUser = useMemo(() => {
    return teachers.filter(teacher => teacher._id !== user?._id);
  }, [teachers, user?._id]);

  // Use the enhanced search and filter dropdown hook
  const {
    filteredEntities: filteredTeachers,
    handleSearch,
    searchQuery,
    filters,
    handleApplyFilters,
    hasActiveFilters,
    availableInstruments
  } = useSearchAndFilterDropdown(
    teachersWithoutCurrentUser,
    teacherSearchFields,
    (teacher: Teacher) => teacher.professionalInfo?.instrument || '',
    undefined, // No age for teachers
    undefined, // No class for teachers
    (teacher: Teacher) => teacher.personalInfo.fullName
  );

  // Initialize authorization
  const authContext = createAuthorizationContext(user, isAuthenticated);
  const auth = useAuthorization(authContext);

  const isAdmin = auth.isAdmin();
  const isDetailPage =
    location.pathname.includes('/teachers/') &&
    !location.pathname.endsWith('/teachers/');

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Debug useEffect to monitor selectedTeacher state changes
  useEffect(() => {
    console.log(
      'Current selectedTeacher state in store:',
      selectedTeacher ? selectedTeacher.personalInfo?.fullName : 'null'
    );
  }, [selectedTeacher]);

  // Reset form state whenever isTeacherFormOpen changes to false
  useEffect(() => {
    if (!isTeacherFormOpen) {
      console.log('Form closed, clearing teacher state');
      setTeacherToEdit(null);
      clearSelectedTeacher();
      setCreatedStudent(null);
    }
  }, [isTeacherFormOpen, clearSelectedTeacher]);

  // Handler functions for teacher CRUD operations
  const handleAddTeacher = () => {
    try {
      auth.validateAction('add', undefined, 'teacher');
      
      // Important: First clear all teacher state before opening the form
      console.log('Adding new teacher, clearing previous teacher data');

      // Reset all teacher states properly
      clearSelectedTeacher(); // Clear the store state first
      setTeacherToEdit(null);
      setCreatedStudent(null);

      // Make sure the form is closed before opening it again
      // This ensures the useEffect for form closing will trigger
      // which helps reset state completely
      setIsTeacherFormOpen(false);

      // Now, after states are cleared, open the form in the next tick
      setTimeout(() => {
        console.log('Opening empty teacher form');
        setIsTeacherFormOpen(true);
      }, 10); // Small delay to ensure state updates have happened
    } catch (err) {
      const sanitizedError = sanitizeError(err);
      addToast({
        type: 'warning',
        message: sanitizedError.userMessage,
        autoCloseTime: 4000
      });
    }
  };

  const handleCloseTeacherForm = () => {
    console.log('Closing teacher form');
    // First close the form, then the useEffect will clean up the state
    setIsTeacherFormOpen(false);
  };

  const handleOpenStudentForm = (teacherInfo?: {
    fullName: string;
    instrument?: string;
  }) => {
    // If teacherInfo is provided, use it
    if (teacherInfo) {
      setNewTeacherInfo({
        fullName: teacherInfo.fullName,
        instrument: teacherInfo.instrument,
      });
    }
    setIsStudentFormOpen(true);
  };

  const handleCloseStudentForm = () => {
    setIsStudentFormOpen(false);
    setNewTeacherInfo(null); // Clear teacher info when closing student form
  };

  const handleStudentCreated = (student: Student) => {
    // Store the newly created student to pass back to TeacherForm
    setCreatedStudent(student);
    setIsStudentFormOpen(false);
    // Reopen the teacher form
    setIsTeacherFormOpen(true);
  };

  const handleEditTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId) || null;
    if (!teacher) return;
    
    try {
      auth.validateAction('edit', teacher, 'teacher');
      console.log('Editing teacher:', teacher?.personalInfo?.fullName);
      setTeacherToEdit(teacher);
      setSelectedTeacher(teacher); // Update the store as well
      setIsTeacherFormOpen(true);
    } catch (err) {
      const sanitizedError = sanitizeError(err);
      addToast({
        type: 'warning',
        message: sanitizedError.userMessage,
        autoCloseTime: 4000
      });
    }
  };

  const handleViewTeacher = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`);
  };

  const handleRemoveTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    if (!teacher) return;
    
    try {
      auth.validateAction('delete', teacher, 'teacher');
      setTeacherToDelete(teacherId);
      setIsConfirmDialogOpen(true);
    } catch (err) {
      const sanitizedError = sanitizeError(err);
      addToast({
        type: 'warning',
        message: sanitizedError.userMessage,
        autoCloseTime: 4000
      });
    }
  };

  const confirmRemoveTeacher = async () => {
    if (teacherToDelete) {
      try {
        await removeTeacher(teacherToDelete);
        setTeacherToDelete(null);
        setIsConfirmDialogOpen(false);
        
        // Show success toast
        addToast({
          type: 'success',
          message: 'המורה נמחק בהצלחה',
          autoCloseTime: 3000
        });
      } catch (err) {
        console.error('Failed to remove teacher:', err);
        const sanitizedError = sanitizeError(err);
        addToast({
          type: 'danger',
          message: sanitizedError.userMessage,
          autoCloseTime: 5000
        });
      }
    }
  };

  const handleFilter = () => {
    setIsFilterDropdownOpen(!isFilterDropdownOpen);
  };

  // Only admin can add new teachers
  const canAddTeacher = auth.canAddTeacher();

  // Handle successful save of a teacher
  const handleSaveSuccess = () => {
    console.log('Teacher saved successfully, cleaning up form state');
    setIsTeacherFormOpen(false);
    // The store's selectedTeacher is now cleared automatically in the saveTeacher method
    setTeacherToEdit(null);
    setCreatedStudent(null);

    // Refresh teacher list
    loadTeachers();
  };

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
                <div className='filter-container'>
                  <button
                    className={`btn-icon filter-btn ${hasActiveFilters ? 'active' : ''}`}
                    onClick={handleFilter}
                    aria-label='סנן מורים'
                  >
                    <Filter className='icon' />
                    {hasActiveFilters && <span className="filter-indicator" />}
                  </button>
                  
                  <FilterDropdown
                    isOpen={isFilterDropdownOpen}
                    onToggle={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    onApplyFilters={handleApplyFilters}
                    availableInstruments={availableInstruments}
                    ageRange={undefined}
                    classRange={undefined}
                    currentFilters={filters}
                    hasActiveFilters={hasActiveFilters}
                    entityType="teachers"
                  />
                </div>

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
            onRemove={handleRemoveTeacher}
            authContext={authContext}
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

        {/* Teacher Form Modal */}
        {isTeacherFormOpen && (
          <TeacherForm
            isOpen={isTeacherFormOpen}
            onClose={handleCloseTeacherForm}
            teacher={teacherToEdit || undefined}
            onSave={handleSaveSuccess}
            onAddNewStudent={handleOpenStudentForm}
            newlyCreatedStudent={createdStudent}
          />
        )}

        {/* Student Form Modal */}
        <StudentForm
          isOpen={isStudentFormOpen}
          onClose={handleCloseStudentForm}
          onStudentCreated={handleStudentCreated}
          newTeacherInfo={newTeacherInfo}
        />
      </main>

      {!isDetailPage && !isTeacherFormOpen && <BottomNavbar />}
    </div>
  );
}
