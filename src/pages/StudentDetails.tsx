import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStudentStore } from '../store/studentStore'
import { BottomNavbar } from '../cmps/BottomNavbar'
import { User, Calendar, MapPin, Phone, Mail, BookOpen, Music, Award, ArrowRight, ChevronLeft } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function StudentDetails() {
  const { studentId } = useParams<{ studentId: string }>()
  const { 
    selectedStudent, 
    loadStudentById,
    clearSelectedStudent,
    isLoading,
    error
  } = useStudentStore()
  
  const [flipped, setFlipped] = useState(false)
  const { theme } = useTheme()
  
  // Load student data
  useEffect(() => {
    if (studentId && studentId !== 'new') {
      loadStudentById(studentId)
    }
    
    return () => clearSelectedStudent()
  }, [studentId, loadStudentById, clearSelectedStudent])
  
  const toggleFlip = () => {
    setFlipped(!flipped)
  }
  
  // Format a date string
  const formatDate = (dateString) => {
    if (!dateString) return 'לא זמין'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL')
  }
  
  if (isLoading) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="loading-state">טוען פרטי תלמיד...</div>
        </main>
        <BottomNavbar />
      </div>
    )
  }
  
  if (error || !selectedStudent) {
    return (
      <div className="app-container">
        <main className="main-content">
          <div className="error-state">
            <p>{error || 'לא ניתן לטעון את פרטי התלמיד'}</p>
            <Link to="/students" className="btn primary">
              חזרה לרשימת התלמידים
            </Link>
          </div>
        </main>
        <BottomNavbar />
      </div>
    )
  }
  
  const student = selectedStudent

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  // Get stage color based on stage number
  const getStageColor = (stage) => {
    const colors = [
      'var(--stage-1)',
      'var(--stage-2)',
      'var(--stage-3)',
      'var(--stage-4)',
      'var(--stage-5)',
      'var(--stage-6)',
      'var(--stage-7)',
      'var(--stage-8)',
    ]
    return colors[stage - 1] || colors[0]
  }
  
  return (
    <div className="app-container">
      <main className="main-content">
        <div className="student-details-page">
          {/* Back button */}
          <Link to="/students" className="back-link">
            <ChevronLeft size={20} />
            <span>חזרה לרשימת התלמידים</span>
          </Link>
          
          {/* Student header */}
          <div className="profile-header">
            <div className="avatar-container">
              <div 
                className="avatar"
                style={{backgroundColor: getStageColor(student.academicInfo.currentStage)}}
              >
                {getInitials(student.personalInfo.fullName)}
              </div>
            </div>
            
            <div className="header-info">
              <h1 className="student-name">{student.personalInfo.fullName}</h1>
              <div className="badges">
                <span className="stage-badge" style={{backgroundColor: getStageColor(student.academicInfo.currentStage)}}>
                  שלב {student.academicInfo.currentStage}
                </span>
                <span className="instrument-badge">
                  <Music size={14} />
                  {student.academicInfo.instrument}
                </span>
              </div>
            </div>
          </div>
          
          {/* Desktop: Two-column layout */}
          <div className="desktop-view">
            <div className="profile-cards">
              {/* Personal Information Card */}
              <div className="profile-card personal-info-card">
                <h2 className="card-title">
                  <User size={18} />
                  פרטים אישיים
                </h2>
                
                <div className="info-list">
                  {student.personalInfo.phone && (
                    <div className="info-item">
                      <Phone size={16} />
                      <div>
                        <span className="info-label">טלפון</span>
                        <span className="info-value">{student.personalInfo.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.address && (
                    <div className="info-item">
                      <MapPin size={16} />
                      <div>
                        <span className="info-label">כתובת</span>
                        <span className="info-value">{student.personalInfo.address}</span>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.studentEmail && (
                    <div className="info-item">
                      <Mail size={16} />
                      <div>
                        <span className="info-label">אימייל</span>
                        <span className="info-value">{student.personalInfo.studentEmail}</span>
                      </div>
                    </div>
                  )}
                  
                  {student.createdAt && (
                    <div className="info-item">
                      <Calendar size={16} />
                      <div>
                        <span className="info-label">תאריך הצטרפות</span>
                        <span className="info-value">{formatDate(student.createdAt)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <h3 className="section-title">פרטי הורה</h3>
                <div className="info-list">
                  {student.personalInfo.parentName && (
                    <div className="info-item">
                      <User size={16} />
                      <div>
                        <span className="info-label">שם הורה</span>
                        <span className="info-value">{student.personalInfo.parentName}</span>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.parentPhone && (
                    <div className="info-item">
                      <Phone size={16} />
                      <div>
                        <span className="info-label">טלפון הורה</span>
                        <span className="info-value">{student.personalInfo.parentPhone}</span>
                      </div>
                    </div>
                  )}
                  
                  {student.personalInfo.parentEmail && (
                    <div className="info-item">
                      <Mail size={16} />
                      <div>
                        <span className="info-label">אימייל הורה</span>
                        <span className="info-value">{student.personalInfo.parentEmail}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Academic Information Card */}
              <div className="profile-card academic-info-card">
                <h2 className="card-title">
                  <BookOpen size={18} />
                  מידע אקדמי
                </h2>
                
                <div className="info-list">
                  <div className="info-item">
                    <Music size={16} />
                    <div>
                      <span className="info-label">כלי נגינה</span>
                      <span className="info-value">{student.academicInfo.instrument}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <Award size={16} />
                    <div>
                      <span className="info-label">שלב נוכחי</span>
                      <span className="info-value">שלב {student.academicInfo.currentStage}</span>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <BookOpen size={16} />
                    <div>
                      <span className="info-label">כיתה</span>
                      <span className="info-value">{student.academicInfo.class}</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="section-title">מבחנים</h3>
                <div className="tests-info">
                  <div className="test-item">
                    <div className="test-header">
                      <span className="test-name">מבחן טכני</span>
                      <span className={`test-status ${student.academicInfo.tests?.technicalTest?.status === 'עבר/ה' ? 'passed' : student.academicInfo.tests?.technicalTest?.status === 'לא עבר/ה' ? 'failed' : ''}`}>
                        {student.academicInfo.tests?.technicalTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                    {student.academicInfo.tests?.technicalTest?.lastTestDate && (
                      <div className="test-date">
                        <Calendar size={14} />
                        <span>תאריך אחרון: {formatDate(student.academicInfo.tests.technicalTest.lastTestDate)}</span>
                      </div>
                    )}
                    {student.academicInfo.tests?.technicalTest?.notes && (
                      <p className="test-notes">{student.academicInfo.tests.technicalTest.notes}</p>
                    )}
                  </div>
                  
                  <div className="test-item">
                    <div className="test-header">
                      <span className="test-name">מבחן שלב</span>
                      <span className={`test-status ${student.academicInfo.tests?.stageTest?.status === 'עבר/ה' ? 'passed' : student.academicInfo.tests?.stageTest?.status === 'לא עבר/ה' ? 'failed' : ''}`}>
                        {student.academicInfo.tests?.stageTest?.status || 'לא נבחן'}
                      </span>
                    </div>
                    {student.academicInfo.tests?.stageTest?.lastTestDate && (
                      <div className="test-date">
                        <Calendar size={14} />
                        <span>תאריך אחרון: {formatDate(student.academicInfo.tests.stageTest.lastTestDate)}</span>
                      </div>
                    )}
                    {student.academicInfo.tests?.stageTest?.notes && (
                      <p className="test-notes">{student.academicInfo.tests.stageTest.notes}</p>
                    )}
                  </div>
                </div>
                
                <h3 className="section-title">תזמורות ומבחני בגרות</h3>
                <div className="orchestras-info">
                  {student.enrollments?.orchestraIds?.length > 0 ? (
                    <div className="orchestra-list">
                      {student.enrollments.orchestraIds.map((orchestraId, index) => (
                        <div key={orchestraId} className="orchestra-badge">
                          <Music size={14} />
                          <span>תזמורת {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-orchestras">לא רשום לתזמורות</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile: Flip Card Layout */}
          <div className="mobile-view">
            <div className={`flip-card ${flipped ? 'flipped' : ''}`}>
              <div className="flip-card-inner">
                
                {/* Front Side: Personal Info */}
                <div className="flip-card-front">
                  <div className="profile-card personal-info-card">
                    <h2 className="card-title">
                      <User size={18} />
                      פרטים אישיים
                    </h2>
                    
                    <div className="info-list">
                      {student.personalInfo.phone && (
                        <div className="info-item">
                          <Phone size={16} />
                          <div>
                            <span className="info-label">טלפון</span>
                            <span className="info-value">{student.personalInfo.phone}</span>
                          </div>
                        </div>
                      )}
                      
                      {student.personalInfo.address && (
                        <div className="info-item">
                          <MapPin size={16} />
                          <div>
                            <span className="info-label">כתובת</span>
                            <span className="info-value">{student.personalInfo.address}</span>
                          </div>
                        </div>
                      )}
                      
                      {student.personalInfo.studentEmail && (
                        <div className="info-item">
                          <Mail size={16} />
                          <div>
                            <span className="info-label">אימייל</span>
                            <span className="info-value">{student.personalInfo.studentEmail}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="section-title">פרטי הורה</h3>
                    <div className="info-list">
                      {student.personalInfo.parentName && (
                        <div className="info-item">
                          <User size={16} />
                          <div>
                            <span className="info-label">שם הורה</span>
                            <span className="info-value">{student.personalInfo.parentName}</span>
                          </div>
                        </div>
                      )}
                      
                      {student.personalInfo.parentPhone && (
                        <div className="info-item">
                          <Phone size={16} />
                          <div>
                            <span className="info-label">טלפון הורה</span>
                            <span className="info-value">{student.personalInfo.parentPhone}</span>
                          </div>
                        </div>
                      )}
                      
                      {student.personalInfo.parentEmail && (
                        <div className="info-item">
                          <Mail size={16} />
                          <div>
                            <span className="info-label">אימייל הורה</span>
                            <span className="info-value">{student.personalInfo.parentEmail}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                   <button className="flip-button" onClick={toggleFlip}>
                      <span>הצג מידע אקדמי</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Back Side: Academic Info */}
                <div className="flip-card-back">
                  <div className="profile-card academic-info-card">
                    <h2 className="card-title">
                      <BookOpen size={18} />
                      מידע אקדמי
                    </h2>
                    
                    <div className="info-list">
                      <div className="info-item">
                        <Music size={16} />
                        <div>
                          <span className="info-label">כלי נגינה</span>
                          <span className="info-value">{student.academicInfo.instrument}</span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <Award size={16} />
                        <div>
                          <span className="info-label">שלב נוכחי</span>
                          <span className="info-value">שלב {student.academicInfo.currentStage}</span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <BookOpen size={16} />
                        <div>
                          <span className="info-label">כיתה</span>
                          <span className="info-value">{student.academicInfo.class}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="section-title">מבחנים</h3>
                    <div className="tests-info">
                      <div className="test-item">
                        <div className="test-header">
                          <span className="test-name">מבחן טכני</span>
                          <span className={`test-status ${student.academicInfo.tests?.technicalTest?.status === 'עבר/ה' ? 'passed' : student.academicInfo.tests?.technicalTest?.status === 'לא עבר/ה' ? 'failed' : ''}`}>
                            {student.academicInfo.tests?.technicalTest?.status || 'לא נבחן'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="test-item">
                        <div className="test-header">
                          <span className="test-name">מבחן שלב</span>
                          <span className={`test-status ${student.academicInfo.tests?.stageTest?.status === 'עבר/ה' ? 'passed' : student.academicInfo.tests?.stageTest?.status === 'לא עבר/ה' ? 'failed' : ''}`}>
                            {student.academicInfo.tests?.stageTest?.status || 'לא נבחן'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="section-title">תזמורות</h3>
                    <div className="orchestras-info">
                      {student.enrollments?.orchestraIds?.length > 0 ? (
                        <div className="orchestra-list">
                          {student.enrollments.orchestraIds.map((orchestraId, index) => (
                            <div key={orchestraId} className="orchestra-badge">
                              <Music size={14} />
                              <span>תזמורת {index + 1}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-orchestras">לא רשום לתזמורות</p>
                      )}
                    </div>
                    
                    <button className="flip-button" onClick={toggleFlip}>
                      <span>הצג פרטים אישיים</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavbar />
    </div>
  )
}