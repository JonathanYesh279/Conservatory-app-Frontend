import { useStudentDetailsState } from '../../hooks/useStudentDetailsState';
import {
  User,
  Music,
  Award,
  Calendar,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Star,
  ChevronDown,
} from 'lucide-react';
import { InstrumentProgress } from '../../services/studentService';
import { TheoryLessonsSection } from './sections/TheoryLessonsSection';
import { LessonScheduleSection } from './sections/LessonScheduleSection';
import { TeachersSection } from './sections/TeachersSection';

export function StudentDetailsMain() {
  const {
    student,
    teachersData,
    teachersLoading,
    teachersError,
    orchestras,
    theoryLessons,
    theoryLessonsLoading,
    openSections,
    toggleSection,
    getStageColor,
    navigateToTeacher,
    navigateToOrchestra,
    navigateToTheoryLesson,
<<<<<<< Updated upstream
    navigateToStudentEdit,
=======
>>>>>>> Stashed changes
    formatDate,
    retryLoadTeachers,
  } = useStudentDetailsState();

  if (!student) return null;

  // Debug output removed for production

  return (
    <div className='card-scroll-area'>
      {/* Personal Info Section */}
      <div className='section'>
        <div
          className={`section-title clickable ${
            openSections.personalInfo ? 'active' : ''
          }`}
          onClick={() => toggleSection('personalInfo')}
        >
          <User size={18} />
          פרטים אישיים
          <ChevronDown
            className={`toggle-icon ${openSections.personalInfo ? 'open' : ''}`}
            size={16}
          />
        </div>

        {openSections.personalInfo && (
          <div className='section-content'>
            <div className='info-grid'>
              {student.personalInfo.phone && (
                <div className='info-item'>
                  <Phone size={14} />
                  <div>
                    <span className='info-label'>טלפון:</span>
                    <span className='info-value'>
                      {student.personalInfo.phone}
                    </span>
                  </div>
                </div>
              )}

              {student.personalInfo.studentEmail && (
                <div className='info-item'>
                  <Mail size={14} />
                  <div>
                    <span className='info-label'>אימייל:</span>
                    <span className='info-value'>
                      {student.personalInfo.studentEmail}
                    </span>
                  </div>
                </div>
              )}

              {student.personalInfo.address && (
                <div className='info-item'>
                  <MapPin size={14} />
                  <div>
                    <span className='info-label'>כתובת:</span>
                    <span className='info-value'>
                      {student.personalInfo.address}
                    </span>
                  </div>
                </div>
              )}

              {student.personalInfo.age !== undefined && (
                <div className='info-item'>
                  <User size={14} />
                  <div>
                    <span className='info-label'>גיל:</span>
                    <span className='info-value'>
                      {student.personalInfo.age}
                    </span>
                  </div>
                </div>
              )}

              <div className='info-item'>
                <BookOpen size={14} />
                <div>
                  <span className='info-label'>כיתה:</span>
                  <span className='info-value'>
                    {student.academicInfo.class}
                  </span>
                </div>
              </div>

              <div className='info-item'>
                <Calendar size={14} />
                <div>
                  <span className='info-label'>תאריך הצטרפות:</span>
                  <span className='info-value'>
                    {formatDate(student.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parent Info Section */}
      <div className='section'>
        <div
          className={`section-title clickable ${
            openSections.parentInfo ? 'active' : ''
          }`}
          onClick={() => toggleSection('parentInfo')}
        >
          <UserPlus size={18} />
          פרטי הורה
          <ChevronDown
            className={`toggle-icon ${openSections.parentInfo ? 'open' : ''}`}
            size={16}
          />
        </div>

        {openSections.parentInfo && (
          <div className='section-content'>
            <div className='info-grid'>
              {student.personalInfo.parentName && (
                <div className='info-item'>
                  <User size={14} />
                  <div>
                    <span className='info-label'>שם:</span>
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
                    <span className='info-label'>טלפון:</span>
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
                    <span className='info-label'>אימייל:</span>
                    <span className='info-value'>
                      {student.personalInfo.parentEmail}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instruments Section - Now collapsible */}
      <div className='section'>
        <div
          className={`section-title clickable ${
            openSections.instruments ? 'active' : ''
          }`}
          onClick={() => toggleSection('instruments')}
        >
          <Music size={18} />
          כלי נגינה
          <ChevronDown
            className={`toggle-icon ${openSections.instruments ? 'open' : ''}`}
            size={16}
          />
        </div>
        {openSections.instruments && (
          <div className='section-content'>
            {student.academicInfo.instrumentProgress &&
            student.academicInfo.instrumentProgress.length > 0 ? (
              <div className='compact-instruments-list'>
                {student.academicInfo.instrumentProgress.map((instrument) => (
                  <CompactInstrumentCard
                    key={instrument.instrumentName}
                    instrument={instrument}
                    getStageColor={getStageColor}
                  />
                ))}
              </div>
            ) : (
              <div className='no-data'>אין כלי נגינה</div>
            )}
          </div>
        )}
      </div>

      {/* Teachers Section */}
      <TeachersSection
        teachersData={teachersData}
        teachersLoading={teachersLoading}
        teachersError={teachersError}
        isOpen={openSections.teachers}
        onToggle={() => toggleSection('teachers')}
        onTeacherClick={navigateToTeacher}
        onRetryLoadTeachers={retryLoadTeachers}
        studentTeacherIds={student.teacherIds}
        teacherAssignments={student.teacherAssignments || []}
      />

      {/* Orchestras Section */}
      <div className='section'>
        <div
          className={`section-title clickable ${
            openSections.orchestras ? 'active' : ''
          }`}
          onClick={() => toggleSection('orchestras')}
        >
          <Award size={18} />
          תזמורות
          <ChevronDown
            className={`toggle-icon ${openSections.orchestras ? 'open' : ''}`}
            size={16}
          />
        </div>

        {openSections.orchestras && (
          <div className='section-content'>
            {orchestras.length > 0 ? (
              <div className='orchestras-grid'>
                {orchestras.map((orchestra) => (
                  <div
                    key={orchestra._id}
                    className='orchestra-card clickable'
                    onClick={() => navigateToOrchestra(orchestra._id)}
                  >
                    <Award size={20} />
                    <span>{orchestra.name}</span>
                    {orchestra.type && (
                      <span className='orchestra-type'>{orchestra.type}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='no-orchestra-warning'>אין תזמורות משוייכות</div>
            )}
          </div>
        )}
      </div>

      {/* Theory Lessons Section */}
      <TheoryLessonsSection 
        student={student}
        theoryLessons={theoryLessons}
        theoryLessonsLoading={theoryLessonsLoading}
        isOpen={openSections.theoryLessons}
        onToggle={() => toggleSection('theoryLessons')}
        onTheoryLessonClick={navigateToTheoryLesson}
      />
      
      {/* Lesson Schedule Section */}
      <LessonScheduleSection
        student={student}
        isOpen={openSections.schedule}
        onToggle={() => toggleSection('schedule')}
<<<<<<< Updated upstream
        onEditSchedule={navigateToStudentEdit}
=======
        onEditSchedule={() => {
          // TODO: Implement edit schedule functionality
          console.log('Edit schedule clicked');
        }}
>>>>>>> Stashed changes
      />
    </div>
  );
}

// Compact Instrument Card Component
interface CompactInstrumentCardProps {
  instrument: InstrumentProgress;
  getStageColor: (stage: number) => string;
}

function CompactInstrumentCard({
  instrument,
  getStageColor,
}: CompactInstrumentCardProps) {
  // Get test status indicator color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'עבר/ה':
      case 'עבר/ה בהצלחה':
      case 'עבר/ה בהצטיינות':
        return 'var(--success)';
      case 'לא עבר/ה':
        return 'var(--danger)';
      default:
        return 'var(--text-muted)';
    }
  };

  // Get stage test status
  const stageTestStatus = instrument.tests?.stageTest?.status || 'לא נבחן';

  // Get technical test status
  const technicalTestStatus =
    instrument.tests?.technicalTest?.status || 'לא נבחן';

  // Get combined notes
  const notes =
    instrument.tests?.stageTest?.notes ||
    instrument.tests?.technicalTest?.notes ||
    'אין הערות';

  return (
    <div className='compact-instrument-card'>
      <div className='instrument-header'>
        <div className='instrument-name-container'>
          <Music size={14} className='instrument-icon' />
          <span className='instrument-name'>{instrument.instrumentName}</span>
          {instrument.isPrimary && (
            <span className='primary-badge'>
              <Star size={10} /> ראשי
            </span>
          )}
        </div>
        <div
          className='stage-badge'
          style={{ backgroundColor: getStageColor(instrument.currentStage) }}
        >
          שלב {instrument.currentStage}
        </div>
      </div>

      <div className='test-status-row'>
        <div className='test-item'>
          <span className='test-label'>מבחן טכני:</span>
          <span
            className='test-value'
            style={{ color: getStatusColor(technicalTestStatus) }}
          >
            {technicalTestStatus}
          </span>
        </div>

        <div className='test-item'>
          <span className='test-label'>מבחן שלב:</span>
          <span
            className='test-value'
            style={{ color: getStatusColor(stageTestStatus) }}
          >
            {stageTestStatus}
          </span>
        </div>
      </div>

      {/* Show notes only if they exist and aren't the default */}
      {notes !== 'אין הערות' && (
        <div className='notes-row'>
          <span className='notes-text'>{notes}</span>
        </div>
      )}
    </div>
  );
}
