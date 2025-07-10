// src/components/StudentDetails/sections/PersonalInfoSection.tsx
import { User, Phone, MapPin, Mail, Calendar, BookOpen } from 'lucide-react';
import { Student } from '../../../services/studentService';

interface PersonalInfoSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
  formatDate: (date: string) => string;
}

export function PersonalInfoSection({
  student,
  isOpen,
  onToggle,
  formatDate,
}: PersonalInfoSectionProps) {
  // Safety check: ensure student and personalInfo exist
  if (!student || !student.personalInfo) {
    return null;
  }

  return (
    <div className='section'>
      <div
        className={`section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <User size={16} />
        <span>פרטים אישיים</span>
      </div>

      {isOpen && (
        <div className='section-content'>
          {student.personalInfo.phone ||
          student.personalInfo.address ||
          student.personalInfo.studentEmail ||
          student.createdAt ||
          student.academicInfo?.class ? (
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

              {student.academicInfo?.class && (
                <div className='info-item'>
                  <BookOpen size={14} />
                  <div>
                    <span className='info-label'>כיתה</span>
                    <span className='info-value'>
                      {student.academicInfo.class}
                    </span>
                  </div>
                </div>
              )}

              {student.personalInfo.age !== undefined && (
                <div className='info-item'>
                  <User size={14} />
                  <div>
                    <span className='info-label'>גיל</span>
                    <span className='info-value'>
                      {student.personalInfo.age}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='no-data-message'>אין פרטים אישיים</div>
          )}
        </div>
      )}
    </div>
  );
}
