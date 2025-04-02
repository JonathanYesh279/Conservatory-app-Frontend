// src/cmps/TeacherPreview.tsx
import { Teacher } from '../services/teacherService';
import {
  Edit,
  Trash2,
  Music,
  Users,
  Calendar,
  BookOpen,
  Eye,
  User,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';

interface TeacherPreviewProps {
  teacher: Teacher;
  onView: (teacherId: string) => void;
  onEdit: (teacherId: string) => void;
  onRemove?: (teacherId: string) => void;
}

export function TeacherPreview({
  teacher,
  onView,
  onEdit,
  onRemove,
}: TeacherPreviewProps) {
  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      מורה: '#4D55CC', // Primary color
      מנצח: '#28A745', // Success color
      'מדריך הרכב': '#FFC107', // Warning color
      מנהל: '#DC3545', // Danger color
    };
    return roleColors[role] || '#6c757d'; // Default color
  };

  // Format the count of students
  const getStudentCountText = (count: number): string => {
    if (count === 0) return 'אין תלמידים';
    if (count === 1) return 'תלמיד אחד';
    return `${count} תלמידים`;
  };

  // Check if teacher has students
  const hasStudents =
    teacher.teaching?.studentIds && teacher.teaching.studentIds.length > 0;

  const studentCount = hasStudents ? teacher.teaching.studentIds.length : 0;

  // Get primary role for display
  const primaryRole =
    teacher.roles && teacher.roles.length > 0 ? teacher.roles[0] : 'מורה';

  return (
    <div
      className='teacher-preview'
      onClick={() => onView(teacher._id)}
      style={{ cursor: 'pointer' }}
    >
      <div className='preview-header'>
        <div className='teacher-header-container'>
          <div className='avatar-section'>
            <div
              className='avatar'
              style={{
                backgroundColor: getRoleBadgeColor(primaryRole),
              }}
            >
              {getInitials(teacher.personalInfo.fullName)}
            </div>
          </div>

          <div className='teacher-info'>
            <h3 className='teacher-name'>{teacher.personalInfo.fullName}</h3>
            <div className='teacher-subject'>
              {teacher.professionalInfo?.instrument ? (
                <>
                  <Music size={14} />
                  <span>{teacher.professionalInfo.instrument}</span>
                </>
              ) : (
                <>
                  <GraduationCap size={14} />
                  <span>{primaryRole}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className='badges-container'>
          {teacher.roles &&
            teacher.roles.map((role) => (
              <div
                key={role}
                className='role-badge'
                style={{
                  backgroundColor: getRoleBadgeColor(role),
                }}
              >
                <span>{role}</span>
              </div>
            ))}
        </div>
      </div>

      <div className='preview-content'>
        <div className='info-row'>
          {teacher.personalInfo.phone && (
            <div className='info-item'>
              <Phone size={16} />
              <span>{teacher.personalInfo.phone}</span>
            </div>
          )}

          {teacher.personalInfo.email && (
            <div className='info-item'>
              <Mail size={16} />
              <span>{teacher.personalInfo.email}</span>
            </div>
          )}

          <div className='info-item'>
            <Users size={16} />
            <span>{getStudentCountText(studentCount)}</span>
          </div>

          {teacher.conducting?.orchestraIds &&
            teacher.conducting.orchestraIds.length > 0 && (
              <div className='info-item'>
                <Music size={16} />
                <span>
                  {teacher.conducting.orchestraIds.length === 1
                    ? 'מנצח על תזמורת אחת'
                    : `מנצח על ${teacher.conducting.orchestraIds.length} תזמורות`}
                </span>
              </div>
            )}
        </div>
      </div>

      <div className='preview-footer'>
        <div className='action-buttons'>
          <button
            className='action-btn view'
            onClick={(e) => {
              e.stopPropagation();
              onView(teacher._id);
            }}
            aria-label='הצג פרטי מורה'
          >
            <Eye size={16} />
          </button>

          <button
            className='action-btn edit'
            onClick={(e) => {
              e.stopPropagation();
              onEdit(teacher._id);
            }}
            aria-label='ערוך מורה'
          >
            <Edit size={16} />
          </button>

          {onRemove && (
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(teacher._id);
              }}
              aria-label='מחק מורה'
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className='date-info'>
          <Calendar size={14} />
          <span>
            {new Date(teacher.createdAt || Date.now()).toLocaleDateString(
              'he-IL'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
