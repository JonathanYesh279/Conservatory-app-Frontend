// src/cmps/StudentDetails/sections/OrchestrasSection.tsx
import { ChevronDown, ChevronUp, Music, Award, RefreshCw } from 'lucide-react';
import { Student } from '../../../services/studentService';
import { Orchestra } from '../../../services/orchestraService';
import { useEffect, useState, useRef } from 'react';

interface OrchestrasSectionProps {
  student: Student;
  orchestras: Orchestra[];
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
  // Use a ref to track if the component has already created placeholders
  const placeholdersCreated = useRef(false);

  // Create placeholders for orchestras that haven't loaded yet
  const [placeholderOrchestras, setPlaceholderOrchestras] = useState<any[]>([]);

  // Get orchestra IDs from both possible locations in the student object
  // Use useMemo to prevent recalculation on every render
  const studentOrchestraIds = student
    ? [
        ...(student.enrollments?.orchestraIds || []),
      ].filter((id) => id)
    : []; // Remove any undefined/null/empty values

  // Determine if we have any orchestra IDs
  const hasOrchestras = studentOrchestraIds.length > 0;

  // Create placeholder orchestras only once if needed
  useEffect(() => {
    // Only run this if:
    // 1. We have orchestra IDs
    // 2. We don't have actual orchestras
    // 3. We're not currently loading orchestras
    // 4. We haven't already created placeholders
    if (
      studentOrchestraIds.length > 0 &&
      orchestras.length === 0 &&
      !orchestrasLoading &&
      !placeholdersCreated.current
    ) {
      // Create placeholders based on IDs
      const placeholders = studentOrchestraIds.map((id) => ({
        _id: id,
        name: `תזמורת ${id.slice(-4)}`,
        type: '',
        isPlaceholder: true,
      }));

      setPlaceholderOrchestras(placeholders);
      placeholdersCreated.current = true; // Mark that we've created placeholders
    }
  }, [studentOrchestraIds, orchestras.length, orchestrasLoading]);

  // Reset the placeholders created flag when the student or orchestras change
  useEffect(() => {
    return () => {
      placeholdersCreated.current = false; // Reset when component unmounts
    };
  }, [student._id]); // Only reset when student changes

  // Determine if we should use placeholder data
  const shouldUsePlaceholders =
    studentOrchestraIds.length > 0 &&
    orchestras.length === 0 &&
    !orchestrasLoading &&
    placeholderOrchestras.length > 0;

  return (
    <div className='sd-section'>
      <div
        className={`sd-section-title clickable ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <Music size={16} />
        <span>
          תזמורות/הרכב {hasOrchestras ? `(${studentOrchestraIds.length})` : ''}
        </span>
        {isOpen ? (
          <ChevronUp size={18} className='sd-toggle-icon' />
        ) : (
          <ChevronDown size={18} className='sd-toggle-icon' />
        )}
      </div>

      {isOpen && (
        <div className='sd-section-content'>
          {orchestrasLoading ? (
            <div className='sd-loading-indicator'>
              <RefreshCw size={16} className='spin' />
              <span>טוען נתוני תזמורת...</span>
            </div>
          ) : !hasOrchestras ? (
            <div className='sd-empty-state'>התלמיד אינו משתתף בתזמורות</div>
          ) : shouldUsePlaceholders ? (
            // Use placeholder data when orchestras haven't loaded yet
            <div className='sd-orchestras-grid'>
              {placeholderOrchestras.map((orchestra) => (
                <div
                  key={orchestra._id}
                  className='sd-orchestra-card clickable sd-orchestra-placeholder'
                  onClick={() => onOrchestraClick(orchestra._id)}
                >
                  <Award size={20} />
                  <span>{orchestra.name}</span>
                </div>
              ))}
            </div>
          ) : (
            // Use fully loaded orchestras data
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
                    <span className='sd-orchestra-type'>{orchestra.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
