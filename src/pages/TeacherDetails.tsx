import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { teacherService, Teacher } from '../services/teacherService'
import { Orchestra, orchestraService } from '../services/orchestraService'
import { studentService } from '../services/studentService'
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Music,
  Users,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock
} from 'lucide-react'

// Extend for student data reference
interface StudentReference {
  _id: string
  fullName: string
  instrument: string
}

interface StudentInfo {
  name: string
  instrument: string
}

// Define schedule item interface
interface ScheduleItem {
  studentId: string
  day: string
  time: string
  duration: number
  isActive: boolean
  studentName?: string
  instrument?: string
}

export function TeacherDetails() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [students, setStudents] = useState<StudentReference[]>([]);
  const [orchestras, setOrchestras] = useState<Orchestra[]>([]);
  const [orchestrasLoading, setOrchestrasLoading] = useState(false);

  // Schedule state
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New refresh trigger

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    students: true,
    orchestras: true,
    schedule: false,
    personalInfo: true,
    professionalInfo: true,
  });

  const navigate = useNavigate();

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Load teacher data when component mounts or refreshTrigger changes
  useEffect(() => {
    if (teacherId) {
      loadTeacher(teacherId);
    }
  }, [teacherId, refreshTrigger]);

  // Function to load teacher details
  const loadTeacher = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // First load teacher data
      const teacherData = await teacherService.getTeacherById(id);
      console.log('Teacher data loaded:', teacherData);

      // Save teacher data
      setTeacher(teacherData);

      // Process schedule data separately
      const schedule = teacherData.teaching?.schedule || [];
      console.log('Teacher schedule data:', schedule);

      // Initialize with placeholder student names for immediate display
      if (Array.isArray(schedule) && schedule.length > 0) {
        const initialItems = schedule
          .filter((item) => item.isActive !== false)
          .map((item) => ({
            ...item,
            studentName: `תלמיד ${item.studentId.slice(-6)}`, // Temporary
            instrument: '',
          }));

        setScheduleItems(initialItems);
      } else {
        setScheduleItems([]);
      }

      // Load students and update schedule items with real names
      if (
        teacherData.teaching?.studentIds &&
        teacherData.teaching.studentIds.length > 0
      ) {
        // Load students but don't await here - we'll process the schedule separately after
        loadStudents(
          teacherData.teaching.studentIds,
          teacherData.teaching.schedule
        );
      } else {
        // Clear students if there are none
        setStudents([]);
      }

      // Load orchestras
      if (
        teacherData.conducting?.orchestraIds &&
        teacherData.conducting.orchestraIds.length > 0
      ) {
        setOrchestrasLoading(true);
        await loadOrchestras(teacherData.conducting.orchestraIds);
      } else {
        // Clear orchestras if there are none
        setOrchestras([]);
      }
    } catch (err) {
      console.error('Failed to load teacher:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת פרטי המורה');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (
    studentIds: string[],
    scheduleData: any[] = []
  ) => {
    try {
      if (
        !studentIds ||
        !Array.isArray(studentIds) ||
        studentIds.length === 0
      ) {
        console.log('No student IDs provided');
        setStudents([]);
        return;
      }

      console.log('Loading students for IDs:', studentIds);

      // Here's the fix - using a safer approach for loading student data
      let studentData: any[] = [];

      try {
        // First try to load students by IDs in a single call
        studentData = await studentService.getStudentsByIds(studentIds);
        console.log(
          `Successfully loaded ${studentData.length}/${studentIds.length} students`
        );
      } catch (error) {
        console.error(`Failed to load students by IDs:`, error);

        // Fallback: try to load each student individually
        console.log('Falling back to individual student loading');
        const individualPromises = studentIds.map((id) =>
          studentService
            .getStudentById(id)
            .then((student) => {
              console.log(`Successfully loaded student ${id}`);
              return student;
            })
            .catch((err) => {
              console.error(`Failed to load student ${id}:`, err);
              return null;
            })
        );

        const results = await Promise.allSettled(individualPromises);
        studentData = results
          .filter(
            (result) => result.status === 'fulfilled' && result.value !== null
          )
          .map((result) => (result as PromiseFulfilledResult<any>).value);

        console.log(
          `Loaded ${studentData.length}/${studentIds.length} students individually`
        );
      }

      // Set students state for the students section
      setStudents(
        studentData.map((student) => ({
          _id: student._id,
          fullName: student.personalInfo.fullName || 'תלמיד ללא שם',
          instrument:
            student.academicInfo?.instrument ||
            student.academicInfo?.instrumentProgress?.[0]?.instrumentName ||
            '',
        }))
      );

      // Create a comprehensive lookup map with multiple ID formats
      const studentMap: Record<string, StudentInfo> = {};

      // Create student map with both the original ID and string versions
      studentData.forEach((student) => {
        if (student && student._id) {
          // Add every possible format of the ID as a key
          const formats = [
            student._id, // Original format
            student._id.toString(), // String version
            student._id.toString().replace(/"/g, ''), // Clean string without quotes
          ];

          // The value to store for each key format
          const studentInfo = {
            name: student.personalInfo?.fullName || 'תלמיד ללא שם',
            instrument:
              student.academicInfo?.instrument ||
              (student.academicInfo?.instrumentProgress &&
              student.academicInfo.instrumentProgress.length > 0
                ? student.academicInfo.instrumentProgress[0].instrumentName
                : ''),
          };

          // Store using each format as a key
          formats.forEach((format) => {
            studentMap[format.toString()] = studentInfo;
          });
        }
      });

      console.log('Enhanced student map:', studentMap);

      // Only process schedule if we have data
      if (Array.isArray(scheduleData) && scheduleData.length > 0) {
        console.log('Processing schedule items with student data');

        const newScheduleItems = scheduleData
          .filter((item) => item.isActive !== false)
          .map((item) => {
            // Try to find the student using various ID formats
            const studentId = item.studentId;
            const idFormats = [
              studentId,
              studentId.toString(),
              studentId.toString().replace(/"/g, ''),
            ];

            // Try all formats
            let studentInfo: StudentInfo | null = null;
            for (const format of idFormats) {
              if (studentMap[format.toString()]) {
                studentInfo = studentMap[format.toString()];
                console.log(
                  `Found student match for ID ${studentId} using format ${format}`
                );
                break;
              }
            }

            // If still not found, try partial matching
            if (!studentInfo) {
              const studentIdStr = studentId.toString().replace(/"/g, '');
              const matchingKey = Object.keys(studentMap).find(
                (key) =>
                  key.includes(studentIdStr) || studentIdStr.includes(key)
              );

              if (matchingKey) {
                studentInfo = studentMap[matchingKey];
                console.log(
                  `Found partial match for ID ${studentId} via key ${matchingKey}`
                );
              }
            }

            return {
              ...item,
              studentName: studentInfo
                ? studentInfo.name
                : `תלמיד ${studentId.toString().slice(-6)}`,
              instrument: studentInfo ? studentInfo.instrument : '',
            };
          });

        console.log(
          'New schedule items after mapping to student names:',
          newScheduleItems
        );
        setScheduleItems(newScheduleItems);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // Load orchestra details
  const loadOrchestras = async (orchestraIds: string[]) => {
    try {
      // Fetch orchestras by IDs
      const orchestraData = await orchestraService.getOrchestrasByIds(
        orchestraIds
      );
      setOrchestras(orchestraData);
    } catch (err) {
      console.error('Failed to load orchestras:', err);
    } finally {
      setOrchestrasLoading(false);
    }
  };

  // Toggle section visibility
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));

    // If opening students or schedule section, refresh data
    if (
      !openSections[section] &&
      (section === 'students' || section === 'schedule')
    ) {
      refreshData();
    }
  };

  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  const goBack = () => {
    navigate('/teachers');
  };

  // Navigate to student details
  const navigateToStudent = (studentId: string) => {
    navigate(`/students/${studentId}`);
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

  // Helper function to format time display
  const formatTimeDisplay = (time: string) => {
    // Check if time is already in correct format
    if (time && time.includes(':')) {
      return time;
    }

    // Return default if invalid
    return time || '08:00';
  };

  // Get day color for visual differentiation
  const getDayColor = (day: string) => {
    const dayColors: Record<string, string> = {
      ראשון: '#4D55CC',
      שני: '#28A745',
      שלישי: '#FFC107',
      רביעי: '#6f42c1',
      חמישי: '#fd7e14',
      שישי: '#20c997',
      שבת: '#e83e8c',
    };
    return dayColors[day] || '#6c757d';
  };

  if (isLoading) {
    return (
      <div className='loading-state'>
        <RefreshCw className='loading-icon' size={28} />
        <p>טוען פרטי מורה...</p>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className='error-state'>
        <p>{error || 'לא ניתן לטעון את פרטי המורה'}</p>
        <button onClick={goBack} className='btn primary'>
          חזרה לרשימת המורים
        </button>
      </div>
    );
  }

  // Check if we have schedule to display
  const hasSchedule =
    teacherId &&
    teacher.teaching?.schedule &&
    Array.isArray(teacher.teaching.schedule) &&
    teacher.teaching.schedule.length > 0;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role color
  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      מורה: '#4D55CC', // Primary color
      מנצח: '#28A745', // Success color
      'מדריך הרכב': '#FFC107', // Warning color
      מנהל: '#DC3545', // Danger color
    };
    return roleColors[role] || '#6c757d'; // Default color
  };

  // Get primary role for visualization
  const primaryRole =
    teacher.roles && teacher.roles.length > 0 ? teacher.roles[0] : 'מורה';

  // Organize scheduleItems by day
  const scheduleByDay = scheduleItems.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Sort days in correct order
  const dayOrder = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  // Sort schedule items by time within each day
  Object.keys(scheduleByDay).forEach((day) => {
    scheduleByDay[day].sort((a, b) => {
      if (!a.time || !b.time) return 0;
      return a.time.localeCompare(b.time);
    });
  });

  console.log('Rendering with schedule data:', {
    hasSchedule,
    numScheduleItems: scheduleItems.length,
    scheduleByDay,
    teacherSchedule: teacher.teaching?.schedule,
  });

  return (
    <div className='teacher-details-content'>
      <div className='teacher-details-page'>
        <div className='teacher-card-container'>
          <div className={`card-content ${flipped ? 'flipped' : ''}`}>
            {/* Professional Info (Front) */}
            <div className='card-side card-front'>
              {/* Header with avatar and name */}
              <div className='card-header'>
                <div className='teacher-identity'>
                  <div
                    className='avatar avatar-clickable'
                    style={{
                      backgroundColor: getRoleColor(primaryRole),
                    }}
                  >
                    {getInitials(teacher.personalInfo.fullName)}
                  </div>

                  <div className='header-text'>
                    <h1 className='teacher-name'>
                      {teacher.personalInfo.fullName}
                    </h1>
                    <div className='instrument'>
                      {teacher.professionalInfo?.instrument ? (
                        <>
                          <Music size={14} />
                          <span>{teacher.professionalInfo.instrument}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} />
                          <span>{primaryRole}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className='header-badges'>
                  {teacher.roles &&
                    teacher.roles.map((role: string) => (
                      <div
                        key={role}
                        className='role-badge'
                        style={{
                          backgroundColor: getRoleColor(role),
                        }}
                      >
                        {role}
                      </div>
                    ))}
                  <button
                    className='back-button'
                    onClick={goBack}
                    aria-label='חזרה'
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
              </div>

              <div className='card-scroll-area'>
                {/* Students Section - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.students ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('students')}
                  >
                    <Users size={16} />
                    <span>
                      תלמידים ({teacher.teaching?.studentIds?.length || 0})
                    </span>
                    {openSections.students ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.students && (
                    <div className='section-content'>
                      {students.length > 0 ? (
                        <div className='students-grid'>
                          {students.map((student) => (
                            <div
                              key={student._id}
                              className='student-card clickable'
                              onClick={() => navigateToStudent(student._id)}
                            >
                              <div className='student-avatar'>
                                {getInitials(student.fullName)}
                              </div>
                              <div className='student-info'>
                                <span className='student-name'>
                                  {student.fullName}
                                </span>
                                {student.instrument && (
                                  <span className='student-instrument'>
                                    {student.instrument}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : teacher.teaching?.studentIds?.length ? (
                        <div className='loading-section'>
                          <RefreshCw size={16} className='loading-icon' />
                          <span>טוען פרטי תלמידים...</span>
                          <button
                            className='refresh-btn'
                            onClick={refreshData}
                            aria-label='רענן נתונים'
                          >
                            לחץ לרענון
                          </button>
                        </div>
                      ) : (
                        <div className='no-students-message'>
                          למורה זה אין תלמידים
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Orchestras Section - Collapsible */}
                {teacher.conducting?.orchestraIds &&
                  teacher.conducting.orchestraIds.length > 0 && (
                    <div className='section'>
                      <div
                        className={`section-title clickable ${
                          openSections.orchestras ? 'active' : ''
                        }`}
                        onClick={() => toggleSection('orchestras')}
                      >
                        <Music size={16} />
                        <span>
                          מנצח על תזמורות (
                          {teacher.conducting.orchestraIds.length})
                        </span>
                        {openSections.orchestras ? (
                          <ChevronUp size={18} className='toggle-icon' />
                        ) : (
                          <ChevronDown size={18} className='toggle-icon' />
                        )}
                      </div>

                      {openSections.orchestras && (
                        <div className='section-content'>
                          {orchestrasLoading ? (
                            <div className='loading-section'>
                              <RefreshCw size={16} className='loading-icon' />
                              <span>טוען נתוני תזמורת...</span>
                            </div>
                          ) : orchestras.length > 0 ? (
                            <div className='orchestras-grid'>
                              {orchestras.map((orchestra) => (
                                <div
                                  key={orchestra._id}
                                  className='orchestra-card clickable'
                                  onClick={() =>
                                    navigateToOrchestra(orchestra._id)
                                  }
                                >
                                  <span>{orchestra.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className='no-orchestra-message'>
                              לא נמצאו פרטי תזמורות
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                {/* Teaching Schedule Section - Always show if this teacher is a teacher */}
                {teacher.roles.includes('מורה') && (
                  <div className='section'>
                    <div
                      className={`section-title clickable ${
                        openSections.schedule ? 'active' : ''
                      }`}
                      onClick={() => toggleSection('schedule')}
                    >
                      <Calendar size={16} />
                      <span>מערכת שעות ({scheduleItems.length})</span>
                      {openSections.schedule ? (
                        <ChevronUp size={18} className='toggle-icon' />
                      ) : (
                        <ChevronDown size={18} className='toggle-icon' />
                      )}
                    </div>

                    {openSections.schedule && (
                      <div className='section-content'>
                        {scheduleItems.length > 0 ? (
                          <div className='weekly-schedule'>
                            {/* Display schedule grouped by day */}
                            {dayOrder
                              .filter((day) => scheduleByDay[day])
                              .map((day) => (
                                <div key={day} className='schedule-day-group'>
                                  <div
                                    className='day-header'
                                    style={{
                                      backgroundColor: getDayColor(day),
                                      color: 'white',
                                      padding: '6px 10px',
                                      borderRadius: '4px',
                                      marginBottom: '8px',
                                      marginTop: '10px',
                                      fontWeight: 'bold',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}
                                  >
                                    <Calendar size={14} />
                                    <span>יום {day}</span>
                                  </div>
                                  <div className='day-schedule-items'>
                                    {scheduleByDay[day].map((item, index) => (
                                      <div
                                        key={`${item.studentId}-${index}`}
                                        className='schedule-item-card'
                                        style={{
                                          border:
                                            '1px solid var(--border-color)',
                                          borderRadius: '8px',
                                          padding: '10px',
                                          marginBottom: '8px',
                                          backgroundColor:
                                            'var(--bg-secondary, #f8f9fa)',
                                          boxShadow:
                                            '0 1px 3px rgba(0,0,0,0.05)',
                                        }}
                                      >
                                        <div
                                          className='schedule-item-header'
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                          }}
                                        >
                                          <div
                                            className='student-name'
                                            style={{ fontWeight: 'bold' }}
                                          >
                                            {item.studentName}
                                          </div>
                                          <div
                                            className='time-display'
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                            }}
                                          >
                                            <Clock size={14} />
                                            <span>
                                              {formatTimeDisplay(item.time)}
                                            </span>
                                            <span>({item.duration} דקות)</span>
                                          </div>
                                        </div>
                                        {item.instrument && (
                                          <div
                                            className='instrument-display'
                                            style={{
                                              fontSize: '0.85rem',
                                              marginTop: '4px',
                                              color:
                                                'var(--text-secondary, #6c757d)',
                                            }}
                                          >
                                            <Music
                                              size={12}
                                              style={{ marginLeft: '4px' }}
                                            />
                                            <span>{item.instrument}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}

                            {/* Show message if no schedule days found */}
                            {Object.keys(scheduleByDay).length === 0 && (
                              <div
                                className='no-schedule-message'
                                style={{ textAlign: 'center', padding: '20px' }}
                              >
                                <p>אין כרגע שיעורים במערכת</p>
                                <button
                                  className='refresh-btn'
                                  onClick={refreshData}
                                  style={{
                                    padding: '8px 16px',
                                    marginTop: '10px',
                                    backgroundColor: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    margin: '0 auto',
                                  }}
                                >
                                  <RefreshCw size={14} />
                                  רענן נתונים
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className='no-schedule-message'
                            style={{ textAlign: 'center', padding: '20px' }}
                          >
                            <p>אין כרגע שיעורים במערכת</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                {flipped ? (
                  <>
                    <span>הצג מידע מקצועי</span>
                    <ArrowLeft size={14} />
                  </>
                ) : (
                  <>
                    <span>הצג פרטים אישיים</span>
                    <ArrowLeft size={14} />
                  </>
                )}
              </button>
            </div>

            {/* Personal Info (Back) - remaining code kept the same */}
            <div className='card-side card-back'>
              {/* ... remaining code ... */}
              <div className='card-header'>
                <div className='teacher-identity'>
                  <div
                    className='avatar avatar-clickable'
                    style={{
                      backgroundColor: getRoleColor(primaryRole),
                    }}
                  >
                    {getInitials(teacher.personalInfo.fullName)}
                  </div>

                  <div className='header-text'>
                    <h1 className='teacher-name'>
                      {teacher.personalInfo.fullName}
                    </h1>
                    <div className='instrument'>
                      {teacher.professionalInfo?.instrument ? (
                        <>
                          <Music size={14} />
                          <span>{teacher.professionalInfo.instrument}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} />
                          <span>{primaryRole}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className='header-badges'>
                  {teacher.roles &&
                    teacher.roles.map((role: string) => (
                      <div
                        key={role}
                        className='role-badge'
                        style={{
                          backgroundColor: getRoleColor(role),
                        }}
                      >
                        {role}
                      </div>
                    ))}
                  <button
                    className='back-button'
                    onClick={goBack}
                    aria-label='חזרה'
                  >
                    <ArrowLeft size={20} />
                  </button>
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

                  {openSections.personalInfo && (
                    <div className='section-content'>
                      <div className='info-grid'>
                        {teacher.personalInfo.phone && (
                          <div className='info-item'>
                            <Phone size={14} />
                            <div>
                              <span className='info-label'>טלפון</span>
                              <span className='info-value'>
                                {teacher.personalInfo.phone}
                              </span>
                            </div>
                          </div>
                        )}

                        {teacher.personalInfo.address && (
                          <div className='info-item'>
                            <MapPin size={14} />
                            <div>
                              <span className='info-label'>כתובת</span>
                              <span className='info-value'>
                                {teacher.personalInfo.address}
                              </span>
                            </div>
                          </div>
                        )}

                        {teacher.personalInfo.email && (
                          <div className='info-item'>
                            <Mail size={14} />
                            <div>
                              <span className='info-label'>אימייל</span>
                              <span className='info-value'>
                                {teacher.personalInfo.email}
                              </span>
                            </div>
                          </div>
                        )}

                        {teacher.createdAt && (
                          <div className='info-item'>
                            <Calendar size={14} />
                            <div>
                              <span className='info-label'>תאריך הצטרפות</span>
                              <span className='info-value'>
                                {formatDate(teacher.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Professional Info - Collapsible */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.professionalInfo ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('professionalInfo')}
                  >
                    <BookOpen size={16} />
                    <span>מידע מקצועי</span>
                    {openSections.professionalInfo ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.professionalInfo && (
                    <div className='section-content'>
                      <div className='info-grid'>
                        {teacher.professionalInfo?.instrument && (
                          <div className='info-item'>
                            <Music size={14} />
                            <div>
                              <span className='info-label'>כלי נגינה</span>
                              <span className='info-value'>
                                {teacher.professionalInfo.instrument}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className='info-item'>
                          <Calendar size={14} />
                          <div>
                            <span className='info-label'>תאריך הצטרפות</span>
                            <span className='info-value'>
                              {formatDate(teacher.createdAt || '')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                {flipped ? (
                  <>
                    <span>הצג מידע מקצועי</span>
                    <ArrowLeft size={14} />
                  </>
                ) : (
                  <>
                    <span>הצג פרטים אישיים</span>
                    <ArrowLeft size={14} />
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