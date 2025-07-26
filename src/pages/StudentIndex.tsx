// src/pages/StudentIndex.tsx
import { useEffect, useState, useCallback } from 'react';
import {
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useStudentStore } from '../store/studentStore.ts';
import { StudentList } from '../cmps/StudentList.tsx';
import { Header } from '../cmps/Header.tsx';
import { BottomNavbar } from '../cmps/BottomNavbar.tsx';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { Searchbar } from '../cmps/Searchbar.tsx';
import { useSearchAndFilterDropdown } from '../hooks/useSearchAndFilterDropdown.tsx';
import { FilterDropdown, FilterDropdownOptions } from '../cmps/FilterDropdown.tsx';
import { Student } from '../services/studentService.ts';
import { StudentForm } from '../cmps/StudentForm/index.ts';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { useSchoolYearStore } from '../store/schoolYearStore';
import { useAuthorization, createAuthorizationContext } from '../utils/authorization';
import { sanitizeError } from '../utils/errorHandler';
import { useToast } from '../cmps/Toast';

export function StudentIndex() {
  const { students, isLoading, error, loadStudents, removeStudent } =
    useStudentStore();
  const { loadCurrentSchoolYear } = useSchoolYearStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [shouldRefreshList, setShouldRefreshList] = useState(false);

  // Add state for the confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  
  // Add filter dropdown state
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Define which fields to search in students
  const studentSearchFields = (student: Student) => {
    const fields = [
      student.personalInfo.fullName,
      student.academicInfo.instrument,
      student.academicInfo.class,
      student.personalInfo.parentName || '',
      student.personalInfo.studentEmail || '',
    ];

    return fields.filter((field): field is string => typeof field === 'string');
  };

  // Use the enhanced search and filter dropdown hook
  const {
    filteredEntities: filteredStudents,
    handleSearch,
    searchQuery,
    filters,
    handleApplyFilters,
    hasActiveFilters,
    availableInstruments,
    ageRange,
    classRange
  } = useSearchAndFilterDropdown(
    students,
    studentSearchFields,
    (student: Student) => student.academicInfo.instrument || '',
    (student: Student) => student.personalInfo.age || 0,
    (student: Student) => parseInt(student.academicInfo.class || '0') || 0,
    (student: Student) => student.personalInfo.fullName
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  // Initialize authorization
  const authContext = createAuthorizationContext(user, isAuthenticated);
  const auth = useAuthorization(authContext);

  const isAdmin = auth.isAdmin();
  const isDetailPage =
    location.pathname.includes('/students/') &&
    !location.pathname.endsWith('/students/');

  // Load students on mount and when returning to the page
  useEffect(() => {
    loadStudents();
    loadCurrentSchoolYear();
  }, [loadStudents, loadCurrentSchoolYear]);

  // Add a new effect to refresh the list when necessary
  useEffect(() => {
    if (shouldRefreshList) {
      loadStudents()
        .then(() => {
          console.log('Student list refreshed successfully');
          setShouldRefreshList(false);
        })
        .catch((error) => {
          console.error('Failed to refresh student list:', error);
          setShouldRefreshList(false);
        });
    }
  }, [shouldRefreshList, loadStudents]);

  // Effect to refresh the list when navigating back to the list view
  useEffect(() => {
    if (!isDetailPage && location.pathname === '/students') {
      setShouldRefreshList(true);
    }
  }, [location.pathname, isDetailPage]);

  // Effect to handle edit student navigation from details page
  useEffect(() => {
    const state = location.state as { editStudentId?: string } | null;
    if (state?.editStudentId) {
      const student = students.find((s) => s._id === state.editStudentId) || null;
      setSelectedStudent(student);
      setIsFormOpen(true);
      // Clear the state to prevent reopening on subsequent navigation
      navigate('/students', { replace: true, state: {} });
    }
  }, [location.state, navigate, students]);

  const handleAddStudent = () => {
    try {
      auth.validateAction('add', undefined, 'student');
      setSelectedStudent(null);
      setIsFormOpen(true);
    } catch (err) {
      const sanitizedError = sanitizeError(err);
      addToast({
        type: 'warning',
        message: sanitizedError.userMessage,
        autoCloseTime: 4000
      });
    }
  };

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setSelectedStudent(null);
    // Set the refresh flag when closing the form (after add/edit)
    setShouldRefreshList(true);
  }, []);

  const handleStudentCreated = useCallback(() => {
    console.log('Student created/updated, refreshing list');
    setShouldRefreshList(true);
  }, []);

  const handleEditStudent = (studentId: string) => {
    const student = students.find((s) => s._id === studentId) || null;
    if (!student) return;
    
    try {
      auth.validateAction('edit', student, 'student');
      setSelectedStudent(student);
      setIsFormOpen(true);
    } catch (err) {
      const sanitizedError = sanitizeError(err);
      addToast({
        type: 'warning',
        message: sanitizedError.userMessage,
        autoCloseTime: 4000
      });
    }
  };

  const handleViewStudent = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  // Updated to show confirmation dialog instead of browser prompt
  const handleRemoveStudent = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    if (!student) return;
    
    try {
      auth.validateAction('delete', student, 'student');
      setStudentToDelete(studentId);
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

  // Actual delete function to call when confirmed
  const confirmRemoveStudent = async () => {
    if (studentToDelete) {
      try {
        await removeStudent(studentToDelete);
        setStudentToDelete(null);
        // Refresh the list after removing a student
        setShouldRefreshList(true);
        
        // Show success toast
        addToast({
          type: 'success',
          message: 'התלמיד נמחק בהצלחה',
          autoCloseTime: 3000
        });
      } catch (err) {
        console.error('Failed to remove student:', err);
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

  const canAddStudent = auth.canAddStudent();

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
                placeholder='חיפוש תלמידים...'
              />

              <div className='action-buttons'>
                <div className='filter-container'>
                  <button
                    className={`btn-icon filter-btn ${hasActiveFilters ? 'active' : ''}`}
                    onClick={handleFilter}
                    aria-label='סנן תלמידים'
                  >
                    <Filter className='icon' />
                    {hasActiveFilters && <span className="filter-indicator" />}
                  </button>
                  
                  <FilterDropdown
                    isOpen={isFilterDropdownOpen}
                    onToggle={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    onApplyFilters={handleApplyFilters}
                    availableInstruments={availableInstruments}
                    ageRange={ageRange || undefined}
                    classRange={classRange || undefined}
                    currentFilters={filters}
                    hasActiveFilters={hasActiveFilters}
                    entityType="students"
                  />
                </div>

                {canAddStudent && (
                  <button
                    className='btn-icon add-btn'
                    onClick={handleAddStudent}
                    aria-label='הוספת תלמיד חדש'
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
          <StudentList
            students={filteredStudents}
            isLoading={isLoading}
            onEdit={handleEditStudent}
            onView={handleViewStudent}
            onRemove={handleRemoveStudent}
            authContext={authContext}
          />
        )}

        <Outlet
          context={{
            loadStudents,
            refreshList: () => setShouldRefreshList(true),
          }}
        />

        {/* Student Form Modal */}
        <StudentForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          onStudentCreated={handleStudentCreated}
          student={selectedStudent || undefined}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={confirmRemoveStudent}
          title='מחיקת תלמיד'
          message={
            <>
              <p>האם אתה בטוח שברצונך למחוק את התלמיד?</p>
              <p className='text-sm text-muted'>פעולה זו היא בלתי הפיכה.</p>
            </>
          }
          confirmText='מחק'
          cancelText='ביטול'
          type='danger'
        />

      </main>
      {!isDetailPage && !isFormOpen && <BottomNavbar />}
    </div>
  );
}
