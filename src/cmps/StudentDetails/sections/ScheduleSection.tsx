// React import removed - not needed for JSX in modern React
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { StudentScheduleView } from '../../Schedule';

interface ScheduleSectionProps {
  studentId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function ScheduleSection({ studentId, isOpen, onToggle }: ScheduleSectionProps) {
  return (
    <div className="details-section">
      <div
        className={`section-header clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <div className="section-title">
          <Calendar size={16} />
          <span>מערכת שעות</span>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="toggle-icon" />
        ) : (
          <ChevronDown size={16} className="toggle-icon" />
        )}
      </div>

      {isOpen && (
        <div className="section-content schedule-section-content">
          <StudentScheduleView
            studentId={studentId}
            showTeacherLinks={true}
            showPrintButton={true}
          />
        </div>
      )}
    </div>
  );
}

export default ScheduleSection;