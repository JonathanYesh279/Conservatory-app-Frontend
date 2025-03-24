// src/pages/student/StudentDetails.tsx
import { useState, useEffect, FormEvent } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { useStudentStore } from '../store/studentStore.ts'
import { Student } from '../services/studentService.ts'

interface OutletContextType {
  loadStudents: () => Promise<void>
}

export function StudentDetails() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { loadStudents } = useOutletContext<OutletContextType>()
  
  const { 
    selectedStudent, 
    loadStudentById, 
    saveStudent, 
    clearSelectedStudent,
    isLoading,
    error
  } = useStudentStore()
  
  const [formData, setFormData] = useState<Partial<Student> | null>(null)
  
  // Load student data
  useEffect(() => {
    if (studentId && studentId !== 'new') {
      loadStudentById(studentId)
    } else {
      clearSelectedStudent()
      setFormData({
        personalInfo: {
          fullName: '',
          phone: '',
          age: undefined,
          address: '',
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          studentEmail: '',
        },
        academicInfo: {
          instrument: '',
          currentStage: 1,
          class: '',
          tests: {
            stageTest: {
              status: 'לא נבחן',
              notes: '',
            },
            technicalTest: {
              status: 'לא נבחן',
              notes: '',
            },
          },
        },
        enrollments: {
          orchestraIds: [],
          ensembleIds: [],
          schoolYears: [],
        },
        isActive: true,
      })
    }
    
    return () => clearSelectedStudent()
  }, [studentId, loadStudentById, clearSelectedStudent])
  
  // Set form data when student loads
  useEffect(() => {
    if (selectedStudent) {
      setFormData(selectedStudent)
    }
  }, [selectedStudent])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Handle nested fields
    if (name.includes('.')) {
      const [section, field] = name.split('.')
      setFormData(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          [section]: {
            ...prev[section as keyof Student],
            [field]: type === 'number' ? Number(value) : value
          }
        }
      })
    } else {
      setFormData(prev => {
        if (!prev) return prev
        
        return {
          ...prev,
          [name]: type === 'number' ? Number(value) : value
        }
      })
    }
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!formData) return
    
    try {
      await saveStudent(formData)
      await loadStudents()
      navigate('/students')
    } catch (err) {
      console.error('Failed to save student:', err)
    }
  }
  
  const handleCancel = () => {
    navigate('/students')
  }
  
  if (isLoading && !formData) {
    return <div className="loading-state">טוען נתוני תלמיד...</div>
  }
  
  if (!formData) {
    return <div className="error-state">לא ניתן לטעון את נתוני התלמיד</div>
  }

  return (
    <div className="student-details">
      <div className="overlay" onClick={handleCancel}></div>
      
      <div className="details-modal">
        <h2>{studentId === 'new' ? 'תלמיד חדש' : 'עריכת תלמיד'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>פרטים אישיים</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="personalInfo.fullName">שם מלא</label>
                <input
                  type="text"
                  id="personalInfo.fullName"
                  name="personalInfo.fullName"
                  value={formData.personalInfo?.fullName || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="personalInfo.phone">טלפון</label>
                <input
                  type="tel"
                  id="personalInfo.phone"
                  name="personalInfo.phone"
                  value={formData.personalInfo?.phone || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="personalInfo.age">גיל</label>
                <input
                  type="number"
                  id="personalInfo.age"
                  name="personalInfo.age"
                  value={formData.personalInfo?.age || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="personalInfo.address">כתובת</label>
                <input
                  type="text"
                  id="personalInfo.address"
                  name="personalInfo.address"
                  value={formData.personalInfo?.address || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="personalInfo.parentName">שם הורה</label>
                <input
                  type="text"
                  id="personalInfo.parentName"
                  name="personalInfo.parentName"
                  value={formData.personalInfo?.parentName || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="personalInfo.parentPhone">טלפון הורה</label>
                <input
                  type="tel"
                  id="personalInfo.parentPhone"
                  name="personalInfo.parentPhone"
                  value={formData.personalInfo?.parentPhone || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="personalInfo.parentEmail">אימייל הורה</label>
                <input
                  type="email"
                  id="personalInfo.parentEmail"
                  name="personalInfo.parentEmail"
                  value={formData.personalInfo?.parentEmail || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="personalInfo.studentEmail">אימייל תלמיד</label>
                <input
                  type="email"
                  id="personalInfo.studentEmail"
                  name="personalInfo.studentEmail"
                  value={formData.personalInfo?.studentEmail || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>פרטים אקדמיים</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="academicInfo.instrument">כלי נגינה</label>
                <select
                  id="academicInfo.instrument"
                  name="academicInfo.instrument"
                  value={formData.academicInfo?.instrument || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">בחר כלי נגינה</option>
                  <option value="חצוצרה">חצוצרה</option>
                  <option value="חליל צד">חליל צד</option>
                  <option value="קלרינט">קלרינט</option>
                  <option value="קרן יער">קרן יער</option>
                  <option value="בריטון">בריטון</option>
                  <option value="טרומבון">טרומבון</option>
                  <option value="סקסופון">סקסופון</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="academicInfo.currentStage">שלב נוכחי</label>
                <select
                  id="academicInfo.currentStage"
                  name="academicInfo.currentStage"
                  value={formData.academicInfo?.currentStage || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="1">שלב 1</option>
                  <option value="2">שלב 2</option>
                  <option value="3">שלב 3</option>
                  <option value="4">שלב 4</option>
                  <option value="5">שלב 5</option>
                  <option value="6">שלב 6</option>
                  <option value="7">שלב 7</option>
                  <option value="8">שלב 8</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="academicInfo.class">כיתה</label>
                <select
                  id="academicInfo.class"
                  name="academicInfo.class"
                  value={formData.academicInfo?.class || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="">בחר כיתה</option>
                  <option value="א">א</option>
                  <option value="ב">ב</option>
                  <option value="ג">ג</option>
                  <option value="ד">ד</option>
                  <option value="ה">ה</option>
                  <option value="ו">ו</option>
                  <option value="ז">ז</option>
                  <option value="ח">ח</option>
                  <option value="ט">ט</option>
                  <option value="י">י</option>
                  <option value="יא">יא</option>
                  <option value="יב">יב</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={handleCancel}>
              ביטול
            </button>
            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}