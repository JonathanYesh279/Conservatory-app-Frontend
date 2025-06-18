import React, { useState } from 'react';
import { useScheduleConflicts } from '../../hooks/useScheduleConflicts';

interface ScheduleConflictIndicatorProps {
  slotId: string;
  showDetails?: boolean;
  className?: string;
}

const ScheduleConflictIndicator: React.FC<ScheduleConflictIndicatorProps> = ({
  slotId,
  showDetails = false,
  className = ''
}) => {
  const { 
    isSlotConflicting, 
    getSlotConflicts, 
    getConflictDescription, 
    getConflictSuggestions 
  } = useScheduleConflicts();
  
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Check if the slot has conflicts
  const hasConflict = isSlotConflicting(slotId);
  
  // Get conflict details if applicable
  const conflicts = hasConflict ? getSlotConflicts(slotId) : [];
  
  if (!hasConflict) {
    return null;
  }
  
  // Toggle tooltip visibility
  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };
  
  // Hide tooltip
  const hideTooltip = () => {
    setShowTooltip(false);
  };
  
  // Basic indicator with no details
  if (!showDetails) {
    return (
      <div 
        className={`schedule-conflict-indicator ${className}`}
        title={conflicts.map(c => getConflictDescription(c)).join('\n')}
      >
        <span className="conflict-icon" aria-label="Schedule conflict detected">
          !
        </span>
      </div>
    );
  }
  
  // Detailed indicator with tooltip
  return (
    <div className={`schedule-conflict-indicator detailed ${className}`}>
      <button 
        className="conflict-button"
        onClick={toggleTooltip}
        onBlur={hideTooltip}
        aria-expanded={showTooltip}
      >
        <span className="conflict-icon" aria-hidden="true">!</span>
        <span className="conflict-label">Conflict</span>
      </button>
      
      {showTooltip && (
        <div className="conflict-tooltip">
          <div className="tooltip-header">
            <h4>Schedule Conflicts</h4>
            <button className="close-tooltip" onClick={hideTooltip}>×</button>
          </div>
          
          <div className="conflicts-list">
            {conflicts.map((conflict, index) => (
              <div key={index} className="conflict-item">
                <p className="conflict-description">
                  {getConflictDescription(conflict)}
                </p>
                
                <h5>Suggestions:</h5>
                <ul className="suggestions-list">
                  {getConflictSuggestions(conflict).map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleConflictIndicator;