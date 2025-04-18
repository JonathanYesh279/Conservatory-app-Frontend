// src/pages/StudentIndex.tsx
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStudentStore } from '../store/studentStore.ts';
import { StudentList } from '../cmps/StudentList.tsx';
import { Header } from '../cmps/Header.tsx';
import { BottomNavbar } from '../cmps/BottomNavbar.tsx';
import { Filter, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { Searchbar } from '../cmps/Searchbar.tsx';
import { useSearchbar } from '../hooks/useSearchbar.tsx';
import { Student } from '../services/studentService.ts';
import { StudentForm } from '../cmps/StudentForm';
import { ConfirmDialog } from '../cmps/ConfirmDialog';
import { useSchoolYearStore } from '../store/schoolYearStore';

export function StudentIndex() {
  const { students, isLoading, error, loadStudents, removeStudent } =
    useStudentStore();
  const { loadCurrentSchoolYear } = useSchoolYearStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Add state for the confirmation dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  // Define which fields to search in students
  const studentSearchFields = (student: Student) => [
    student.personalInfo.fullName,
    student.academicInfo.instrument,
    student.academicInfo.class,
    student.personalInfo.parentName || '',
    student.personalInfo.studentEmail || '',
  ];

  // Use the search hook
  const { filteredEntities: filteredStudents, handleSearch } = useSearchbar(
    students,
    studentSearchFields
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.roles.includes('מנהל');
  const isDetailPage = location.pathname.includes('/students/') && !location.pathname.endsWith('/students/');

  useEffect(() => {
    loadStudents();
    loadCurrentSchoolYear();
  }, [loadStudents, loadCurrentSchoolYear]);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedStudent(null);
  };

  const handleEditStudent = (studentId: string) => {
    const student = students.find((s) => s._id === studentId) || null;
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleViewStudent = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  // Updated to show confirmation dialog instead of browser prompt
  const handleRemoveStudent = (studentId: string) => {
    const student = students.find((s) => s._id === studentId);
    if (student) {
      setStudentToDelete(studentId);
      setIsConfirmDialogOpen(true);
    }
  };

  // Actual delete function to call when confirmed
  const confirmRemoveStudent = async () => {
    if (studentToDelete) {
      try {
        await removeStudent(studentToDelete);
        setStudentToDelete(null);
      } catch (err) {
        console.error('Failed to remove student:', err);
      }
    }
  };

  const handleFilter = () => {
    // This would open your filter dialog
    alert('Open filter dialog');
  };

  const canAddStudent = isAdmin || user?.roles.includes('מורה');

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
                <button
                  className='btn-icon filter-btn'
                  onClick={handleFilter}
                  aria-label='סנן תלמידים'
                >
                  <Filter className='icon' />
                </button>

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
            onRemove={isAdmin ? handleRemoveStudent : undefined}
          />
        )}

        <Outlet context={{ loadStudents }} />

        {/* Student Form Modal */}
        <StudentForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
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
