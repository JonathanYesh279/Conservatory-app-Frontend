// src/cmps/OrchestraPreview.tsx
import { Orchestra } from '../services/orchestraService';
import { Edit, Trash2, Music, Users, Calendar, Eye } from 'lucide-react';

interface OrchestraPreviewProps {
  orchestra: Orchestra;
  onView: (orchestraId: string) => void;
  onEdit?: (orchestraId: string) => void;
  onRemove?: (orchestraId: string) => void;
}

export function OrchestraPreview({
  orchestra,
  onView,
  onEdit,
  onRemove,
}: OrchestraPreviewProps) {
  // Get background color based on orchestra type
  const getTypeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      הרכב: '#4D55CC', // Primary color
      תזמורת: '#28A745', // Success color
    };
    return typeColors[type] || '#6c757d'; // Default color
  };

  // Format the count of members
  const getMembersCountText = (count: number): string => {
    if (count === 0) return '0 תלמידים';
    if (count === 1) return 'תלמיד אחד';
    return `${count} תלמידים`;
  };

  // Format the count of rehearsals
  const getRehearsalsCountText = (count: number): string => {
    if (!count) return 'אין חזרות';
    if (count === 1) return 'חזרה אחת';
    return `${count} חזרות`;
  };

  // Check if orchestra has members and rehearsals
  const hasMembers = orchestra.memberIds && orchestra.memberIds.length > 0;
  const hasRehearsals =
    orchestra.rehearsalIds && orchestra.rehearsalIds.length > 0;

  const memberCount = hasMembers ? orchestra.memberIds.length : 0;
  const rehearsalCount = hasRehearsals ? orchestra.rehearsalIds.length : 0;

  return (
    <div
      className='orchestra-preview'
      onClick={() => onView(orchestra._id)}
      style={{ cursor: 'pointer' }}
    >
      <div className='preview-header'>
        <div className='orchestra-header-container'>
          <div className='avatar-section'>
            <div
              className='avatar'
              style={{
                backgroundColor: getTypeColor(orchestra.type),
              }}
            >
              <Music size={20} />
            </div>
          </div>

          <div className='orchestra-info'>
            <h3 className='orchestra-name'>{orchestra.name}</h3>
            <div className='orchestra-type'>
              <Users size={14} />
              <span>{getMembersCountText(memberCount)}</span>
            </div>
          </div>
        </div>

        <div className='badges-container'>
          <div
            className='type-badge'
            style={{
              backgroundColor: getTypeColor(orchestra.type),
            }}
          >
            <span>{orchestra.type}</span>
          </div>
        </div>
      </div>

      <div className='preview-content'>
        <div className='info-row'>
          <div className='info-item'>
            <Calendar size={16} />
            <span>{getRehearsalsCountText(rehearsalCount)}</span>
          </div>

          {/* We can add additional info here if needed */}
        </div>
      </div>

      <div className='preview-footer'>
        <div className='action-buttons'>
          <button
            className='action-btn view'
            onClick={(e) => {
              e.stopPropagation();
              onView(orchestra._id);
            }}
            aria-label='הצג פרטי תזמורת'
          >
            <Eye size={16} />
          </button>

          {onEdit && (
            <button
              className='action-btn edit'
              onClick={(e) => {
                e.stopPropagation();
                onEdit(orchestra._id);
              }}
              aria-label='ערוך תזמורת'
            >
              <Edit size={16} />
            </button>
          )}

          {onRemove && (
            <button
              className='action-btn delete'
              onClick={(e) => {
                e.stopPropagation();
                onRemove(orchestra._id);
              }}
              aria-label='מחק תזמורת'
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className='date-info'>
          <Calendar size={14} />
          <span>
            {new Date(orchestra.createdAt || Date.now()).toLocaleDateString(
              'he-IL'
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
