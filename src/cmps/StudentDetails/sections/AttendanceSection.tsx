// src/components/StudentDetails/sections/AttendanceSection.tsx
import { Calendar, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';
import { Student, AttendanceStats } from '../../../services/studentService';

interface AttendanceSectionProps {
  student: Student;
  attendanceStats: AttendanceStats | null;
  loadingAttendance: boolean;
  isOpen: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}

export function AttendanceSection({
  student,
  attendanceStats,
  loadingAttendance,
  isOpen,
  onToggle,
  formatDate,
}: AttendanceSectionProps) {
  if (!student) {
    return null;
  }

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Calendar size={16} />
        <span>נוכחות</span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {(student.academicInfo?.orchestraIds?.length || 0) > 0 ? (
            <div className='sd-attendance-container'>
              {/* If we have attendance stats */}
              {loadingAttendance ? (
                <div className='sd-loading-attendance'>
                  <RefreshCw size={16} className='sd-loading-icon' />
                  <span>טוען נתוני נוכחות...</span>
                </div>
              ) : attendanceStats ? (
                <>
                  <div className='sd-attendance-summary'>
                    <div className='sd-attendance-stat'>
                      <span className='sd-stat-label'>שיעור נוכחות</span>
                      <div className='sd-attendance-rate'>
                        {Math.round(attendanceStats.attendanceRate)}%
                      </div>
                    </div>
                    <div className='sd-attendance-stat'>
                      <span className='sd-stat-label'>נוכח</span>
                      <div className='sd-attendance-count'>
                        {attendanceStats.attended} /{' '}
                        {attendanceStats.totalRehearsals}
                      </div>
                    </div>
                  </div>

                  {attendanceStats.recentHistory?.length > 0 ? (
                    <div className='sd-attendance-history'>
                      <h3 className='sd-history-title'>
                        היסטוריית נוכחות אחרונה
                      </h3>
                      <div className='sd-history-entries'>
                        {attendanceStats.recentHistory.map((record, index) => (
                          <div key={index} className='sd-history-entry'>
                            <div
                              className={`sd-status-indicator ${
                                record.status === 'הגיע/ה'
                                  ? 'present'
                                  : 'absent'
                              }`}
                            />
                            <span className='sd-history-date'>
                              {formatDate(record.date)}
                            </span>
                            <span
                              className={`sd-history-status ${
                                record.status === 'הגיע/ה'
                                  ? 'present'
                                  : 'absent'
                              }`}
                            >
                              {record.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className='sd-no-attendance-history'>
                      אין היסטוריית נוכחות זמינה
                    </div>
                  )}

                  {attendanceStats.message && (
                    <div className='sd-attendance-message sd-warning'>
                      {attendanceStats.message}
                    </div>
                  )}
                </>
              ) : (
                <div className='sd-no-attendance-data'>
                  אין נתוני נוכחות זמינים
                </div>
              )}
            </div>
          ) : (
            <div className='sd-no-orchestra-warning'>
              אין נתוני נוכחות עבור תלמיד שאינו משתתף בתזמורות
            </div>
          )}
        </div>
      )}
    </div>
  );
}
