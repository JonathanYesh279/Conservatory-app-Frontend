// src/cmps/student/StudentList.tsx
import { Student } from '../services/studentService.ts'
import { Edit, Trash2, Music, BookOpen, User } from 'lucide-react'

interface StudentListProps {
  students: Student[]
  isLoading: boolean
  onEdit: (studentId: string) => void
  onRemove?: (studentId: string) => void
}

export function StudentList({ students, isLoading, onEdit, onRemove }: StudentListProps) {
  if (isLoading && students.length === 0) {
    return <div className="loading-state">טוען תלמידים...</div>
  }
  
  if (students.length === 0) {
    return (
      <div className="empty-state">
        <p>לא נמצאו תלמידים להצגה</p>
        <p>נסה לשנות את מסנני החיפוש או להוסיף תלמידים חדשים</p>
      </div>
    )
  }
  
  // Get instrument emoji
  const getInstrumentEmoji = (instrument: string): string => {
    const instrumentMap: Record<string, string> = {
      'חצוצרה': '🎺',
      'חליל צד': '🎵',
      'קלרינט': '🎷',
      'קרן יער': '📯',
      'בריטון': '🎵',
      'טרומבון': '🎵',
      'סקסופון': '🎷'
    }
    
    return instrumentMap[instrument] || '🎵'
  }

  return (
    <div className="student-grid">
      {students.map(student => (
        <div 
          key={student._id} 
          className="student-card"
          onClick={() => onEdit(student._id)}
        >
          <div className="card-header">
            <div className="avatar">
              {getInstrumentEmoji(student.academicInfo.instrument)}
            </div>
            <h3 className="student-name">{student.personalInfo.fullName}</h3>
            <div className="stage-badge">שלב {student.academicInfo.currentStage}</div>
          </div>
          
          <div className="card-content">
            <div className="info-item">
              <Music className="icon" />
              <span>{student.academicInfo.instrument}</span>
            </div>
            
            <div className="info-item">
              <BookOpen className="icon" />
              <span>כיתה {student.academicInfo.class}</span>
            </div>
            
            {student.personalInfo.parentName && (
              <div className="info-item">
                <User className="icon" />
                <span>{student.personalInfo.parentName}</span>
              </div>
            )}
          </div>
          
          <div className="card-actions">
            <button 
              className="btn-icon" 
              onClick={(e) => {
                e.stopPropagation()
                onEdit(student._id)
              }}
              aria-label="ערוך תלמיד"
            >
              <Edit className="icon" />
            </button>
            
            {onRemove && (
              <button 
                className="btn-icon danger" 
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(student._id)
                }}
                aria-label="מחק תלמיד"
              >
                <Trash2 className="icon" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}