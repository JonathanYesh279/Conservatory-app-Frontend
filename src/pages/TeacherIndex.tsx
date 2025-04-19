// src/pages/TeacherIndex.tsx (modified)
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../cmps/Header';
import { BottomNavbar } from '../cmps/BottomNavbar';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Searchbar } from '../cmps/Searchbar';
import { useSearchbar } from '../hooks/useSearchbar';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { useTeacherStore } from '../store/teacherStore';
import { Teacher } from '../services/teacherService';
import { TeacherList } from '../cmps/TeacherList';
import { TeacherForm } from '../cmps/TeacherForm';
import { StudentForm } from '../cmps/StudentForm';
import { Student } from '../services/studentService';

export function TeacherIndex() {
  const {
    teachers,
    isLoading,
    error,
    loadTeachers,
    removeTeacher,
    clearSelectedTeacher,
  } = useTeacherStore();

  // State for modal forms and dialogs
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  // State to pass back the newly created student
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);
  const [newTeacherInfo, setNewTeacherInfo] = useState<{ _id?: string; fullName: string; instrument?: string; } | null>(null);

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
  }, [loadTeachers]);

  // Handler functions for teacher CRUD operations
  const handleAddTeacher = () => {
    setTeacherToEdit(null);
    clearSelectedTeacher();
    setIsTeacherFormOpen(true);
  };

  const handleCloseTeacherForm = () => {
    setIsTeacherFormOpen(false);
    setTeacherToEdit(null);
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
    setTeacherToEdit(teacher);
    setIsTeacherFormOpen(true);
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
      try {
        await removeTeacher(teacherToDelete);
        setTeacherToDelete(null);
      } catch (err) {
        console.error('Failed to remove teacher:', err);
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

        {/* Teacher Form Modal */}
        <TeacherForm
          isOpen={isTeacherFormOpen}
          onClose={handleCloseTeacherForm}
          teacher={teacherToEdit || undefined}
          onSave={loadTeachers}
          onAddNewStudent={handleOpenStudentForm}
          newlyCreatedStudent={createdStudent}
        />

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
