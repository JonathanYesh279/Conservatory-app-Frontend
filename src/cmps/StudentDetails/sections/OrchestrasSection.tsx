// src/components/StudentDetails/sections/OrchestrasSection.tsx
import { Music, RefreshCw } from 'lucide-react';
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
  return (
    <div className='section'>
      <div
        className={`section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Music size={16} />
        <span>תזמורות/הרכב</span>
      </div>

      {isOpen && (
        <div className='section-content'>
          {student.enrollments?.orchestraIds?.length > 0 ? (
            orchestrasLoading ? (
              <div className='loading-section'>
                <RefreshCw size={16} className='loading-icon' />
                <span>טוען נתוני תזמורת...</span>
              </div>
            ) : (
              <div className='orchestras-grid'>
                {orchestras.map((orchestra) => (
                  <div
                    key={orchestra._id}
                    className='orchestra-card clickable'
                    onClick={() => onOrchestraClick(orchestra._id)}
                  >
                    <span>{orchestra.name}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className='no-orchestra-warning'>
              התלמיד אינו משתתף בתזמורות
            </div>
          )}
        </div>
      )}
    </div>
  );
}
