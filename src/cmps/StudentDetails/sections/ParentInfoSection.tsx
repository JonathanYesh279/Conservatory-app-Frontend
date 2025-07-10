// src/components/StudentDetails/sections/ParentInfoSection.tsx
import { User, Phone, Mail } from 'lucide-react';
import { Student } from '../../../services/studentService';

interface ParentInfoSectionProps {
  student: Student;
  isOpen: boolean;
  onToggle: () => void;
}

export function ParentInfoSection({
  student,
  isOpen,
  onToggle,
}: ParentInfoSectionProps) {
  // Safety check: ensure student and personalInfo exist
  if (!student || !student.personalInfo) {
    return null;
  }

  // Helper function to check if parent fields have real values
  const hasRealValue = (value: string | undefined) => {
    if (!value) return false;
    const defaultValues = ['לא צוין', '0500000000', 'parent@example.com'];
    return !defaultValues.includes(value);
  };

  const hasParentName = hasRealValue(student.personalInfo.parentName);
  const hasParentPhone = hasRealValue(student.personalInfo.parentPhone);
  const hasParentEmail = hasRealValue(student.personalInfo.parentEmail);

  const hasAnyParentInfo = hasParentName || hasParentPhone || hasParentEmail;

  return (
    <div className='section'>
      <div
        className={`section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <User size={16} />
        <span>פרטי הורה</span>
      </div>

      {isOpen && (
        <div className='section-content'>
          {hasAnyParentInfo ? (
            <div className='info-grid'>
              {hasParentName && (
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

              {hasParentPhone && (
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

              {hasParentEmail && (
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
          ) : (
            <div className='no-data-message'>אין פרטי הורה</div>
          )}
        </div>
      )}
    </div>
  );
}
