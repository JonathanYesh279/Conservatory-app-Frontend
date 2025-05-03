// src/components/StudentDetails/sections/AttendanceSection.tsx
import { Calendar, RefreshCw } from 'lucide-react';
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
  return (
    <div className='section'>
      <div
        className={`section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Calendar size={16} />
        <span>נוכחות</span>
      </div>

      {isOpen && (
        <div className='section-content'>
          {student.enrollments?.orchestraIds?.length > 0 ? (
            <div className='attendance-container'>
              {/* If we have attendance stats */}
              {loadingAttendance ? (
                <div className='loading-attendance'>
                  <RefreshCw size={16} className='loading-icon' />
                  <span>טוען נתוני נוכחות...</span>
                </div>
              ) : attendanceStats ? (
                <>
                  <div className='attendance-summary'>
                    <div className='attendance-stat'>
                      <span className='stat-label'>שיעור נוכחות</span>
                      <div className='attendance-rate'>
                        {Math.round(attendanceStats.attendanceRate)}%
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

                  {attendanceStats.recentHistory?.length > 0 ? (
                    <div className='attendance-history'>
                      <h3 className='history-title'>היסטוריית נוכחות אחרונה</h3>
                      <div className='history-entries'>
                        {attendanceStats.recentHistory.map((record, index) => (
                          <div key={index} className='history-entry'>
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
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className='no-attendance-history'>
                      אין היסטוריית נוכחות זמינה
                    </div>
                  )}

                  {attendanceStats.message && (
                    <div className='attendance-message warning'>
                      {attendanceStats.message}
                    </div>
                  )}
                </>
              ) : (
                <div className='no-attendance-data'>
                  אין נתוני נוכחות זמינים
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
  );
}
