import { useEffect, useState } from 'react'
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
  Clock,
  X,
  Send,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react'

// Extend for student data reference
interface StudentReference {
  _id: string
  fullName: string
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

// Communication modal types
type CommunicationMethod = 'email' | 'whatsapp'

interface EmailFormData {
  subject: string
  message: string
}

interface WhatsAppFormData {
  message: string
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

  // Communication modal state
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);
  const [communicationMethod, setCommunicationMethod] =
    useState<CommunicationMethod | null>(null);
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    subject: '',
    message: '',
  });
  const [whatsAppForm, setWhatsAppForm] = useState<WhatsAppFormData>({
    message: '',
  });
  const [copied, setCopied] = useState(false);

  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    students: true,
    orchestras: true,
    schedule: false,
    personalInfo: true,
    professionalInfo: true,
  });

  const navigate = useNavigate();

  // Load teacher data when component mounts
  useEffect(() => {
    if (teacherId) {
      loadTeacher(teacherId);
    }
  }, [teacherId]);

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
      }

      // Load orchestras
      if (
        teacherData.conducting?.orchestraIds &&
        teacherData.conducting.orchestraIds.length > 0
      ) {
        setOrchestrasLoading(true);
        await loadOrchestras(teacherData.conducting.orchestraIds);
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
        return;
      }

      console.log('Loading students for IDs:', studentIds);

      // Fetch student data
      const studentData = await studentService.getStudentsByIds(studentIds);
      console.log('Loaded student data:', studentData);

      // Set students state for the students section
      setStudents(
        studentData.map((student) => ({
          _id: student._id,
          fullName: student.personalInfo.fullName || 'תלמיד ללא שם',
          instrument: student.academicInfo.instrument || '',
        }))
      );

      // Create a comprehensive lookup map with multiple ID formats
      const studentMap = {};

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
            instrument: student.academicInfo?.instrument || '',
          };

          // Store using each format as a key
          formats.forEach((format) => {
            studentMap[format] = studentInfo;
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
            let studentInfo = null;
            for (const format of idFormats) {
              if (studentMap[format]) {
                studentInfo = studentMap[format];
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

  // Open communication modal
  const openCommunicationModal = () => {
    setCommunicationModalOpen(true);
    setCommunicationMethod(null);
  };

  // Close communication modal
  const closeCommunicationModal = () => {
    setCommunicationModalOpen(false);
    setCommunicationMethod(null);
    setEmailForm({ subject: '', message: '' });
    setWhatsAppForm({ message: '' });
    setCopied(false);
  };

  // Select communication method
  const selectCommunicationMethod = (method: CommunicationMethod) => {
    setCommunicationMethod(method);
  };

  // Handle email form changes
  const handleEmailFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle WhatsApp form changes
  const handleWhatsAppFormChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setWhatsAppForm({ message: e.target.value });
  };

  // Handle send email
  const handleSendEmail = () => {
    if (!teacher?.personalInfo.email) return;

    const emailContent = `mailto:${
      teacher.personalInfo.email
    }?subject=${encodeURIComponent(
      emailForm.subject
    )}&body=${encodeURIComponent(emailForm.message)}`;
    window.open(emailContent);
    closeCommunicationModal();
  };

  // Format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    if (phone.startsWith('0')) {
      return `972${phone.substring(1)}`;
    }
    return phone;
  };

  // Handle send WhatsApp
  const handleSendWhatsApp = () => {
    if (!teacher?.personalInfo.phone) return;

    const formattedPhone = formatPhoneForWhatsApp(teacher.personalInfo.phone);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      whatsAppForm.message
    )}`;
    window.open(whatsappUrl);
    closeCommunicationModal();
  };

  // Copy phone or email to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                    onClick={openCommunicationModal}
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
                {teacher.teaching?.studentIds &&
                  teacher.teaching.studentIds.length > 0 && (
                    <div className='section'>
                      <div
                        className={`section-title clickable ${
                          openSections.students ? 'active' : ''
                        }`}
                        onClick={() => toggleSection('students')}
                      >
                        <Users size={16} />
                        <span>
                          תלמידים ({teacher.teaching.studentIds.length})
                        </span>
                        {openSections.students ? (
                          <ChevronUp size={18} className='toggle-icon' />
                        ) : (
                          <ChevronDown size={18} className='toggle-icon' />
                        )}
                      </div>

                      {openSections.students && (
                        <div className='section-content'>
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
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

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

            {/* Personal Info (Back) */}
            <div className='card-side card-back'>
              <div className='card-header'>
                <div className='teacher-identity'>
                  <div
                    className='avatar avatar-clickable'
                    style={{
                      backgroundColor: getRoleColor(primaryRole),
                    }}
                    onClick={openCommunicationModal}
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

        {/* Communication Modal */}
        {communicationModalOpen && (
          <div
            className='communication-modal-overlay'
            onClick={closeCommunicationModal}
          >
            <div
              className='communication-modal'
              onClick={(e) => e.stopPropagation()}
            >
              <div className='modal-header'>
                <h3>יצירת קשר עם {teacher.personalInfo.fullName}</h3>
                <button className='close-btn' onClick={closeCommunicationModal}>
                  <X size={18} />
                </button>
              </div>

              {/* Method Selection */}
              {!communicationMethod && (
                <div className='comm-method-selection'>
                  <div className='comm-details'>
                    {teacher.personalInfo.phone && (
                      <div className='contact-info-item'>
                        <Phone size={16} />
                        <span>{teacher.personalInfo.phone}</span>
                        <button
                          className='copy-btn'
                          onClick={() =>
                            copyToClipboard(teacher.personalInfo.phone || '')
                          }
                          aria-label='העתק מספר טלפון'
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}
                    {teacher.personalInfo.email && (
                      <div className='contact-info-item'>
                        <Mail size={16} />
                        <span>{teacher.personalInfo.email}</span>
                        <button
                          className='copy-btn'
                          onClick={() =>
                            copyToClipboard(teacher.personalInfo.email || '')
                          }
                          aria-label='העתק כתובת אימייל'
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className='method-buttons'>
                    {teacher.personalInfo.email && (
                      <button
                        className='method-btn email-btn'
                        onClick={() => selectCommunicationMethod('email')}
                      >
                        <Mail size={20} />
                        <span>שלח אימייל</span>
                      </button>
                    )}
                    {teacher.personalInfo.phone && (
                      <button
                        className='method-btn whatsapp-btn'
                        onClick={() => selectCommunicationMethod('whatsapp')}
                      >
                        <MessageSquare size={20} />
                        <span>שלח הודעת WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Email Form */}
              {communicationMethod === 'email' && (
                <div className='email-form'>
                  <button
                    className='back-to-methods'
                    onClick={() => setCommunicationMethod(null)}
                  >
                    &larr; חזרה
                  </button>

                  <div className='form-group'>
                    <label htmlFor='subject'>נושא</label>
                    <input
                      type='text'
                      id='subject'
                      name='subject'
                      value={emailForm.subject}
                      onChange={handleEmailFormChange}
                      placeholder='נושא ההודעה'
                    />
                  </div>
                  <div className='form-group'>
                    <label htmlFor='message'>תוכן ההודעה</label>
                    <textarea
                      id='message'
                      name='message'
                      value={emailForm.message}
                      onChange={handleEmailFormChange}
                      placeholder='הקלד את תוכן ההודעה כאן...'
                      rows={6}
                    />
                  </div>
                  <div className='form-actions'>
                    <button
                      className='cancel-btn'
                      onClick={closeCommunicationModal}
                    >
                      ביטול
                    </button>
                    <button
                      className='send-btn'
                      onClick={handleSendEmail}
                      disabled={!emailForm.subject || !emailForm.message}
                    >
                      <Send size={16} />
                      <span>שלח אימייל</span>
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp Form */}
              {communicationMethod === 'whatsapp' && (
                <div className='whatsapp-form'>
                  <button
                    className='back-to-methods'
                    onClick={() => setCommunicationMethod(null)}
                  >
                    &larr; חזרה
                  </button>

                  <div className='form-group'>
                    <label htmlFor='whatsapp-message'>הודעה ל-WhatsApp</label>
                    <textarea
                      id='whatsapp-message'
                      value={whatsAppForm.message}
                      onChange={handleWhatsAppFormChange}
                      placeholder='הקלד את תוכן ההודעה כאן...'
                      rows={6}
                    />
                  </div>
                  <div className='form-actions'>
                    <button
                      className='cancel-btn'
                      onClick={closeCommunicationModal}
                    >
                      ביטול
                    </button>
                    <button
                      className='send-btn'
                      onClick={handleSendWhatsApp}
                      disabled={!whatsAppForm.message}
                    >
                      <Send size={16} />
                      <span>שלח הודעת WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}