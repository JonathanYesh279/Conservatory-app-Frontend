// src/cmps/TeacherPreview.tsx
import { Teacher } from '../services/teacherService';
import {
  Edit,
  Trash2,
  Music,
  Users,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
} from 'lucide-react';
import { openWhatsApp } from '../utils/phoneUtils.ts'; // Import the utility function
import { AuthorizationContext, useAuthorization } from '../utils/authorization';

interface TeacherPreviewProps {
  teacher: Teacher;
  onView: (teacherId: string) => void;
  onEdit: (teacherId: string) => void;
  onRemove?: (teacherId: string) => void;
  studentCount?: number; // Add optional student count prop
  authContext?: AuthorizationContext;
}

export function TeacherPreview({
  teacher,
  onView,
  onEdit,
  onRemove,
  studentCount,
  authContext,
}: TeacherPreviewProps) {
  // Safety check for teacher data
  if (!teacher || !teacher.personalInfo) {
    console.error('TeacherPreview: Invalid teacher data', teacher);
    return null;
  }

  // Initialize authorization
  const auth = authContext ? useAuthorization(authContext) : null;

  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return 'NA';
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

  // Handle WhatsApp click
  const handleWhatsAppClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation(); // Prevent triggering the parent onClick (opening details)
    openWhatsApp(phone);
  };

  // Use provided studentCount prop, fallback to teacher.teaching.studentIds if not provided
  const actualStudentCount = studentCount !== undefined 
    ? studentCount 
    : (teacher.teaching?.studentIds?.length || 0);

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
        <div className='header-row'>
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
        </div>
      </div>

      <div className='preview-content'>
        <div className='info-row'>
          {teacher.personalInfo.phone && (
            <div className='info-item'>
              <Phone size={16} />
              <span
                className='clickable-phone'
                onClick={(e) =>
                  teacher.personalInfo.phone && handleWhatsAppClick(e, teacher.personalInfo.phone)
                }
                title='לחץ לפתיחת שיחה בוואטסאפ'
              >
                {teacher.personalInfo.phone}
              </span>
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
            <span>{getStudentCountText(actualStudentCount)}</span>
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
          {/* Get permissions for this teacher */}
          {(() => {
            const permissions = auth?.getTeacherActionPermissions(teacher) || {
              canEdit: true,
              canDelete: true,
              showEditButton: true,
              showDeleteButton: true
            };
            
            return (
              <>
                {permissions.showEditButton && (
                  <button
                    className='action-btn edit'
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(teacher._id);
                    }}
                    aria-label='ערוך מורה'
                  >
                    <Edit size={20} />
                  </button>
                )}

                {permissions.showDeleteButton && onRemove && (
                  <button
                    className='action-btn delete'
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(teacher._id);
                    }}
                    aria-label='מחק מורה'
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </>
            );
          })()}
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
