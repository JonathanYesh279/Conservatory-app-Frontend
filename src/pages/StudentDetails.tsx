import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../store/studentStore';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Music,
  Award,
  ArrowRight,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';

export function StudentDetails() {
  const { studentId } = useParams<{ studentId: string }>();
  const {
    selectedStudent,
    loadStudentById,
    clearSelectedStudent,
    isLoading,
    error,
  } = useStudentStore();

  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  // Load student data
  useEffect(() => {
    if (studentId && studentId !== 'new') {
      loadStudentById(studentId);
    }

    return () => clearSelectedStudent();
  }, [studentId, loadStudentById, clearSelectedStudent]);

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const goBack = () => {
    navigate('/students');
  };

  // Format a date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'לא זמין';

    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL');
  };

  if (isLoading) {
    return (
      <div className='loading-state'>
        <RefreshCw className='loading-icon' size={28} />
        <p>טוען פרטי תלמיד...</p>
      </div>
    );
  }

  if (error || !selectedStudent) {
    return (
      <div className='error-state'>
        <p>{error || 'לא ניתן לטעון את פרטי התלמיד'}</p>
        <button onClick={goBack} className='btn primary'>
          חזרה לרשימת התלמידים
        </button>
      </div>
    );
  }

  const student = selectedStudent;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get stage color based on stage number
  const getStageColor = (stage: number) => {
    const colors = [
      'var(--stage-1)',
      'var(--stage-2)',
      'var(--stage-3)',
      'var(--stage-4)',
      'var(--stage-5)',
      'var(--stage-6)',
      'var(--stage-7)',
      'var(--stage-8)',
    ];
    return colors[stage - 1] || colors[0];
  };

  return (
    <div className='student-details-content'>
      <div className='student-details-page'>

        <div className='student-card-container'>
          <div className={`card-content ${flipped ? 'flipped' : ''}`}>
            {/* Academic Info (Front) */}
            <div className='card-side card-front'>
              <div className='card-scroll-area'>
                <div className='section'>
                  <h2 className='section-title'>
                    <Music size={16} />
                    תזמורות
                  </h2>

                  {student.enrollments?.orchestraIds?.length > 0 ? (
                    <div className='orchestras-grid'>
                      {student.enrollments.orchestraIds.map(
                        (orchestraId, index) => (
                          <div key={orchestraId} className='orchestra-card'>
                            <Music size={18} />
                            <span>תזמורת {index + 1}</span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className='no-orchestra-warning'>
                      התלמיד אינו משתתף בתזמורות
                    </div>
                  )}
                </div>

                <div className='section'>
                  <h2 className='section-title'>
                    <Award size={16} />
                    מבחנים
                  </h2>

                  <div className='tests-grid'>
                    <div className='test-card'>
                      <div className='test-header'>
                        <h3>מבחן טכני</h3>
                        <span
                          className={`test-status ${
                            student.academicInfo.tests?.technicalTest
                              ?.status === 'עבר/ה'
                              ? 'passed'
                              : student.academicInfo.tests?.technicalTest
                                  ?.status === 'לא עבר/ה'
                              ? 'failed'
                              : ''
                          }`}
                        >
                          {student.academicInfo.tests?.technicalTest
                            ?.status || 'לא נבחן'}
                        </span>
                      </div>
                      {student.academicInfo.tests?.technicalTest
                        ?.lastTestDate && (
                        <div className='test-date'>
                          <Calendar size={12} />
                          <span>
                            {formatDate(
                              student.academicInfo.tests.technicalTest
                                .lastTestDate
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className='test-card'>
                      <div className='test-header'>
                        <h3>מבחן שלב</h3>
                        <span
                          className={`test-status ${
                            student.academicInfo.tests?.stageTest
                              ?.status === 'עבר/ה'
                              ? 'passed'
                              : student.academicInfo.tests?.stageTest
                                  ?.status === 'לא עבר/ה'
                              ? 'failed'
                              : ''
                          }`}
                        >
                          {student.academicInfo.tests?.stageTest?.status ||
                            'לא נבחן'}
                        </span>
                      </div>
                      {student.academicInfo.tests?.stageTest
                        ?.lastTestDate && (
                        <div className='test-date'>
                          <Calendar size={12} />
                          <span>
                            {formatDate(
                              student.academicInfo.tests.stageTest
                                .lastTestDate
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                <span>הצג פרטים אישיים</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Personal Info (Back) */}
            <div className='card-side card-back'>
              <div className='card-header'>
                <div className='student-identity'>
                  <div
                    className='avatar'
                    style={{
                      backgroundColor: getStageColor(
                        student.academicInfo.currentStage
                      ),
                    }}
                  >
                    {getInitials(student.personalInfo.fullName)}
                  </div>

                  <div className='header-text'>
                    <h1 className='student-name'>
                      {student.personalInfo.fullName}
                    </h1>
                    <div className='instrument'>
                      <Music size={14} />
                      <span>{student.academicInfo.instrument}</span>
                    </div>
                  </div>
                </div>

                <div
                  className='stage-badge'
                  style={{
                    backgroundColor: getStageColor(
                      student.academicInfo.currentStage
                    ),
                  }}
                >
                  שלב {student.academicInfo.currentStage}
                </div>
              </div>

              <div className='card-scroll-area'>
                <div className='section'>
                  <h2 className='section-title'>
                    <User size={16} />
                    פרטים אישיים
                  </h2>

                  <div className='info-grid'>
                    {student.personalInfo.phone && (
                      <div className='info-item'>
                        <Phone size={14} />
                        <div>
                          <span className='info-label'>טלפון</span>
                          <span className='info-value'>
                            {student.personalInfo.phone}
                          </span>
                        </div>
                      </div>
                    )}

                    {student.personalInfo.address && (
                      <div className='info-item'>
                        <MapPin size={14} />
                        <div>
                          <span className='info-label'>כתובת</span>
                          <span className='info-value'>
                            {student.personalInfo.address}
                          </span>
                        </div>
                      </div>
                    )}

                    {student.personalInfo.studentEmail && (
                      <div className='info-item'>
                        <Mail size={14} />
                        <div>
                          <span className='info-label'>אימייל</span>
                          <span className='info-value'>
                            {student.personalInfo.studentEmail}
                          </span>
                        </div>
                      </div>
                    )}

                    {student.createdAt && (
                      <div className='info-item'>
                        <Calendar size={14} />
                        <div>
                          <span className='info-label'>תאריך הצטרפות</span>
                          <span className='info-value'>
                            {formatDate(student.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className='info-item'>
                      <BookOpen size={14} />
                      <div>
                        <span className='info-label'>כיתה</span>
                        <span className='info-value'>
                          {student.academicInfo.class}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='section'>
                  <h2 className='section-title'>
                    <User size={16} />
                    פרטי הורה
                  </h2>

                  <div className='info-grid'>
                    {student.personalInfo.parentName && (
                      <div className='info-item'>
                        <User size={14} />
                        <div>
                          <span className='info-label'>שם הורה</span>
                          <span className='info-value'>
                            {student.personalInfo.parentName}
                          </span>
                        </div>
                      </div>
                    )}

                    {student.personalInfo.parentPhone && (
                      <div className='info-item'>
                        <Phone size={14} />
                        <div>
                          <span className='info-label'>טלפון הורה</span>
                          <span className='info-value'>
                            {student.personalInfo.parentPhone}
                          </span>
                        </div>
                      </div>
                    )}

                    {student.personalInfo.parentEmail && (
                      <div className='info-item'>
                        <Mail size={14} />
                        <div>
                          <span className='info-label'>אימייל הורה</span>
                          <span className='info-value'>
                            {student.personalInfo.parentEmail}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                <span>הצג מידע אקדמי</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
