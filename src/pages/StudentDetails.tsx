import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../store/studentStore';
import { Orchestra, orchestraService } from '../services/orchestraService';
import { teacherService } from '../services/teacherService';
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
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Define attendance record type
interface AttendanceRecord {
  date: string;
  status: 'הגיע/ה' | 'לא הגיע/ה';
  sessionId: string;
  notes?: string;
}

// Define attendance stats type
interface AttendanceStats {
  attendanceRate: number;
  attended: number;
  totalRehearsals: number;
  recentHistory: AttendanceRecord[];
  message?: string;
}

// Define teacher data type
interface TeacherData {
  id: string;
  name: string;
  instrument?: string;
}

export function StudentDetails() {
  const { studentId } = useParams<{ studentId: string }>();
  const {
    selectedStudent,
    loadStudentById,
    isLoading,
    error,
  } = useStudentStore();

  const [flipped, setFlipped] = useState(false);
  const [attendanceStats, setAttendanceStats] =
    useState<AttendanceStats | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [orchestrasLoading, setOrchestrasLoading] = useState(false);
  const navigate = useNavigate();

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    teacher: true,
    orchestras: true,
    tests: false,
    attendance: false,
    personalInfo: false,
    parentInfo: false,
  });

  // Toggle section visibility
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Load student data when component mounts
  useEffect(() => {
    if (studentId) {
      loadStudentById(studentId);
    }
  }, [studentId, loadStudentById]);

  // Load teacher data when student is loaded
  useEffect(() => {
    if (selectedStudent?.teacherIds?.length) {
      setTeacherLoading(true);
      const fetchTeacher = async () => {
        try {
          // Fetch the first teacher (assuming one teacher per student for now)
          const teacher = await teacherService.getTeacherById(
            selectedStudent.teacherIds[0]
          );
          setTeacherData({
            id: teacher._id,
            name: teacher.personalInfo.fullName,
            instrument: teacher.professionalInfo?.instrument,
          });
        } catch (error) {
          console.error('Failed to fetch teacher data:', error);
        } finally {
          setTeacherLoading(false);
        }
      };

      fetchTeacher();
    }
  }, [selectedStudent]);

  // Load orchestra data when student is loaded
  useEffect(() => {
    if (selectedStudent?.enrollments?.orchestraIds && selectedStudent.enrollments.orchestraIds.length > 0) {
      setOrchestrasLoading(true);
      const fetchOrchestras = async () => {
        try {
          const orchestraIds = selectedStudent!.enrollments.orchestraIds
          const orchestraData = await orchestraService.getOrchestrasByIds(
            orchestraIds
          );
          setOrchestras(orchestraData);
        } catch (error) {
          console.error('Failed to fetch orchestra data:', error);
        } finally {
          setOrchestrasLoading(false);
        }
      };

      fetchOrchestras();
    }
  }, [selectedStudent]);

  // Separate effect for loading attendance data
  useEffect(() => {
    if (
      selectedStudent &&
      selectedStudent.enrollments?.orchestraIds?.length > 0
    ) {
      // In a real application, this would be an API call:
      // fetch(`/api/orchestra/${selectedStudent.enrollments.orchestraIds[0]}/student/${selectedStudent._id}/attendance`)

      // Simulated attendance stats - this would be fetched from an API
      setAttendanceStats({
        attendanceRate: 85,
        attended: 17,
        totalRehearsals: 20,
        recentHistory: [
          { date: '2023-06-01', status: 'הגיע/ה', sessionId: '1' },
          { date: '2023-05-25', status: 'הגיע/ה', sessionId: '2' },
          { date: '2023-05-18', status: 'לא הגיע/ה', sessionId: '3' },
          { date: '2023-05-11', status: 'הגיע/ה', sessionId: '4' },
          { date: '2023-05-04', status: 'הגיע/ה', sessionId: '5' },
        ],
      });
    }
  }, [selectedStudent]);

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const goBack = () => {
    navigate('/students');
  };

  // Navigate to teacher details
  const navigateToTeacher = (teacherId: string) => {
    navigate(`/teachers/${teacherId}`);
  };

  // Navigate to orchestra details
  const navigateToOrchestra = (orchestraId: string) => {
    navigate(`/orchestras/${orchestraId}`);
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
            {/* Academic Info (Front) - Now the primary side */}
            <div className='card-side card-front'>
              {/* Header with avatar and name - moved from back side */}
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

                <div className='header-badges'>
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
                  <div
                    className='grade-badge'
                    style={{
                      backgroundColor: '#348b49',
                    }}
                  >
                    כיתה {student.academicInfo.class}
                  </div>
                </div>
              </div>

              <div className='card-scroll-area'>
                {/* Teacher Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.teacher ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('teacher')}
                  >
                    <User size={16} />
                    <span>מורה</span>
                    {openSections.teacher ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.teacher && (
                    <div className='section-content'>
                      {teacherLoading ? (
                        <div className='loading-section'>
                          <RefreshCw size={16} className='loading-icon' />
                          <span>טוען פרטי מורה...</span>
                        </div>
                      ) : teacherData ? (
                        <div
                          className='teacher-info clickable'
                          onClick={() => navigateToTeacher(teacherData.id)}
                        >
                          <User size={14} />
                          <span>{teacherData.name}</span>
                        </div>
                      ) : (
                        <div className='no-teacher-warning'>
                          לא הוקצה מורה לתלמיד
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Orchestras Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.orchestras ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('orchestras')}
                  >
                    <Music size={16} />
                    <span>תזמורות</span>
                    {openSections.orchestras ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.orchestras && (
                    <div className='section-content'>
                      {student.enrollments?.orchestraIds?.length > 0 ? (
                        orchestrasLoading ? (
                          <div className='loading-section'>
                            <RefreshCw size={16} className='loading-icon' />
                            <span>טוען נתוני תזמורת...</span>
                          </div>
                        ) : (
                          <div className='orchestras-grid'>
                            {orchestras.map((orchestra) => (
                              <div
                                key={orchestra._id}
                                className='orchestra-card clickable'
                                onClick={() =>
                                  navigateToOrchestra(orchestra._id)
                                }
                              >
                                <Music size={18} />
                                <span>{orchestra.name}</span>
                              </div>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className='no-orchestra-warning'>
                          התלמיד אינו משתתף בתזמורות
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tests Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.tests ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('tests')}
                  >
                    <Award size={16} />
                    <span>מבחנים</span>
                    {openSections.tests ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.tests && (
                    <div className='section-content'>
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
                  )}
                </div>

                {/* Attendance Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.attendance ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('attendance')}
                  >
                    <Calendar size={16} />
                    <span>נוכחות</span>
                    {openSections.attendance ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.attendance && (
                    <div className='section-content'>
                      {student.enrollments?.orchestraIds?.length > 0 ? (
                        <div className='attendance-container'>
                          {/* If we have attendance stats */}
                          {attendanceStats ? (
                            <>
                              <div className='attendance-summary'>
                                <div className='attendance-stat'>
                                  <span className='stat-label'>
                                    שיעור נוכחות
                                  </span>
                                  <div className='attendance-rate'>
                                    {Math.round(attendanceStats.attendanceRate)}
                                    %
                                  </div>
                                </div>
                                <div className='attendance-stat'>
                                  <span className='stat-label'>נוכח</span>
                                  <div className='attendance-count'>
                                    {attendanceStats.attended} /{' '}
                                    {attendanceStats.totalRehearsals}
                                  </div>
                                </div>
                              </div>

                              {attendanceStats.recentHistory?.length > 0 && (
                                <div className='attendance-history'>
                                  <h3 className='history-title'>
                                    היסטוריית נוכחות אחרונה
                                  </h3>
                                  <div className='history-entries'>
                                    {attendanceStats.recentHistory.map(
                                      (record, index) => (
                                        <div
                                          key={index}
                                          className='history-entry'
                                        >
                                          <div
                                            className={`status-indicator ${
                                              record.status === 'הגיע/ה'
                                                ? 'present'
                                                : 'absent'
                                            }`}
                                          />
                                          <span className='history-date'>
                                            {formatDate(record.date)}
                                          </span>
                                          <span
                                            className={`history-status ${
                                              record.status === 'הגיע/ה'
                                                ? 'present'
                                                : 'absent'
                                            }`}
                                          >
                                            {record.status}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className='loading-attendance'>
                              <RefreshCw size={16} className='loading-icon' />
                              <span>טוען נתוני נוכחות...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className='no-orchestra-warning'>
                          אין נתוני נוכחות עבור תלמיד שאינו משתתף בתזמורות
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                {flipped ? (
                  <>
                    <span>הצג מידע אקדמי</span>
                    <ArrowRight size={14} />
                  </>
                ) : (
                  <>
                    <span>הצג פרטים אישיים</span>
                    <ArrowRight size={14} />
                  </>
                )}
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

                <div className='header-badges'>
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
                  <div
                    className='grade-badge'
                    style={{
                      backgroundColor: '#348b49',
                    }}
                  >
                    כיתה {student.academicInfo.class}
                  </div>
                </div>
              </div>

              <div className='card-scroll-area'>
                {/* Personal Info Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.personalInfo ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('personalInfo')}
                  >
                    <User size={16} />
                    <span>פרטים אישיים</span>
                    {openSections.personalInfo ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.personalInfo &&
                  (student.personalInfo.phone ||
                    student.personalInfo.address ||
                    student.personalInfo.studentEmail ||
                    student.createdAt ||
                    student.academicInfo.class) ? (
                    <div className='section-content'>
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
                  ) : openSections.personalInfo ? (
                    <div className='section-content'>
                      <div className='no-data-message'>אין פרטים אישיים</div>
                    </div>
                  ) : null}
                </div>

                {/* Parent Info Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.parentInfo ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('parentInfo')}
                  >
                    <User size={16} />
                    <span>פרטי הורה</span>
                    {openSections.parentInfo ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.parentInfo &&
                  ((student.personalInfo.parentName &&
                    student.personalInfo.parentName !== 'לא צוין') ||
                    (student.personalInfo.parentPhone &&
                      student.personalInfo.parentPhone !== 'לא צוין' &&
                      student.personalInfo.parentPhone !== '0500000000') ||
                    (student.personalInfo.parentEmail &&
                      student.personalInfo.parentEmail !== 'לא צוין' &&
                      student.personalInfo.parentEmail !==
                        'parent@example.com')) ? (
                    <div className='section-content'>
                      <div className='info-grid'>
                        {student.personalInfo.parentName &&
                          student.personalInfo.parentName !== 'לא צוין' && (
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

                        {student.personalInfo.parentPhone &&
                          student.personalInfo.parentPhone !== 'לא צוין' &&
                          student.personalInfo.parentPhone !== '0500000000' && (
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

                        {student.personalInfo.parentEmail &&
                          student.personalInfo.parentEmail !== 'לא צוין' &&
                          student.personalInfo.parentEmail !==
                            'parent@example.com' && (
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
                  ) : openSections.parentInfo ? (
                    <div className='section-content'>
                      <div className='no-data-message'>אין פרטי הורה</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                {flipped ? (
                  <>
                    <span>הצג מידע אקדמי</span>
                    <ArrowRight size={14} />
                  </>
                ) : (
                  <>
                    <span>הצג פרטים אישיים</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
