import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { teacherService, Teacher } from '../services/teacherService'
import { Orchestra, orchestraService } from '../services/orchestraService'
import { studentService } from '../services/studentService'
import { theoryService, TheoryLesson } from '../services/theoryService'
import { TeacherTheoryLessonsSection } from '../cmps/TeacherDetails'
import { TeacherTimeBlockManager } from '../cmps/TeacherForm/TeacherTimeBlockManager'
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
  Clock,
} from 'lucide-react'

// Extend for student data reference
interface StudentReference {
  _id: string
  fullName: string
  instrument: string
  assignments?: Array<{
    teacherId: string;
    scheduleSlotId: string;
    day: string;
    time: string;
    duration: number;
  }>
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Theory lessons state
  const [theoryLessons, setTheoryLessons] = useState<TheoryLesson[]>([]);
  const [theoryLessonsLoading, setTheoryLessonsLoading] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    students: false,
    orchestras: false,
    theoryLessons: false,
    personalInfo: false,
    professionalInfo: false,
    schedule: true, // Schedule section open by default
  });

  const navigate = useNavigate();

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Load teacher data when component mounts or refreshTrigger changes
  useEffect(() => {
    if (teacherId && !isLoading) {
      console.log('TeacherDetails useEffect triggered for teacherId:', teacherId, 'refreshTrigger:', refreshTrigger);
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

      // Load related data if teacher data exists
      if (teacherData) {
        // Load theory lessons for this teacher
        await loadTheoryLessons(id);

        // Load students - try both approaches
        let studentsLoaded = false;
        
        // First try loading from teacher's studentIds
        if (
          teacherData.teaching?.studentIds &&
          teacherData.teaching.studentIds.length > 0
        ) {
          await loadStudents(teacherData.teaching.studentIds);
          studentsLoaded = true;
        }
        
        // If no students from teacher's list, search for students who have this teacher assigned
        if (!studentsLoaded) {
          await loadStudentsByTeacherAssignment(id);
        }

        // Load orchestras if there are orchestra IDs
        if (
          teacherData.conducting?.orchestraIds &&
          teacherData.conducting.orchestraIds.length > 0
        ) {
          setOrchestrasLoading(true);
          await loadOrchestras(teacherData.conducting.orchestraIds);
        } else {
          setOrchestras([]);
        }
      }
    } catch (err) {
      console.error('Failed to load teacher:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת פרטי המורה');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (studentIds: string[]) => {
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
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // Load students by searching for teacher assignments
  const loadStudentsByTeacherAssignment = async (teacherId: string) => {
    try {
      console.log('Searching for students with teacher assignment for teacher:', teacherId);
      
      // Get all students (we could optimize this later with a backend endpoint)
      const allStudents = await studentService.getStudents();
      console.log('Total students found:', allStudents.length);
      
      // Filter students who have this teacher assigned
      const studentsWithTeacher = allStudents.filter(student => {
        // Check if student has this teacher in teacherIds
        const hasTeacherInIds = student.teacherIds && student.teacherIds.includes(teacherId);
        
        // Check if student has assignments with this teacher
        const hasTeacherAssignments = student.teacherAssignments && 
          student.teacherAssignments.some((assignment: any) => assignment.teacherId === teacherId);
          
        return hasTeacherInIds || hasTeacherAssignments;
      });
      
      console.log('Students with this teacher:', studentsWithTeacher.length);
      
      // Set students state with assignment details
      setStudents(
        studentsWithTeacher.map((student) => ({
          _id: student._id,
          fullName: student.personalInfo?.fullName || 'תלמיד לא ידוע',
          instrument:
            student.academicInfo?.instrumentProgress?.[0]?.instrumentName || '',
          // Add assignment details for display
          assignments: student.teacherAssignments?.filter((assignment: any) => assignment.teacherId === teacherId) || []
        }))
      );
    } catch (err) {
      console.error('Failed to load students by teacher assignment:', err);
      setStudents([]);
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

  // Navigate to theory lesson details
  const navigateToTheoryLesson = (theoryLessonId: string) => {
    navigate(`/theory/${theoryLessonId}`);
  };

  // Load theory lessons for teacher
  const loadTheoryLessons = async (teacherId: string) => {
    if (!teacherId) return;
    
    setTheoryLessonsLoading(true);
    try {
      const lessons = await theoryService.getTheoryLessonsByTeacher(teacherId);
      console.log('Loaded theory lessons for teacher:', lessons);
      setTheoryLessons(lessons);
    } catch (error) {
      console.error('Failed to load theory lessons for teacher:', error);
    } finally {
      setTheoryLessonsLoading(false);
    }
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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to calculate end time from start time and duration
  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Function to format lesson time with duration
  const formatLessonTime = (startTime: string, duration: number): string => {
    const endTime = calculateEndTime(startTime, duration);
    return `${startTime} - ${endTime}`;
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
                      תלמידים ({students.length})
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
                        <div className='students-grid modern-students-grid'>
                          {students.map((student) => (
                            <div
                              key={student._id}
                              className='student-card modern-student-card clickable'
                              onClick={() => navigateToStudent(student._id)}
                            >
                              <div className='student-main'>
                                <div className='student-identity'>
                                  <div className='student-info'>
                                    <div className='student-name'>
                                      {student.fullName}
                                    </div>
                                    {student.assignments && student.assignments.length > 0 && (
                                      <div className='student-lessons-count'>
                                        <span>{student.assignments.length} שיעורים</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Display lesson assignments */}
                              {student.assignments && student.assignments.length > 0 && (
                                <div className='student-lessons'>
                                  <div className='lessons-header'>
                                    <Calendar size={12} />
                                    <span>מערכת שיעורים</span>
                                  </div>
                                  <div className='lessons-list'>
                                    {student.assignments.map((assignment, index) => (
                                      <div key={index} className='lesson-item'>
                                        <div className='lesson-day'>{assignment.day}</div>
                                        <div className='lesson-time'>
                                          <Clock size={10} />
                                          <span>{formatLessonTime(assignment.time, assignment.duration)}</span>
                                        </div>
                                        <div className='lesson-duration'>
                                          {assignment.duration}ד'
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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

                {/* Theory Lessons Section - Only show if there are theory lessons */}
                {theoryLessons.length > 0 && (
                  <TeacherTheoryLessonsSection
                    teacher={teacher}
                    theoryLessons={theoryLessons}
                    theoryLessonsLoading={theoryLessonsLoading}
                    isOpen={openSections.theoryLessons}
                    onToggle={() => toggleSection('theoryLessons')}
                    onTheoryLessonClick={navigateToTheoryLesson}
                  />
                )}

                {/* Schedule Section - Teacher Time Block Management */}
                <div className='section'>
                  <div
                    className={`section-title clickable ${
                      openSections.schedule ? 'active' : ''
                    }`}
                    onClick={() => toggleSection('schedule')}
                  >
                    <Calendar size={16} />
                    <span>מערכת שעות</span>
                    {openSections.schedule ? (
                      <ChevronUp size={18} className='toggle-icon' />
                    ) : (
                      <ChevronDown size={18} className='toggle-icon' />
                    )}
                  </div>

                  {openSections.schedule && (
                    <div className='section-content'>
                      <TeacherTimeBlockManager
                        teacherId={teacher._id}
                        teacherName={teacher.personalInfo?.fullName || 'מורה לא ידוע'}
                        onTimeBlockChange={() => {
                          // Empty callback to prevent infinite loops
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                <span>הצג פרטים אישיים</span>
                <ArrowLeft size={14} />
              </button>
            </div>

            {/* Personal Info (Back) */}
            <div className='card-side card-back'>
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
                <span>הצג מידע מקצועי</span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}