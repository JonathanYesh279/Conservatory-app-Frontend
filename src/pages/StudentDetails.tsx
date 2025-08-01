// src/pages/StudentDetails.tsx
import { useStudentDetailsState } from '../hooks/useStudentDetailsState';
import { RefreshCw, ArrowLeft, User, Music } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Import section components
import { InstrumentsSection } from '../cmps/StudentDetails/sections/InstrumentsSection';
import { PersonalInfoSection } from '../cmps/StudentDetails/sections/PersonalInfoSection';
import { ParentInfoSection } from '../cmps/StudentDetails/sections/ParentInfoSection';
import { TeachersSection } from '../cmps/StudentDetails/sections/TeachersSection';
import { OrchestrasSection } from '../cmps/StudentDetails/sections/OrchestrasSection';
import { TestsSection } from '../cmps/StudentDetails/sections/TestsSection';
import { AttendanceSection } from '../cmps/StudentDetails/sections/AttendanceSection';
import { TheoryLessonsSection } from '../cmps/StudentDetails/sections/TheoryLessonsSection';
import { LessonScheduleSection } from '../cmps/StudentDetails/sections/LessonScheduleSection';

export function StudentDetails() {
  const {
    student,
    isLoading,
    error,
    flipped,
    toggleFlip,
    goBack,
    getInitials,
    getStageColor,
    primaryInstrument,
    openSections,
    toggleSection,
    formatDate,
    navigateToTeacher,
    navigateToOrchestra,
    navigateToTheoryLesson,
    navigateToStudentEdit,
    teachersData,
    teachersLoading,
    teachersError,
    orchestras,
    orchestrasLoading,
    theoryLessons,
    theoryLessonsLoading,
    retryLoadTeachers,
    updateStudentTest,
    isUpdatingTest,
    updateStudentStage,
    isUpdatingStage,
  } = useStudentDetailsState();

  const { user } = useAuth();

  // Check if user can edit stage (admin or teacher assigned to this student)
  const canEditStage = Boolean(user && (
    user.roles.includes('מנהל') || 
    (user.roles.includes('מורה') && student?.teacherIds?.includes(user._id))
  ));

  if (isLoading) {
    return (
      <div className='sd-loading-state'>
        <RefreshCw className='sd-loading-icon' size={28} />
        <p>טוען פרטי תלמיד...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className='sd-error-state'>
        <p>{error || 'לא ניתן לטעון את פרטי התלמיד'}</p>
        <button onClick={goBack} className='btn primary'>
          חזרה לרשימת התלמידים
        </button>
      </div>
    );
  }

  // Get teacher IDs directly from student object
  const teacherIds = student.teacherIds || [];
  
  // Debug output removed for production

  return (
    <div className='student-details-content'>
      <div className='student-details-page'>
        <div className='student-card-container'>
          <div className={`sd-card-content ${flipped ? 'flipped' : ''}`}>
            {/* Academic Info (Front) */}
            <div className='sd-card-side sd-card-front'>
              {/* Header with avatar and name */}
              <div className='sd-card-header'>
                <div className='sd-student-identity'>
                  <div
                    className='sd-avatar sd-avatar-clickable'
                    style={{
                      backgroundColor: primaryInstrument
                        ? getStageColor(primaryInstrument.currentStage)
                        : '#4158d0',
                    }}
                  >
                    {getInitials(student.personalInfo.fullName)}
                  </div>

                  <div className='sd-header-text'>
                    <h1 className='sd-student-name'>
                      {student.personalInfo.fullName}
                    </h1>
                    <div className='sd-instrument'>
                      {primaryInstrument ? (
                        <>
                          <Music size={14} />
                          <span>{primaryInstrument.instrumentName}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} />
                          <span>תלמיד</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className='sd-header-badges'>
                  <div className='sd-class-badge'>
                    כיתה {student.academicInfo.class}
                  </div>
                  <button
                    className='sd-back-button'
                    onClick={goBack}
                    aria-label='חזרה'
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
              </div>

              {/* Main academic content area with all sections */}
              <div className='sd-card-scroll-area'>
                {/* Use the separate InstrumentsSection component - now editable */}
                {student.academicInfo.instrumentProgress?.length > 0 && (
                  <InstrumentsSection
                    student={student}
                    isOpen={openSections.instruments}
                    onToggle={() => toggleSection('instruments')}
                    getStageColor={getStageColor}
                    updateStudentStage={updateStudentStage}
                    isUpdatingStage={isUpdatingStage}
                    canEditStage={canEditStage}
                  />
                )}

                <TeachersSection
                  teachersData={teachersData}
                  teachersLoading={teachersLoading}
                  teachersError={teachersError}
                  isOpen={openSections.teachers}
                  onToggle={() => toggleSection('teachers')}
                  onTeacherClick={navigateToTeacher}
                  onRetryLoadTeachers={retryLoadTeachers}
                  studentTeacherIds={teacherIds} // Pass teacher IDs directly
                  teacherAssignments={student.teacherAssignments || []} // Add teacher assignments
                />

                <LessonScheduleSection
                  student={student}
                  isOpen={openSections.schedule}
                  onToggle={() => toggleSection('schedule')}
                  onEditSchedule={navigateToStudentEdit}
                />

                <OrchestrasSection
                  student={student}
                  orchestras={orchestras}
                  orchestrasLoading={orchestrasLoading}
                  isOpen={openSections.orchestras}
                  onToggle={() => toggleSection('orchestras')}
                  onOrchestraClick={navigateToOrchestra}
                />

                {/* Updated TestsSection with test update functionality */}
                <TestsSection
                  student={student}
                  isOpen={openSections.tests}
                  onToggle={() => toggleSection('tests')}
                  formatDate={formatDate}
                  updateStudentTest={updateStudentTest}
                  isUpdatingTest={isUpdatingTest}
                  getStageColor={getStageColor}
                />

                <AttendanceSection
                  student={student}
                  attendanceStats={null} // Replace with actual attendance stats
                  loadingAttendance={false} // Replace with actual loading state
                  isOpen={openSections.attendance}
                  onToggle={() => toggleSection('attendance')}
                  formatDate={formatDate}
                />

                <TheoryLessonsSection
                  student={student}
                  theoryLessons={theoryLessons}
                  theoryLessonsLoading={theoryLessonsLoading}
                  isOpen={openSections.theoryLessons}
                  onToggle={() => toggleSection('theoryLessons')}
                  onTheoryLessonClick={navigateToTheoryLesson}
                />
              </div>

              <button className='sd-flip-button' onClick={toggleFlip}>
                <span>הצג פרטים אישיים</span>
                <ArrowLeft size={14} />
              </button>
            </div>

            {/* Personal Info (Back) */}
            <div className='sd-card-side sd-card-back'>
              {/* Header with avatar and name */}
              <div className='sd-card-header'>
                <div className='sd-student-identity'>
                  <div
                    className='sd-avatar sd-avatar-clickable'
                    style={{
                      backgroundColor: primaryInstrument
                        ? getStageColor(primaryInstrument.currentStage)
                        : '#4158d0',
                    }}
                  >
                    {getInitials(student.personalInfo.fullName)}
                  </div>

                  <div className='sd-header-text'>
                    <h1 className='sd-student-name'>
                      {student.personalInfo.fullName}
                    </h1>
                    <div className='sd-instrument'>
                      {primaryInstrument ? (
                        <>
                          <Music size={14} />
                          <span>{primaryInstrument.instrumentName}</span>
                        </>
                      ) : (
                        <>
                          <User size={14} />
                          <span>תלמיד</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className='sd-header-badges'>
                  <div className='sd-class-badge'>
                    כיתה {student.academicInfo.class}
                  </div>
                  <button
                    className='sd-back-button'
                    onClick={goBack}
                    aria-label='חזרה'
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
              </div>

              <div className='sd-card-scroll-area'>
                {/* Personal Info and Parent Info Sections */}
                <PersonalInfoSection
                  student={student}
                  isOpen={openSections.personalInfo}
                  onToggle={() => toggleSection('personalInfo')}
                  formatDate={formatDate}
                />

                <ParentInfoSection
                  student={student}
                  isOpen={openSections.parentInfo}
                  onToggle={() => toggleSection('parentInfo')}
                />
              </div>

              <button className='sd-flip-button' onClick={toggleFlip}>
                <span>הצג מידע לימודי</span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
