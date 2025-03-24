// src/pages/student/StudentIndex.tsx
import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useStudentStore } from '../store/studentStore.ts' 
import { StudentList } from '../cmps/StudentList.tsx'
import { StudentFilter } from '../services/studentService.ts'
import { Header } from '../cmps/Header.tsx'
import { BottomNavbar } from '../cmps/BottomNavbar.tsx'
import { Plus, Filter } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.ts'

export function StudentIndex() {
  const { 
    students, 
    isLoading, 
    error, 
    loadStudents, 
    removeStudent, 
    setFilter, 
    filterBy 
  } = useStudentStore()
  
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  const isAdmin = user?.roles.includes('מנהל')
  const isDetailPage = location.pathname.includes('/students/') && !location.pathname.endsWith('/students/')
  
  useEffect(() => {
    loadStudents()
  }, [loadStudents])
  
  const handleAddStudent = () => {
    navigate('/students/new')
  }
  
  const handleEditStudent = (studentId: string) => {
    navigate(`/students/${studentId}`)
  }
  
  const handleRemoveStudent = async (studentId: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תלמיד זה?')) {
      try {
        await removeStudent(studentId)
      } catch (err) {
        console.error('Failed to remove student:', err)
      }
    }
  }
  
  const handleFilter = (newFilter: Partial<StudentFilter>) => {
    setFilter(newFilter)
    loadStudents(newFilter)
  }
  
  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <div className="page-header">
          <h1>תלמידים</h1>
          
          <div className="actions">
            <button 
              className="btn-icon" 
              onClick={() => alert('Open filter dialog')}
              aria-label="סנן תלמידים"
            >
              <Filter />
            </button>
            
            {(isAdmin || user?.roles.includes('מורה')) && (
              <button 
                className="btn primary" 
                onClick={handleAddStudent}
              >
                <Plus className="icon" />
                תלמיד חדש
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {!isDetailPage && (
          <StudentList 
            students={students}
            isLoading={isLoading}
            onEdit={handleEditStudent}
            onRemove={isAdmin ? handleRemoveStudent : undefined}
          />
        )}
        
        <Outlet context={{ loadStudents }} />
      </main>
      
      <BottomNavbar />
    </div>
  )
}