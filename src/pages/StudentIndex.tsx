// src/pages/StudentIndex.tsx
import { useEffect } from 'react';
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

export function StudentIndex() {
  const { students, isLoading, error, loadStudents, removeStudent } =
    useStudentStore();

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
  const isDetailPage =
    location.pathname.includes('/students/') &&
    !location.pathname.endsWith('/students/');

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleAddStudent = () => {
    navigate('/students/new');
  };

  const handleEditStudent = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תלמיד זה?')) {
      try {
        await removeStudent(studentId);
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
            onRemove={isAdmin ? handleRemoveStudent : undefined}
          />
        )}

        <Outlet context={{ loadStudents }} />
      </main>

      <BottomNavbar />
    </div>
  );
}
