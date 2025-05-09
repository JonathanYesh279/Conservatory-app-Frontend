// src/components/StudentDetails/sections/OrchestrasSection.tsx
import { Music, RefreshCw, ChevronUp, ChevronDown, Award } from 'lucide-react';
import { Student } from '../../../services/studentService';

interface OrchestrasSectionProps {
  student: Student;
  orchestras: any[];
  orchestrasLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onOrchestraClick: (orchestraId: string) => void;
}

export function OrchestrasSection({
  student,
  orchestras,
  orchestrasLoading,
  isOpen,
  onToggle,
  onOrchestraClick,
}: OrchestrasSectionProps) {
  if (!student) {
    return null;
  }

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Music size={16} />
        <span>תזמורות/הרכב</span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {student.academicInfo?.orchestraIds?.length > 0 ? (
            orchestrasLoading ? (
              <div className='sd-loading-section'>
                <RefreshCw size={16} className='sd-loading-icon' />
                <span>טוען נתוני תזמורת...</span>
              </div>
            ) : (
              <div className='sd-orchestras-grid'>
                {orchestras.map((orchestra) => (
                  <div
                    key={orchestra._id}
                    className='sd-orchestra-card clickable'
                    onClick={() => onOrchestraClick(orchestra._id)}
                  >
                    <Award size={20} />
                    <span>{orchestra.name}</span>
                    {orchestra.type && (
                      <span className='sd-orchestra-type'>
                        {orchestra.type}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className='sd-no-orchestra-warning'>
              התלמיד אינו משתתף בתזמורות
            </div>
          )}
        </div>
      )}
    </div>
  );
}
