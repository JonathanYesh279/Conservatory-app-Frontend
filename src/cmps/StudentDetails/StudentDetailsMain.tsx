// src/components/StudentDetails/StudentDetailsMain.tsx
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { useStudentDetailsState } from '../../hooks/useStudentDetailsState';
import { StudentHeader } from './StudentHeader';
import { TeachersSection } from './sections/TeachersSection';
import { OrchestrasSection } from './sections/OrchestrasSection';
import { TestsSection } from './sections/TestsSection';
import { AttendanceSection } from './sections/AttendanceSection';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { ParentInfoSection } from './sections/ParentInfoSection';

export function StudentDetailsMain() {
  const {
    student,
    isLoading,
    error,
    flipped,
    teachersData,
    teachersLoading,
    teachersError,
    orchestras,
    orchestrasLoading,
    attendanceStats,
    loadingAttendance,
    openSections,
    toggleSection,
    toggleFlip,
    goBack,
    navigateToTeacher,
    navigateToOrchestra,
    formatDate,
    getInitials,
    getStageColor,
    retryLoadTeachers,
  } = useStudentDetailsState();

  if (isLoading) {
    return (
      <div className='loading-state'>
        <RefreshCw className='loading-icon' size={28} />
        <p>טוען פרטי תלמיד...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className='error-state'>
        <p>{error || 'לא ניתן לטעון את פרטי התלמיד'}</p>
        <button onClick={goBack} className='btn primary'>
          חזרה לרשימת התלמידים
        </button>
      </div>
    );
  }

  return (
    <div className='student-details-content'>
      <div className='student-details-page'>
        <div className='student-card-container'>
          <div className={`card-content ${flipped ? 'flipped' : ''}`}>
            {/* Academic Info (Front) */}
            <div className='card-side card-front'>
              <StudentHeader
                student={student}
                getInitials={getInitials}
                getStageColor={getStageColor}
                onBack={goBack}
              />

              <div className='card-scroll-area'>
                {/* Teachers Section */}
                <TeachersSection
                  teachersData={teachersData}
                  teachersLoading={teachersLoading}
                  teachersError={teachersError}
                  isOpen={openSections.teachers}
                  onToggle={() => toggleSection('teachers')}
                  onTeacherClick={navigateToTeacher}
                  onRetryLoadTeachers={retryLoadTeachers}
                />

                {/* Orchestras Section */}
                <OrchestrasSection
                  student={student}
                  orchestras={orchestras}
                  orchestrasLoading={orchestrasLoading}
                  isOpen={openSections.orchestras}
                  onToggle={() => toggleSection('orchestras')}
                  onOrchestraClick={navigateToOrchestra}
                />

                {/* Tests Section */}
                <TestsSection
                  student={student}
                  isOpen={openSections.tests}
                  onToggle={() => toggleSection('tests')}
                  formatDate={formatDate}
                />

                {/* Attendance Section */}
                <AttendanceSection
                  student={student}
                  attendanceStats={attendanceStats}
                  loadingAttendance={loadingAttendance}
                  isOpen={openSections.attendance}
                  onToggle={() => toggleSection('attendance')}
                  formatDate={formatDate}
                />
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                <span>הצג פרטים אישיים</span>
                <ArrowLeft size={14} />
              </button>
            </div>

            {/* Personal Info (Back) */}
            <div className='card-side card-back'>
              <StudentHeader
                student={student}
                getInitials={getInitials}
                getStageColor={getStageColor}
                showBackButton={false}
              />

              <div className='card-scroll-area'>
                {/* Personal Info Section */}
                <PersonalInfoSection
                  student={student}
                  isOpen={openSections.personalInfo}
                  onToggle={() => toggleSection('personalInfo')}
                  formatDate={formatDate}
                />

                {/* Parent Info Section */}
                <ParentInfoSection
                  student={student}
                  isOpen={openSections.parentInfo}
                  onToggle={() => toggleSection('parentInfo')}
                />
              </div>

              <button className='flip-button' onClick={toggleFlip}>
                <span>הצג מידע אקדמי</span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
